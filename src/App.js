import React, { useState, useEffect, useRef } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, updateDoc, arrayUnion, arrayRemove, writeBatch, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
// All icons used, including new ones for MySpace, Skills, and Benefits page
// Added Sun, Cloud, CloudRain, Zap, Shield for Vibe Check
// Added MessageCircleQuestion, Archive, Sparkles, HandHeart for Clarity Hub
// Added icons for expression studio
import { CheckCircle, Plus, Trash2, Calendar, User, LogOut, Home, Users, DollarSign, Settings, Bell, Lightbulb, Send, Globe, Lock, UserCheck, BookOpen, MessageSquare, Mic, XCircle, Palette, Music, Laugh, Feather, Heart, Award, UserSquare, GraduationCap, Clock, Sun, Cloud, CloudRain, Zap, Shield, MessageCircleQuestion, Archive, Sparkles, HandHeart, Edit, Image, PenTool } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Task related states
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskIsPrivate, setNewTaskIsPrivate] = useState(false);
  const [householdMembers, setHouseholdMembers] = useState([]);

  // Clarity Hub states (combining/replacing featureRequests and syncSessionIdeas)
  const [clarityMessages, setClarityMessages] = useState([]); // For active messages
  const [resolvedAgreements, setResolvedAgreements] = useState([]); // For archived agreements
  const [newClarityMessage, setNewClarityMessage] = useState({ title: '', observation: '', question: '', suggestedResolution: '' });

  // Quick add in header state
  const [quickAddTaskText, setQuickAddTaskText] = useState('');

  // Dynamic Categories state
  const [availableCategories, setAvailableCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  // States for Harmony Gallery & Bard Booth (now also holds user-created expressions)
  const [harmonyCreatives, setHarmonyCreatives] = useState([]);
  const [newCreativeContent, setNewCreativeContent] = useState('');
  const [newCreativeTitle, setNewCreativeTitle] = useState('');
  const [newCreativeType, setNewCreativeType] = useState('joke');

  // MySpace (User Profile) states
  const [myAvailabilityStatus, setMyAvailabilityStatus] = useState('Available for Tasks');
  const [mySpaceNotes, setMySpaceNotes] = useState('');
  const [myCurrentVibe, setMyCurrentVibe] = useState(''); // User's self-selected vibe

  // Skill Hub states
  const [trainingRequests, setTrainingRequests] = useState([]);
  const [newTrainingSkill, setNewTrainingSkill] = useState('');
  const [newTrainingType, setNewTrainingType] = useState('Internal');
  const [newTrainingNotes, setNewTrainingNotes] = useState('');
  const [currentSkills, setCurrentSkills] = useState([]);

  // Pre-login vibe check state
  const [initialVibeSelected, setInitialVibeSelected] = useState(false);
  const [currentPreLoginVibe, setCurrentPreLoginVibe] = useState(''); // Holds temp vibe until user doc is ready

  // Harmony Narrative Booth/Emotional Story Weaver states
  const [showNarrativeBoothModal, setShowNarrativeBoothModal] = useState(false);
  const [selectedNarrativeEmotions, setSelectedNarrativeEmotions] = useState([]);
  const [matchedNarrative, setMatchedNarrative] = useState(null);
  const [narrativeFeedback, setNarrativeFeedback] = useState(null); // 'spot-on', 'close', 'nope'

  // Personal Expression Studio states
  const [showExpressionStudioModal, setShowExpressionStudioModal] = useState(false);
  const [newExpressionType, setNewExpressionType] = useState('poem'); // poem, song-lyrics, comic-book
  const [newExpressionIsPrivate, setNewExpressionIsPrivate] = useState(false);
  const [comicPanels, setComicPanels] = useState([{ imageUrl: '', caption: '' }]); // For comic book creation

  // Resonance Broadcast state (for Dashboard display)
  const [vulnerabilityBroadcasts, setVulnerabilityBroadcasts] = useState([]);

  // --- Core Data Arrays (can be moved to Firestore later for full dynamic control) ---
  const vibeOptions = [
    { label: "Sunny & Optimistic", value: "Sunny & Optimistic", icon: Sun, color: "text-yellow-500" },
    { label: "Calm & Reflective", value: "Calm & Reflective", icon: Cloud, color: "text-blue-400" },
    { label: "A Bit Stormy (Vulnerable)", value: "A Bit Stormy", icon: CloudRain, color: "text-indigo-500" },
    { label: "Energized & Ready", value: "Energized & Ready", icon: Zap, color: "text-green-500" },
    { label: "Feeling Vulnerable", value: "Feeling Vulnerable", icon: Shield, color: "text-gray-500" },
  ];

  const initialDefaultCategories = [
    'General', 'Cleaning', 'Cooking & Meal Prep', 'Shopping & Errands',
    'Yard Work & Outdoor', 'Pet Care', 'Home Maintenance & Repairs',
    'Bills & Finances', 'Appointments & Planning', 'Vehicle Maintenance',
    'Tech & Gadgets', 'Donations & Decluttering', 'Health & Wellness'
  ];

  // Brené Brown's 87 Emotions & Experiences (from Atlas of the Heart)
  const humanEmotionsAtlas = [
    {
      category: "PLACES WE GO WHEN Things Are Uncertain Or Too Much",
      emotions: [
        "Stress", "Overwhelm", "Anxiety", "Worry", "Vulnerability"
      ]
    },
    {
      category: "PLACES WE GO WHEN We Compare",
      emotions: [
        "Comparison", "Admiration", "Reverence", "Envy", "Jealousy"
      ]
    },
    {
      category: "PLACES WE GO WHEN Things Don't Go As Planned",
      emotions: [
        "Boredom", "Disappointment", "Expectations", "Discouragement",
        "Regret", "Avoidance", "Resentment", "Frustration", "Dread", "Fear", "Resignation"
      ]
    },
    {
      category: "PLACES WE GO WHEN It's Beyond Us",
      emotions: [
        "Awe", "Wonder", "Confusion", "Curiosity", "Interest", "Surprise"
      ]
    },
    {
      category: "PLACES WE GO WHEN Things Aren't What They Seem",
      emotions: [
        "Amusement", "Bittersweetness", "Nostalgia", "Cognitive Dissonance",
        "Paradox", "Irony", "Sarcasm", "Excitement", "Schadenfreude", "Freudenfreude"
      ]
    },
    {
      category: "PLACES WE GO WHEN We're Hurting",
      emotions: [
        "Anguish", "Hopelessness", "Despair", "Sadness", "Grief", "Hurt"
      ]
    },
    {
      category: "PLACES WE GO With Others",
      emotions: [
        "Compassion", "Pity", "Empathy", "Sympathy", "Boundaries", "Comparative Suffering"
      ]
    },
    {
      category: "PLACES WE GO WHEN We Fall Short",
      emotions: [
        "Shame", "Self-Compassion", "Perfectionism", "Guilt", "Humiliation", "Embarrassment"
      ]
    },
    {
      category: "PLACES WE GO WHEN We Search for Connection",
      emotions: [
        "Belonging", "Fitting In", "Connection", "Disconnection", "Insecurity", "Invisibility", "Loneliness"
      ]
    },
    {
      category: "PLACES WE GO WHEN The Heart Is Open",
      emotions: [
        "Love", "Lovelessness", "Heartbreak", "Trust", "Self-Trust", "Betrayal", "Defensiveness", "Flooding"
      ]
    },
    {
      category: "PLACES WE GO WHEN Life Is Good",
      emotions: [
        "Joy", "Happiness", "Calm", "Contentment", "Gratitude", "Foreboding Joy", "Relief", "Tranquility"
      ]
    },
    {
      category: "PLACES WE GO WHEN We Feel Wronged",
      emotions: [
        "Anger", "Contempt", "Disgust", "Dehumanization", "Hate", "Self-Righteousness"
      ]
    },
    {
      category: "PLACES WE GO To Self-Assess",
      emotions: [
        "Pride", "Hubris", "Humility"
      ]
    }
  ];

  // --- Auth State Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            availabilityStatus: 'Available for Tasks',
            mySpaceNotes: 'Ready to harmonize!',
            currentVibe: currentPreLoginVibe || 'Unknown - Fresh to the Scene',
            skills: [],
            createdAt: new Date()
          });
          // New user, force vibe selection
          setInitialVibeSelected(false);
        } else {
          const userData = userSnap.data();
          if (userData.currentVibe) {
            setInitialVibeSelected(true);
            setMyCurrentVibe(userData.currentVibe);
          } else {
            // Existing user but no vibe set yet, force selection
            setInitialVibeSelected(false);
          }
        }
      } else {
        // User logs out
        setInitialVibeSelected(false);
        setMyCurrentVibe('');
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Data Loading on User Change ---
  useEffect(() => {
    if (user) {
      loadTasks();
      loadClarityMessages();
      loadCategories();
      loadHarmonyCreatives();
      loadHouseholdMembers();
      loadMySpaceInfo();
      loadTrainingRequests();
      loadMySkills();
      loadVulnerabilityBroadcasts(); // Load broadcasts on login
    } else {
      setTasks([]);
      setClarityMessages([]);
      setResolvedAgreements([]);
      setAvailableCategories([]);
      setHarmonyCreatives([]);
      setHouseholdMembers([]);
      setMyAvailabilityStatus('Available for Tasks');
      setMySpaceNotes('');
      setMyCurrentVibe('');
      setTrainingRequests([]);
      setCurrentSkills([]);
      setVulnerabilityBroadcasts([]); // Clear broadcasts on logout
    }
  }, [user]);

  // --- General Vibe Selection (Pre-login / MySpace) ---
  const handleVibeSelection = async (vibe) => {
    setMyCurrentVibe(vibe);
    setCurrentPreLoginVibe(vibe); // This is needed for the pre-login UI
    setInitialVibeSelected(true);
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { currentVibe: vibe });
        alert(`Your current vibe is: ${vibe}. Welcome to the Hub, co-creator of harmony!`);
        await loadHouseholdMembers();
      } catch (error) {
        console.error('Error updating user vibe:', error);
        alert('Could not set your vibe. The universe is being uncooperative. Try again, brave soul.');
      }
    }
  };

  // --- Firestore Operations for Users/Profiles ---
  const loadHouseholdMembers = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users'), orderBy('displayName'));
      const querySnapshot = await getDocs(q);
      const members = [];
      querySnapshot.forEach(d => members.push({ id: d.id, ...d.data() }));
      setHouseholdMembers(members);
    } catch (error) {
      console.error('Detailed Error loading household members:', error.code, error.message, error);
      alert("Failed to load our awesome household members. Are they hiding from chores?");
    }
  };

  const loadMySpaceInfo = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMyAvailabilityStatus(data.availabilityStatus || 'Available for Tasks');
        setMySpaceNotes(data.mySpaceNotes || '');
        setCurrentSkills(data.skills || []);
        setMyCurrentVibe(data.currentVibe || 'Unknown');
      }
    } catch (error) {
      console.error('Error loading MySpace info:', error);
      alert("Couldn't retrieve your personal harmony settings. Perhaps the cosmic alignment is off.");
    }
  };

  const updateMySpaceInfo = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        availabilityStatus: myAvailabilityStatus,
        mySpaceNotes: mySpaceNotes,
        updatedAt: new Date(),
        currentVibe: myCurrentVibe
      });
      alert("Your MySpace status has been updated! Now everyone knows if you're avoiding them... I mean, focusing on deep work.");
      await loadHouseholdMembers();
    } catch (error) {
      console.error('Error updating MySpace info:', error);
      alert("Failed to update your MySpace. Did you try shouting your status updates instead?");
    }
  };

  // --- Firestore Operations for Categories ---
  const categoriesDocRef = doc(db, 'appConfig', 'categories');

  const loadCategories = async () => {
    try {
      const docSnap = await getDoc(categoriesDocRef);
      if (docSnap.exists() && docSnap.data().categoryList) {
        setAvailableCategories(docSnap.data().categoryList);
      } else {
        const defaultCategories = initialDefaultCategories;
        await setDoc(categoriesDocRef, { categoryList: defaultCategories }, { merge: true });
        setAvailableCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setAvailableCategories(initialDefaultCategories);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
        alert("A category needs a name, even if it's 'Existential Dread.'");
        return;
    }

    const formattedCategory = newCategoryName.trim().charAt(0).toUpperCase() + newCategoryName.trim().slice(1).toLowerCase();

    if (availableCategories.some(cat => cat.toLowerCase() === formattedCategory.toLowerCase())) {
        alert('Seriously, we already have that category. Pay attention to the shared mental load, darling!');
        setNewCategoryName('');
        return;
    }

    try {
      await updateDoc(categoriesDocRef, {
        categoryList: arrayUnion(formattedCategory)
      }, { merge: true });
      setNewCategoryName('');
      await loadCategories();
      alert(`Category "${formattedCategory}" added. Another perfectly valid box for our collective chaos!`);
    } catch (error) {
      console.error('Error adding category:', error);
      alert("Oh dear, the category didn't stick. Probably a cosmic joke, not a bug.");
    }
  };

  const removeCategory = async (categoryToRemove) => {
    if (!window.confirm(`Are you absolutely sure you want to banish "${categoryToRemove}" to the void? This won't change existing tasks, just new ones. No take-backsies (unless you add it again, of course).`)) {
      return;
    }
    try {
      await updateDoc(categoriesDocRef, {
        categoryList: arrayRemove(categoryToRemove)
      });
      await loadCategories();
      alert(`Category "${categoryToRemove}" removed. The circle of life for our labeling system continues!`);
    } catch (error) {
      console.error('Error removing category:', error);
      alert("Tried to delete a category, but it seems to have a mind of its own. Typical.");
    }
  };

  // --- Auth Actions ---
  const signInWithGoogle = async () => {
    if (!myCurrentVibe && !user) { // Use myCurrentVibe from state, not pre-login temp
      alert("Please select your current vibe before signing in. We welcome all frequencies!");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert("Sign-in failed. Did you forget your Google password? Or perhaps the universe is just testing our harmony.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      alert("Can't escape that easily! Just kidding, sign out failed for some reason. Maybe it loves you too much.");
    }
  };

  // --- Task Operations ---
  const loadTasks = async () => {
    if (!user) return;
    
    try {
      const qPrivate = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const qShared = query(
        collection(db, 'tasks'),
        where('isPrivate', '==', false),
        where('userId', '!=', user.uid),
        orderBy('createdAt', 'desc')
      );

      const [privateSnapshot, sharedSnapshot] = await Promise.all([
        getDocs(qPrivate),
        getDocs(qShared),
      ]);

      const loadedTasksMap = new Map();
      privateSnapshot.forEach((doc) => {
        loadedTasksMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
      sharedSnapshot.forEach((doc) => {
        if (!loadedTasksMap.has(doc.id)) {
          loadedTasksMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
      
      const allLoadedTasks = Array.from(loadedTasksMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      setTasks(allLoadedTasks);

    } catch (error) {
      console.error('Error loading tasks:', error);
      alert("Failed to load tasks. Perhaps they're hiding because they haven't been assigned yet?");
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !user) {
        alert("Oh, come on. Even I need *some* input. Don't leave tasks to the imagination like unpeeled potatoes!");
        return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        text: newTask,
        completed: false,
        userId: user.uid,
        userName: user.displayName,
        isPrivate: newTaskIsPrivate,
        assignedTo: null,
        assignedToName: null,
        category: newTaskCategory || 'General',
        createdAt: new Date()
      });
      setNewTask('');
      setNewTaskCategory('');
      setNewTaskIsPrivate(false);
      await loadTasks();
      alert(`Task "${newTask}" added. Your intention is now rippling into the household energetic field. Keep tuning!`);
    } catch (error) {
      console.error('Error adding task:', error);
      alert("Manifesting failed for this task. Maybe your intention wave was intercepted by a rogue squirrel of doubt.");
    }
  };

  const handleQuickAddTask = async (e) => {
    e.preventDefault();
    if (!quickAddTaskText.trim() || !user) {
        alert("You're awake! But your quick thought vanished? Try typing something first, or perhaps hum it into existence.");
        return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        text: quickAddTaskText,
        completed: false,
        userId: user.uid,
        userName: user.displayName,
        isPrivate: false,
        assignedTo: null,
        assignedToName: null,
        category: 'General',
        createdAt: new Date()
      });
      setQuickAddTaskText('');
      await loadTasks();
      alert(`Quick task "${quickAddTaskText}" manifested! Another item for the grand ballet of domestic bliss!`);
    } catch (error) {
      console.error('Error adding quick task:', error);
      alert("Failed to quickly add task. Is it a sign you should just go back to bed?");
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you *sure* you want to delete this task? Think of the ripple effect on household harmony!")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      await loadTasks();
      alert("Task evaporated. Poof! Hope it wasn't the 'feed the cat' one.");
    } catch (error) {
      console.error('Error deleting task:', error);
      alert("Failed to delete task. It's clinging on, just like that one unresolved argument.");
    }
  };

  const toggleTaskCompletion = async (task) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        completed: !task.completed
      });
      await loadTasks();
      if (!task.completed) {
        alert(`Congratulations, ${user.displayName}! You've manifested the completion of "${task.text}"! A true hero of the harmonious home.`);
      } else {
        alert(`"${task.text}" is back on the list. Did you miss it? Or just enjoy the thrill of re-doing things?`);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      alert("Couldn't flip the completion switch. Maybe the task is in a rebellious phase?");
    }
  };

  const assignTask = async (taskId, assignedUserUid, assignedUserName) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        assignedTo: assignedUserUid,
        assignedToName: assignedUserName,
      });
      await loadTasks();
      if (assignedUserUid) {
        alert(`Huzzah! "${assignedUserName}" has bravely attuned to this task's frequency! Let the shared mental load commence!`);
      } else {
        alert("Task unassigned. Who knew freedom could feel so... unburdened?");
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      alert("Assignment failed. Perhaps the task is too complex for human understanding, or it's just really bad at commitment.");
    }
  };

  // --- Clarity Hub Operations (combining previous Feature Requests and Sync Session Ideas) ---
  const clarityMessagesCollection = collection(db, 'clarityMessages');
  const resolvedAgreementsCollection = collection(db, 'resolvedAgreements');

  const loadClarityMessages = async () => {
    if (!user) return;
    try {
      const activeQ = query(clarityMessagesCollection, orderBy('createdAt', 'desc'));
      const activeSnapshot = await getDocs(activeQ);
      const loadedActive = activeSnapshot.map(d => ({ id: d.id, ...d.data() }));
      setClarityMessages(loadedActive);

      const resolvedQ = query(resolvedAgreementsCollection, orderBy('resolvedAt', 'desc'));
      const resolvedSnapshot = await getDocs(resolvedQ);
      const loadedResolved = resolvedSnapshot.map(d => ({ id: d.id, ...d.data() }));
      setResolvedAgreements(loadedResolved);

    } catch (error) {
      console.error('Error loading clarity messages:', error);
      alert("Failed to load clarity messages. Is everyone being perfectly clear, or just avoiding the hard conversations?");
    }
  };

  const addClarityMessage = async (e) => {
    e.preventDefault();
    if (!newClarityMessage.title.trim() || !newClarityMessage.observation.trim() || !newClarityMessage.question.trim() || !user) {
      alert("To truly manifest clarity, please provide a Title, Observation, and a clear Question.");
      return;
    }

    try {
      await addDoc(clarityMessagesCollection, {
        title: newClarityMessage.title,
        observation: newClarityMessage.observation,
        question: newClarityMessage.question,
        suggestedResolution: newClarityMessage.suggestedResolution.trim() || null,
        userId: user.uid,
        userName: user.displayName,
        createdAt: new Date(),
        status: 'Needs Discussion'
      });
      setNewClarityMessage({ title: '', observation: '', question: '', suggestedResolution: '' });
      await loadClarityMessages();
      alert("Message for Clarity added! The path to shared understanding is now illuminated.");
    } catch (error) {
      console.error('Error adding clarity message:', error);
      alert("Failed to send forth your message for clarity. Perhaps the cosmic stage is too noisy right now.");
    }
  };

  const resolveClarityMessage = async (message) => {
    if (!window.confirm(`Are you sure this message for clarity is RESOLVED? It will be moved to the archive, never to be seen as an active issue again (unless we create a new one, of course).`)) {
      return;
    }
    try {
      await addDoc(resolvedAgreementsCollection, {
        originalTitle: message.title,
        originalObservation: message.observation,
        originalQuestion: message.question,
        agreedResolution: "Resolution documented in comments/discussion (or not, if we agreed to disagree gracefully).",
        resolvedBy: user.uid,
        resolvedByName: user.displayName,
        resolvedAt: new Date()
      });
      await deleteDoc(doc(clarityMessagesCollection, message.id));
      await loadClarityMessages();
      alert(`Message "${message.title}" resolved and archived. Another harmonious agreement achieved!`);
    } catch (error) {
      console.error('Error resolving clarity message:', error);
      alert("Failed to resolve message. It seems some conflicts refuse to be harmonized.");
    }
  };

  const deleteClarityMessage = async (messageId, messageTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${messageTitle}"? This will vanish without a trace.`)) {
      return;
    }
    try {
      await deleteDoc(doc(clarityMessagesCollection, messageId));
      await loadClarityMessages();
      alert(`Message "${messageTitle}" vanished. Poof!`);
    } catch (error) {
      console.error('Error deleting clarity message:', error);
      alert("Couldn't delete message. It's clinging to existence like that last bit of stubborn grime.");
    }
  };

  // --- Harmony Creatives Operations (now includes user-created expressions) ---
  const loadHarmonyCreatives = async () => {
    if (!user) return;
    try {
      // Fetch both public and private (user's own) expressions
      const qShared = query(collection(db, 'harmonyCreatives'), where('privacy', '==', 'shared'), orderBy('createdAt', 'desc'));
      const qPrivateUser = query(collection(db, 'harmonyCreatives'), where('privacy', '==', 'private'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

      const [sharedSnapshot, privateUserSnapshot] = await Promise.all([
          getDocs(qShared),
          getDocs(qPrivateUser)
      ]);
      
      const loadedCreativesMap = new Map();
      sharedSnapshot.forEach(doc => loadedCreativesMap.set(doc.id, { id: doc.id, ...doc.data() }));
      privateUserSnapshot.forEach(doc => loadedCreativesMap.set(doc.id, { id: doc.id, ...doc.data() }));

      const allLoadedCreatives = Array.from(loadedCreativesMap.values()).sort((a,b) => b.createdAt - a.createdAt);
      setHarmonyCreatives(allLoadedCreatives);

    } catch (error) {
      console.error('Error loading creative content:', error);
      alert("Failed to load the masterpieces. Perhaps the muses are on coffee break?");
    }
  };


  const addHarmonyCreative = async (e) => {
    e.preventDefault();
    if (!newCreativeContent.trim() || !user) {
        alert("Don't be shy! Share your brilliance, even if it's just a doodle or a bad pun.");
        return;
    }

    try {
      await addDoc(collection(db, 'harmonyCreatives'), {
        type: newCreativeType,
        title: newCreativeTitle.trim() || `Untitled ${newCreativeType}`,
        content: newCreativeContent,
        userId: user.uid,
        userName: user.displayName,
        createdAt: new Date(),
        privacy: newExpressionIsPrivate ? 'private' : 'shared', // New privacy field
        comicPanels: newExpressionType === 'comic-book' ? comicPanels : null, // Store comic panel data
      });
      setNewCreativeContent('');
      setNewCreativeTitle('');
      setNewCreativeType('joke'); // Reset to default
      setNewExpressionIsPrivate(false);
      setComicPanels([{ imageUrl: '', caption: '' }]); // Reset comic panels
      await loadHarmonyCreatives();
      alert(`Your ${newCreativeType} has been added to the Harmony Gallery! Prepare for applause... or polite silence.`);
      setShowExpressionStudioModal(false); // Close modal after submission
    } catch (error) {
      console.error('Error adding creative content:', error);
      alert("The artistic inspiration failed to upload. The internet must be judging your abstract expressionism.");
    }
  };

  const deleteHarmonyCreative = async (creativeId, creativeType) => {
    if (!window.confirm(`Are you really sure you want to delete this ${creativeType}? Think of the cultural loss!`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'harmonyCreatives', creativeId));
      await loadHarmonyCreatives();
      alert(`The ${creativeType} has been removed. Farewell, brave art!`);
    } catch (error) {
      console.error('Error deleting creative content:', error);
      alert("This piece of art is fiercely resisting deletion. It knows its worth.");
    }
  };

  // --- Skill Hub Operations ---
  const loadTrainingRequests = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'trainingRequests'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const requests = [];
      querySnapshot.forEach(d => requests.push({ id: d.id, ...d.data() }));
      setTrainingRequests(requests);
    } catch (error) {
      console.error('Error loading training requests:', error);
      alert("Couldn't fetch training requests. Maybe our skills are already *too* perfect?");
    }
  };

  const addTrainingRequest = async (e) => {
    e.preventDefault();
    if (!newTrainingSkill.trim() || !user) {
        alert("Please specify the skill you wish to master. We can't train you for 'general amazingness' just yet.");
        return;
    }
    try {
      await addDoc(collection(db, 'trainingRequests'), {
        skillName: newTrainingSkill,
        requestedBy: user.uid,
        requestedByName: user.displayName,
        trainingType: newTrainingType,
        status: 'Pending',
        notes: newTrainingNotes,
        createdAt: new Date()
      });
      setNewTrainingSkill('');
      setNewTrainingType('Internal');
      setNewTrainingNotes('');
      await loadTrainingRequests();
      alert(`Training request for "${newTrainingSkill}" submitted! The journey to becoming an even more amazing household member begins.`);
    } catch (error) {
      console.error('Error adding training request:', error);
      alert("Failed to submit training request. Perhaps the universe doesn't want you to learn *that* skill.");
    }
  };

  const deleteTrainingRequest = async (requestId, skillName) => {
    if (!window.confirm(`Are you sure you want to cancel the training request for "${skillName}"? Don't you want to be better at it?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'trainingRequests', requestId));
      await loadTrainingRequests();
      alert(`Training request for "${skillName}" cancelled. Your loss, really.`);
    } catch (error) {
      console.error('Error deleting training request:', error);
      alert("Couldn't cancel training request. It seems destiny wants you to master this skill.");
    }
  };

  const loadMySkills = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setCurrentSkills(docSnap.data().skills || []);
      }
    } catch (error) {
      console.error('Error loading my skills:', error);
    }
  };

  const addMySkill = async (skillName, level = 'Novice') => {
    if (!user || !skillName.trim()) {
      alert("A skill needs a name, even if it's 'Expert Napping.'");
      return;
    }

    if (currentSkills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
        alert("You already know this skill! Don't be greedy, master of multiple talents!");
        return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        skills: arrayUnion({ name: skillName, level, lastUpdated: new Date() })
      });
      await loadMySkills();
      alert(`Skill "${skillName}" added to your repertoire! You're practically a domestic ninja.`);
    } catch (error) {
      console.error('Error adding skill:', error);
      alert("Failed to add skill. Maybe you're not ready for this level of awesome.");
    }
  };

  const updateMySkillLevel = async (skillName, newLevel) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const newSkills = currentSkills.map(skill => 
        skill.name === skillName ? { ...skill, level: newLevel, lastUpdated: new Date() } : skill
      );
      await updateDoc(userDocRef, { skills: newSkills });
      await loadMySkills();
      alert(`Your "${skillName}" skill level is now ${newLevel}. Progress! Or perhaps a momentary lapse in judgment?`);
    } catch (error) {
      console.error('Error updating skill level:', error);
      alert("Couldn't update skill level. Is it truly impossible to get better at this?");
    }
  };

  const removeMySkill = async (skillName) => {
    if (!user || !window.confirm(`Are you sure you want to forget everything you learned about "${skillName}"? It's okay, we all have our limits (and sometimes, we just want to avoid that particular chore).`)) {
      return;
    }
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updatedSkills = currentSkills.filter(skill => skill.name !== skillName);
      await updateDoc(userDocRef, { skills: updatedSkills });
      await loadMySkills();
      alert(`"${skillName}" has been removed from your list of talents. More time for napping!`);
    } catch (error) {
      console.error('Error removing skill:', error);
      alert("This skill is clinging on for dear life. You can't escape it!");
    }
  };

  // --- Harmony Narrative Booth / Emotional Story Weaver Functions ---
  const openNarrativeBooth = () => {
    setShowNarrativeBoothModal(true);
    setSelectedNarrativeEmotions([]);
    setMatchedNarrative(null);
    setNarrativeFeedback(null);
  };

  const closeNarrativeBooth = () => {
    setShowNarrativeBoothModal(false);
    setSelectedNarrativeEmotions([]);
    setMatchedNarrative(null);
    setNarrativeFeedback(null);
  };

  const handleEmotionSelection = (emotion) => {
    setSelectedNarrativeEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion) 
        : [...prev, emotion]
    );
  };

  // Dummy function to find a narrative based on selected emotions
  const findMatchingNarrative = () => {
    if (selectedNarrativeEmotions.length === 0) return null;

    // --- BASIC PLACEHOLDER LOGIC ---
    // In a real app, you'd have a Firestore collection of narratives
    // and query based on emotionTags. For now, very simple hardcoded matches.
    const sampleNarratives = [
      {
        id: 'n1',
        title: "The Great Unseen Load: A Micro-Task Avalanche",
        text: "You woke up feeling like a single dust bunny was actually an army of unwritten tasks. The sheer mental weight of 'check mail,' 'relocate rogue pen,' and 'consider existence of pantry moth' is paralyzing. Your internal 'wave' is flatlining from too many frequencies.",
        emotionTags: ["Stress", "Overwhelm", "Anxiety", "Worry"],
        theme: "Mental Load"
      },
      {
        id: 'n2',
        title: "The Neighbor's Lawn (and Their Seemingly Flawless Life) Conundrum",
        text: "You glance at the neighbor's perfectly manicured lawn (or their seemingly sparkling clean car) and a sigh escapes. Meanwhile, your own (metaphorical) lawn is a chaotic jungle of neglected chores. A voice-over asks, 'Are their waves truly smoother, or merely filtered through my envy?'",
        emotionTags: ["Envy", "Jealousy", "Comparison"],
        theme: "Comparison Trap"
      },
      {
        id: 'n3',
        title: "The Fridge's Silent Rebellion: A Culinary Dystopia",
        text: "With grand culinary plans, you open the fridge, only to find a single, forlorn, half-eaten yogurt and a wilted vegetable. The 'expected' meal wave collapses into a 'dreadful' reality, forcing a spontaneous, less-than-ideal solution.",
        emotionTags: ["Disappointment", "Frustration", "Dread"],
        theme: "Plans Derail"
      },
      {
        id: 'n4',
        title: "The Broken Teacup and the Echo of Unsaid Words",
        text: "You're holding a broken teacup, but the sadness isn't about the porcelain. It's the unexpected vulnerability of the moment, a triggered memory, a feeling of inadequacy, or a sense of loss that has nothing to do with chipped ceramic. The shattered pieces reflect a deeper, unseen hurt.",
        emotionTags: ["Sadness", "Grief", "Hurt", "Vulnerability"],
        theme: "Hidden Hurt"
      },
      {
        id: 'n5',
        title: "The Solo Sofa Symphony: A Quest for Shared Blankets",
        text: "You sit alone on a large sofa, wrapped in a small blanket, while thought bubbles show other household members engaged in separate, distant activities. The 'wave' of your loneliness pulses gently, longing for constructive interference from another's presence.",
        emotionTags: ["Loneliness", "Disconnection", "Invisibility"],
        theme: "Seeking Connection"
      }
    ];

    const matching = sampleNarratives.find(narrative =>
      selectedNarrativeEmotions.some(emotion => narrative.emotionTags.includes(emotion))
    );
    return matching || { id: 'default', title: "The Cosmic Blank Canvas", text: "Your unique wave is still forming! Perhaps no existing narrative quite captures its profound depth. Feel free to share your own unique story below!", emotionTags: ["Unique", "Uncategorized"], theme: "Uncharted Territory" };
  };

  const handleShowMeAStory = () => {
    const narrative = findMatchingNarrative();
    setMatchedNarrative(narrative);
    setNarrativeFeedback(null); // Reset feedback
  };

  const handleNarrativeFeedback = (feedbackType) => {
    setNarrativeFeedback(feedbackType);
    // In a real app, send feedback to Firestore for better matching over time
    if (feedbackType === 'spot-on') {
        alert("Wonderful! Your wavelength is beautifully clear. Thank you for this attunement!");
    } else if (feedbackType === 'close') {
        alert("Understood. We'll fine-tune our narrative frequencies for next time!");
    } else if (feedbackType === 'nope') {
        alert("Ah, the universe is subtle! We'll keep exploring new narrative dimensions.");
    }
  };

  // --- Resonance Broadcast Functions ---
  const vulnerabilityBroadcastsCollection = collection(db, 'vulnerabilityBroadcasts');

  const loadVulnerabilityBroadcasts = async () => {
    if (!user) return;
    try {
      const q = query(vulnerabilityBroadcastsCollection, orderBy('broadcastAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const loadedBroadcasts = [];
      querySnapshot.forEach(d => loadedBroadcasts.push({ id: d.id, ...d.data() }));
      setVulnerabilityBroadcasts(loadedBroadcasts);
    } catch (error) {
      console.error('Error loading vulnerability broadcasts:', error);
      // Fail silently or give a very gentle alert here
    }
  };

  const handleBroadcastVulnerability = async (isAnonymous) => {
    if (!user || !matchedNarrative) {
      alert("No narrative selected to broadcast!");
      return;
    }

    try {
      await addDoc(vulnerabilityBroadcastsCollection, {
        emotionTags: selectedNarrativeEmotions,
        narrativeTitle: matchedNarrative.title,
        narrativeTheme: matchedNarrative.theme,
        broadcasterUid: isAnonymous ? null : user.uid,
        broadcasterName: isAnonymous ? 'Anonymous Harmonizer' : user.displayName,
        isAnonymous: isAnonymous,
        broadcastAt: new Date()
      });
      alert("Your revelation has been broadcast to the Harmony Bulletin Board! Thank you for sharing your strength.");
      closeNarrativeBooth(); // Close the modal
      await loadVulnerabilityBroadcasts(); // Refresh dashboard broadcasts
    } catch (error) {
      console.error('Error broadcasting vulnerability:', error);
      alert("Failed to broadcast your truth. The cosmic signal is weak today.");
    }
  };

  const handleAcknowledgeBroadcast = async (broadcastId) => {
    // In a real app, you'd update a specific broadcast document
    // e.g., await updateDoc(doc(vulnerabilityBroadcastsCollection, broadcastId), {
    //    acknowledgments: arrayUnion(user.uid) // or increment a counter
    // });
    alert("You've held space for this broadcast. Thank you for your active listening!");
    // For simplicity, just refresh for now
    await loadVulnerabilityBroadcasts();
  };

  // --- Personal Expression Studio Functions ---
  const openExpressionStudio = () => {
    setShowExpressionStudioModal(true);
    setNewExpressionType('poem'); // Default to poem
    setNewCreativeTitle('');
    setNewCreativeContent('');
    setNewExpressionIsPrivate(false);
    setComicPanels([{ imageUrl: '', caption: '' }]); // Reset comic panels
  };

  const closeExpressionStudio = () => {
    setShowExpressionStudioModal(false);
  };

  const handleComicPanelChange = (index, field, value) => {
    const newPanels = [...comicPanels];
    newPanels[index][field] = value;
    setComicPanels(newPanels);
  };

  const addComicPanel = () => {
    setComicPanels([...comicPanels, { imageUrl: '', caption: '' }]);
  };

  const removeComicPanel = (index) => {
    const newPanels = comicPanels.filter((_, i) => i !== index);
    setComicPanels(newPanels);
  };


  // --- Loading Screen ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Summoning harmony... please stand by. (Or, you know, just loading.)</p>
        </div>
      </div>
    );
  }

  // --- Pre-login Vibe Check Screen ---
  if (!user || (!initialVibeSelected && !user.isAnonymous)) { // isAnonymous check is if Firebase allows anonymous login, not relevant here but good to future proof
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <Heart className="mx-auto h-12 w-12 text-pink-600 mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Your Harmony Hub!</h1>
          <p className="text-gray-600 mb-6">
            Before we dive into the symphony of tasks, how are you tuning in today? Your vibe is welcome here. We're all wonderfully vulnerable human beings, and our shared strength comes from meeting each other where we are.
          </p>
          <div className="space-y-3 mb-6">
            {vibeOptions.map((vibe) => (
              <button
                key={vibe.value}
                onClick={() => handleVibeSelection(vibe.value)}
                className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg border transition-all duration-300
                  ${myCurrentVibe === vibe.value ? 'bg-indigo-100 border-indigo-500 text-indigo-700 font-semibold shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}
                `}
              >
                <vibe.icon className={`h-5 w-5 ${vibe.color}`} />
                {vibe.label}
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-sm italic mb-6">
            (Don't worry, you can change this anytime in your MySpace profile.)
          </p>
          <button
            onClick={signInWithGoogle}
            disabled={!myCurrentVibe}
            className={`w-full rounded-lg px-6 py-3 text-white font-medium transition-colors flex items-center justify-center gap-3
              ${myCurrentVibe ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}
            `}
          >
            <img 
              src="https://developers.google.com/identity/images/g-logo.png" 
              alt="Google" 
              className="w-5 h-5"
            />
            Sign in with Google (and bring your chosen vibe!)
          </button>
        </div>
      </div>
    );
  }

  // Helper to determine collective vibe for dashboard
  const getCollectiveVibe = () => {
    const totalMembers = householdMembers.length;
    if (totalMembers === 0) return { label: "Quiet Echo", color: "text-gray-400" };

    const availableCount = householdMembers.filter(m => m.availabilityStatus === 'Available for Tasks').length;
    const stormyCount = householdMembers.filter(m => m.currentVibe === 'A Bit Stormy' || m.currentVibe === 'Feeling Vulnerable').length;

    if (stormyCount > totalMembers / 2) {
      return { label: "A Bit Stormy", color: "text-red-500", desc: "Our collective frequency is a bit jagged. Time for compassionate listening." };
    } else if (availableCount > totalMembers / 2) {
      return { label: "Harmonious Flow", color: "text-green-500", desc: "Our collective frequency is high! Let's amplify the good vibes." };
    } else {
      return { label: "Steady Hum", color: "text-orange-500", desc: "Our collective frequency is steady. Ready for some fine-tuning!" };
    }
  };

  const collectiveVibe = getCollectiveVibe();

  // --- Main App Content Renderer ---
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Collective Vibe Meter */}
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Our Collective Vibe!</h2>
                <div className="flex items-center justify-center gap-4">
                  <Sun className={`h-10 w-10 ${collectiveVibe.color} animate-pulse`} />
                  <div>
                    <p className={`text-3xl font-bold ${collectiveVibe.color}`}>{collectiveVibe.label}</p>
                    <p className="text-sm text-gray-600">{collectiveVibe.desc}</p>
                  </div>
                </div>
            </div>

            {/* Harmony Bulletin Board / Resonance Broadcasts */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Our Collective Resonance Stream: Vulnerability as Our Shared Strength!</h2>
              <p className="text-gray-600 mb-4">
                Behold the bravery of our wave-makers! Each shared expression here is a gift of vulnerability, received with curiosity, active listening, and as much care as we can offer. It is a privilege to hold space for one another's unique journeys.
              </p>
              <div className="space-y-4">
                {vulnerabilityBroadcasts.length > 0 ? (
                  vulnerabilityBroadcasts.map(broadcast => (
                    <div key={broadcast.id} className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-500" />
                          <h3 className="font-semibold text-gray-900">
                            Feeling: {broadcast.emotionTags.join(', ')}
                          </h3>
                        </div>
                        <span className="text-xs text-gray-600">
                          {broadcast.isAnonymous ? 'Anonymous Harmonizer' : broadcast.broadcasterName}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">
                        From the narrative: "{broadcast.narrativeTitle}" ({broadcast.narrativeTheme})
                      </p>
                      <p className="text-xs text-gray-500">
                        Broadcast at: {new Date(broadcast.broadcastAt.toDate()).toLocaleTimeString()} on {new Date(broadcast.broadcastAt.toDate()).toLocaleDateString()}
                      </p>
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => handleAcknowledgeBroadcast(broadcast.id)}
                          className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors flex items-center gap-2"
                        >
                          <HandHeart className="h-4 w-4" /> I Hear You / Holding Space
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No shared revelations yet. Perhaps your wave is building, or everyone is perfectly attuned!</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Things to Harmonize</p>
                    <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Harmony Achieved!</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasks.filter(task => task.completed).length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Still on the Horizon</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasks.filter(task => !task.completed).length}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Manifest a New Harmony Task (Tune Your Intention!)</h2>
              <form onSubmit={addTask} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="What desired outcome are we manifesting today? (Be specific, unlike that time with the 'clean the kitchen' task.)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label htmlFor="task-category" className="text-sm text-gray-700">Category (Choose a vibe):</label>
                  <select
                    id="task-category"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Choose a vibe...</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="private-task"
                    checked={newTaskIsPrivate}
                    onChange={(e) => setNewTaskIsPrivate(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="private-task" className="text-sm text-gray-700">
                    Keep this intention private (because some harmony is a solo act).
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Manifest Harmony Task (May your intention wave resonate!)
                </button>
              </form>

              {/* Add New Category Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Add a New Category (Because 'Miscellaneous' is so last season, and our labels need to evolve with our vibrations.)</h3>
                <form onSubmit={addCategory} className="flex gap-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., 'Existential Dread' or 'Snack Procurement Manifesting'"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Summon Category!
                  </button>
                </form>
                 <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Our Curated Category Collection (Handle with care, they're delicate and energetically charged):</h4>
                    <div className="flex flex-wrap gap-2">
                        {availableCategories.map(category => (
                            <span key={category} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                {category}
                                <button
                                    onClick={() => removeCategory(category)}
                                    className="ml-2 -mr-0.5 h-4 w-4 text-gray-500 hover:text-red-600 transition-colors"
                                    title={`Banish "${category}" (adjust the collective wavelength).`}
                                >
                                    <XCircle />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Harmony Tasks (Behold, our manifested efforts!)</h2>
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => toggleTaskCompletion(task)} className="focus:outline-none">
                        <CheckCircle className={`h-5 w-5 ${task.completed ? 'text-green-500' : 'text-gray-400'}`} />
                      </button>
                      <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                        {task.text}
                        {task.category && <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{task.category}</span>}
                        {task.isPrivate ? <Lock className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Private Intention: Don't Touch My Precious!" /> : <Globe className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Shared Intention: For All to Behold (and do)." />}
                        {task.assignedToName && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"><UserCheck className="h-3 w-3" /> Attuned to: {task.assignedToName} (Good luck, champ!)</span>}
                      </span>
                    </div>
                    {task.userId === user.uid && (
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 transition-colors ml-2"
                        title="Vanish this task forever. Muhahaha!"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No harmony tasks yet. The universe is surprisingly quiet. Let's manifest some chaos... I mean, harmony!</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Harmony Tasks (A Symphony of Manifested To-Dos!)</h2>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => toggleTaskCompletion(task)} className="focus:outline-none" title="Mark as Manifested/Unmanifested (The eternal struggle!)">
                      <CheckCircle className={`h-5 w-5 ${task.completed ? 'text-green-500' : 'text-gray-400'}`} />
                    </button>
                    <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                      {task.text}
                      {task.category && <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{task.category}</span>}
                      {task.isPrivate ? <Lock className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Private Intention: My Secret Burden" /> : <Globe className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Shared Intention: Your Burden Now!" />}
                      {task.assignedToName && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"><UserCheck className="h-3 w-3" /> Attuned to: {task.assignedToName}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!task.assignedTo && !task.isPrivate && ( // Can only assign shared tasks
                       <button
                         onClick={() => assignTask(task.id, user.uid, user.displayName)}
                         className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                         title="Volunteer to resonate with this task's frequency!"
                       >
                         Attune to Me! (Be brave!)
                       </button>
                    )}
                    {task.assignedTo === user.uid && ( // Only current assignee can unassign
                      <button
                        onClick={() => assignTask(task.id, null, null)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition-colors"
                        title="Release this wave! (Just kidding, re-open for grabs)."
                      >
                        Unassign Me (Freedom!)
                      </button>
                    )}
                    {task.userId === user.uid && ( // Only the creator can delete
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Vanish this task forever. Muhahaha!"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-gray-500 text-center py-8">No harmony tasks yet. The house is either sparkling or we're all in denial. Probably the latter. Manifest one from the dashboard!</p>
              )}
            </div>
          </div>
        );

      case 'family': // "Our Awesome Household!" as "MySpace"
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Our Awesome Household! (The Pillars of Harmony & Occasional Chaos!)</h2>
            <p className="text-gray-600 mb-4">Behold the magnificent individuals contributing to our domestic bliss. See who's currently available for heroic acts (like bringing snacks) or deep contemplation.</p>
            
            {/* MySpace Section for Current User */}
            <div className="mb-8 p-6 bg-indigo-50 rounded-lg shadow-sm border border-indigo-100">
                <h3 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-2">
                    <UserSquare className="h-6 w-6"/> Your Personal MySpace (Keep it real, folks, and share your true frequency!)
                </h3>
                <form onSubmit={updateMySpaceInfo} className="space-y-4">
                    <div>
                        <label htmlFor="availability-status" className="block text-sm font-medium text-gray-700 mb-2">
                            My Current Availability:
                        </label>
                        <select
                            id="availability-status"
                            value={myAvailabilityStatus}
                            onChange={(e) => setMyAvailabilityStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="Available for Tasks">Available for Tasks (Send 'em over!)</option>
                            <option value="Heads Down - Do Not Disturb">Heads Down - Do Not Disturb (Unless it's an emergency, or snacks.)</option>
                            <option value="Out of Office">Out of Office (Currently escaping reality.)</option>
                            <option value="On Call for Emergencies Only">On Call for Emergencies Only (Like a rogue spider or a coffee shortage.)</option>
                            <option value="Currently Peeling Potatoes">Currently Peeling Potatoes (My sacred duty.)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="my-current-vibe" className="block text-sm font-medium text-gray-700 mb-2">
                            My Energetic Signature / Current Vibe:
                        </label>
                        <select
                            id="my-current-vibe"
                            value={myCurrentVibe}
                            onChange={(e) => setMyCurrentVibe(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {vibeOptions.map(vibe => (
                                <option key={vibe.value} value={vibe.value}>{vibe.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="myspace-notes" className="block text-sm font-medium text-gray-700 mb-2">
                            My Inner Monologue / Important Notes for the Household (Share your vulnerability!):
                        </label>
                        <textarea
                            id="myspace-notes"
                            value={mySpaceNotes}
                            onChange={(e) => setMySpaceNotes(e.target.value)}
                            placeholder="Feeling reflective today. Or, 'Just finished the laundry, praise me!' (Embrace 'not knowing' here too!)"
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Send className="h-4 w-4" />
                        Update MySpace & Vibe
                    </button>
                </form>
            </div>

            {/* Other Household Members Section */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Who's Doing What (or Avoiding What) - A Glimpse into Other Minds:</h3>
            <div className="space-y-3">
              {householdMembers.length > 0 ? (
                householdMembers.map((member) => (
                  <div key={member.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3 mb-2 md:mb-0">
                      {member.photoURL && <img src={member.photoURL} alt={member.displayName} className="w-8 h-8 rounded-full" />}
                      <div className="font-medium text-gray-900">
                        {member.displayName}
                        {member.id === user.uid && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">That's You!</span>}
                        <p className="text-sm text-gray-500">
                          Status: <span className="font-semibold">{member.availabilityStatus || 'Status Unknown (Probably plotting something)'}</span>
                        </p>
                         <p className="text-sm text-gray-500">
                          Current Vibe: <span className="font-semibold">{member.currentVibe || 'Unspecified Resonance'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 md:text-right text-sm text-gray-600 md:ml-4">
                      {member.mySpaceNotes ? (
                        <p className="italic">"{member.mySpaceNotes}"</p>
                      ) : (
                        <p className="italic text-gray-400">No profound thoughts shared today.</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No other household members found. Are you sure you're not living alone and just hallucinating tasks?</p>
              )}
            </div>
             <p className="mt-6 text-gray-600 text-sm">
                *Note: For a truly epic family adventure, we'd need more robust user management, like a secret handshake or a 'family quest' system. This current setup is just a glimpse into our magnificent collective.
            </p>
          </div>
        );
      
      case 'our-harmony-guide':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cultivating Our Peaceful Home: The Grand Manifesto of Tranquility</h2>
            <p className="text-gray-700 mb-4">
              Hello everyone, my esteemed co-habitants of this magnificent abode,
            </p>
            <p className="text-gray-700 mb-4">
              I'd like to propose a *casual* chat, not a formal interrogation, about how we can make our day-to-day living even smoother and more harmonious, especially as we've gracefully entered this peaceful retirement phase. We're all here to bask in the glow of our golden years, but sometimes, the small, unexpected things – like the mystery of the vanishing socks, or the perpetual question of 'whose turn is it to empty the dishwasher?' – can create tiny ripples of chaos without anyone intending them to.
            </p>
            <p className="text-gray-700 mb-4">
              My highly scientific theory suggests that when something feels a bit off – like potatoes *still* not being peeled when expected (a recurring family saga, I might add!), or a task not getting done that someone *thought* was someone else's sacred duty – it's not about blame. Oh no, never blame! Instead, it's usually because the responsibility wasn't explicitly clear, universally understood, or given a timeline more specific than 'eventually, maybe, by magic.'
            </p>
            <p className="text-gray-700 mb-4">
              So, what if we, as enlightened beings, shifted our focus from those tiny moments of potential friction to the elegant system and a subtly implied process that allows us to communicate and clarify these existential domestic dilemmas? Imagine a way for us to bring these unmet needs (or perhaps, 'unarticulated desires for a tidier living space') or unclear messages to a central "hub." A place where we can collectively scratch our heads, ponder, and then brilliantly clarify them. This isn't about pointing fingers; it's about making the message itself the object of our shared, slightly bewildered, and ultimately productive attention and work.
            </p>
            <p className="text-gray-700 mb-4">
              My profound belief is that by embracing this digital oracle, we can foster the clarity and understanding that are as fundamental as a good cup of coffee for a truly generative system in our home – one that naturally produces peace, harmony, and such overwhelmingly good vibes that our neighbors will wonder what spiritual retreat we've joined.
            </p>
            <p className="text-gray-700 mb-4">
              I've even, in a moment of pure, unadulterated inspiration, cobbled together this very simple idea for a shared online space – our "Home Harmony Hub," a veritable 'webpage for inspiration'! – that could potentially serve as this magnificent "message hub." It's just a concept, a humble seed of an idea to get us thinking, and something we can all refine together. Think of it as our digital war room, but for chores and joy.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">The grand purpose of our upcoming 'Get-In-Sync' Hangout is to:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>Formally introduce this digital marvel as a shared object of our collective fascination.</li>
              <li>Engage in a robust (but polite!) discussion to ascertain if we, as a unified front, agree that this kind of systematically absurd yet practical approach could, in fact, elevate our household to new heights of tranquility.</li>
              <li>Collaboratively "sign up" (no forced conscription, promise!) to bravely embark upon a system and process that miraculously works for all of us.</li>
              <li>Brainstorm like mad scientists and playfully adapt how we might wield this simple tool (the aforementioned webpage concept) to orchestrate smoother living and minimize future potato-related misunderstandings.</li>
            </ul>
            <p className="text-gray-700 mb-4">
              I'm genuinely keen to hear everyone's thoughts on this. Let's conspire to make our home life as peacefully clear and delightfully efficient as humanly possible.
            </p>
            <p className="text-gray-700">
              Looking forward to our discussion (and perhaps a celebratory dessert, if we get through this without any major existential crises),
              <br/>
              Ran (Your humble servant of domestic order)
            </p>

            {/* SECTION FOR RULES EXPLANATION */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">The Grand Rules of Engagement (or: How We Keep the Digital Peace)</h3>
              <p className="text-gray-700 mb-4">
                Now that we're all basking in the glow of shared domestic harmony, it's worth a peek behind the digital curtains. Just like we have unspoken (or now, spoken!) rules about dishwashing, our Harmony Hub also has a few foundational principles to keep things fair and secure. Think of these as the 'digital etiquette' for our data – less exciting than a good joke, but crucial for avoiding any unintentional chaos!
              </p>

              <h4 className="text-lg font-semibold text-gray-900 mb-2">Our Core Principles for Your Digital Stuff:</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>**Your Login, Your Castle:** When you sign in, Firebase makes sure only *you* can access your personal login data. No peeking!</li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-900 mb-2">Harmony Tasks: The Nitty-Gritty Details:</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>**Seeing is Believing (Mostly):** You can see all the tasks that are *shared* (because we're a team, after all!). You can also always see *your own* tasks, even the super secret private ones you're hoarding.</li>
                <li>**Creation is Sacred:** Only *you* can create tasks under *your* name. No ghost tasks appearing from the ether!</li>
                <li>**My Task, My Rules (Mostly):** Only the glorious creator of a task can update its details or make it vanish into thin air. This avoids accidental deletion of that crucial "remember to get more coffee" task.</li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-900 mb-2">Bright Ideas & Wishes: Our Suggestion Box Protocol:</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>**All Ideas Welcome (for Viewing!):** Everyone can see all the brilliant (and sometimes slightly unhinged) ideas submitted. Transparency is key!</li>
                <li>**Your Idea, Your Ownership:** You can submit your own bright ideas, and only *you* can edit or delete them. So think before you type, but don't overthink!</li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-900 mb-2">Sync Session Ideas: Our Shared Brainstorming Canvas:</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>**Free-for-All Fun!:** This is our digital whiteboard for 'get-in-sync' hangouts! Anyone can add an idea, and anyone can remove one. It's truly a collaborative space, no questions asked (until the meeting, of course!).</li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-900 mb-2">Categories: Our Labeling System:</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>**Collective Naming Convention:** Everyone can see and *add* new categories. If 'Existential Dread' needs its own category, so be it! This keeps our organizing tools dynamic and reflective of our shared reality.</li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-900 mb-2">Harmony Gallery & Bard Booth: Our Creative Sanctuary:</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>**Art for All (to See!):** Everyone can browse our collective masterpieces – be it a profound haiku about chores or a questionable stick-figure drawing.</li>
                <li>**Your Muse, Your Masterpiece:** You can contribute your own creative genius, and only *you* have the power to erase your art from history (or, you know, delete it).</li>
              </ul>

              <p className="text-gray-700 mt-6">
                And that, my dear co-harmonizers, is the not-so-secret secret sauce behind the Home Harmony Hub. It's designed to give us structure where we need it, flexibility where we crave it, and security where it truly matters. Now, back to those tasks... unless you have a new joke to share?
              </p>
            </div>
            {/* New section for philosophical underpinnings from the document */}
            <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Our Guiding Philosophy: Riding the Waves of Harmony!</h3>
                <p className="text-gray-700 mb-4">
                    The Harmony Hub isn't just about tasks; it's about **cultivating a living ecosystem of peace, love, and understanding.** Think of our shared life as a grand symphony of waves, and each of us is a unique instrument, adding our own frequency and amplitude to the collective.
                </p>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-500" /> "Vibes" as a Wave's Signature:
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                    <li>**Good Vibes:** A harmonious frequency, an expansive amplitude – feeling uplifting and resonant.</li>
                    <li>**Bad Vibes:** A discordant frequency, a constricted amplitude – feeling off or tense.</li>
                    <li>The Hub aims to help us achieve **constructive interference**, where our individual waves align to amplify the positive collective vibe!</li>
                </ul>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" /> "Manifesting" as Influencing the Wave:
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                    <li>When you add a task, you're **intentionally influencing your personal wave**, tuning it to a specific frequency and amplitude that aligns with your desired outcome (e.g., a clean kitchen!).</li>
                    <li>It's about **focusing your energy** (amplitude) and **aligning your intentions** (frequency) with what you want to bring into reality.</li>
                </ul>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <HandHeart className="h-5 w-5 text-pink-500" /> "Attunement": Harmonizing with the Universal Wave:
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                    <li>**Attunement is Resonance:** Coming into harmony with a deeper reality or desired state. It's about finding your unique note and playing it in sync with the overall composition of our home.</li>
                    <li>In relationships, being "on the same wavelength" literally means our personal waves are in sync, amplifying shared understanding. This Hub helps us achieve that!</li>
                </ul>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" /> Reframing Conflict: From Punishment to Process:
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                    <li>Conflict isn't about blame, but an opportunity for **deeper understanding**. The Hub's Clarity Messages help us depersonalize issues by focusing on the "message for clarity" itself.</li>
                    <li>**Vulnerability is Strength:** Embracing "not knowing" and openly sharing our inner landscape builds trust and resilience, transforming challenges into opportunities for growth.</li>
                    <li>**Holding Feelings:** Instead of "fixing" difficult emotions, we learn to "hold" them with curiosity. This validates experiences and allows emotions to dissipate naturally, preventing resentment.</li>
                </ul>
                <p className="text-gray-700 mt-6">
                    By consciously engaging with these principles, we move beyond just managing tasks to actively **co-creating a home where peace, love, and harmonious vibrations are the default.** Welcome to the performance!
                </p>
            </div>
          </div>
        );

      case 'path-to-good-vibes':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Path to Good Vibes: Why This Isn't Just Another Chore.</h2>
            <p className="text-gray-700 mb-4">
              Alright, let's talk real. We've all been there: the unspoken eye-rolls, the sighing, the distinct feeling that someone else (definitely not *you*) should be dealing with *that*. Maybe you've even uttered the timeless classic, "I didn't ask for this!" or "I didn't ask to be born!" (A valid point, historically speaking, but perhaps less applicable to the overflowing recycling bin).
            </p>
            <p className="text-gray-700 mb-4">
              Here's the inconvenient truth that leads to pure, unadulterated bliss: **Peace, Love, and Responsibilities are the undeniable foundation of truly good vibes only.** You can't have one without the others. It's like trying to have a perfect cup of coffee without the actual coffee beans. Nonsense!
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-500"/> So, What Do YOU Get To Ask For?
            </h3>
            <p className="text-gray-700 mb-4">
              This isn't about *us* (the Hub, that is) demanding more from you. This is about giving *you* the power to demand more **peace** and **less passive-aggression** in your daily life. Because if you *didn't* ask for the chaos, then surely you *do* get to ask for the calm. And this Hub is how we all collectively answer that call.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-3 mb-6">
              <li>
                **The End of the "Mystery Chore" Saga:** Remember the unending sagas of the unpeeled potatoes or the rogue overflowing trash? That's not a mystery novel; it's a lack of clarity. This Hub means no more guessing games. If it's on the Hub and assigned, you know who's stepping up. If it's not assigned, it's an invitation, not a silent judgment. Your brain is free to wonder about more important things, like what to watch next on streaming.
              </li>
              <li>
                **Your Mental Load, Lighter (Seriously):** Ever wake up in a cold sweat remembering you forgot to put out the recycling? Or spend precious mental energy trying to recall who said they'd pick up the dry cleaning? Offload those nagging thoughts here! Your brain is now free for more important things, like remembering where you put your reading glasses, or what day it is.
              </li>
              <li>
                **Customized Chores (Yes, Really!):** Hate scrubbing toilets but secretly enjoy organizing the pantry? Now you can see what needs doing and "Assign to Me!" the tasks you actually *don't hate*. It's like chore-shopping, but for adults! (And if no one picks it up, well, we'll talk about that in the Sync Session Ideas.)
              </li>
              <li>
                **Fewer Awkward Conversations:** That moment when you realize someone *else's* perceived responsibility didn't get done, and you have to decide between letting it fester or having "the talk"? Now, just pop a task in the Hub. The message becomes the focus, not the messenger. We're all adults here, let's act like it (mostly).
              </li>
              <li>
                **Undeniable Proof of Your Awesomeness:** Finally, irrefutable evidence of all your glorious contributions to household harmony! No more "What exactly do *you* do around here?" accusations. Point them to your completed tasks. Bam! Proof. Hard data. Undeniable evidence of your productive existence.
              </li>
              <li>
                **A Place for Your Brilliance (Beyond Chores):** Feeling inspired? Woke up with a killer joke? Penned a sarcastic poem about the dishwasher? The Harmony Gallery is your stage! Express yourself. We promise to at least chuckle politely.
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Heart className="h-6 w-6 text-pink-500"/> What It Means for *Our* Shared Good Vibes:
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-3 mb-6">
              <li>
                **Less Festering Resentment (We Hope!):** When clarity reigns, passive-aggression (mostly) retreats. It's not magic, but it's a strong deterrent against the silent resentment that turns harmonious homes into tension-filled battlegrounds.
              </li>
              <li>
                **More Quality Time (Yes, Really!):** When we're not constantly tripping over unaddressed tasks or bickering about who left the light on, there's genuinely more time and energy for laughter, shared activities, and enjoying the peaceful retirement we all earned.
              </li>
              <li>
                **A United Front Against Domestic Chaos:** This isn't just about individual tasks; it's about building a robust system where we all support the smooth running of our home. We identify challenges, we assign roles, and we conquer the domestic dragons *together*. Because nobody wants to fight a dragon alone, especially if it smells like unwashed dishes.
              </li>
            </ul>

            <p className="text-gray-700 mt-6 text-center">
              So, if you didn't ask for the mess, now you get to ask for the order. If you didn't ask for the tension, now you get to ask for the calm. The Home Harmony Hub isn't just a tool; it's our collective commitment to **Peace, Love, and Responsibilities**, making our home the ultimate good vibes sanctuary. Dive in. Your future, less exasperated self will thank you.
            </p>
          </div>
        );

      case 'clarity-hub':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">The Clarity Hub: Navigating Waves of Understanding (No Blame, Just Process!)</h2>
              <p className="text-gray-600 mb-4">
                This is where we bring any subtle discord or unclear frequencies into the light. Remember, there's no blame, only opportunities for deeper understanding and collective growth. Frame your message as an observation and a question, seeking clarity to fine-tune our shared harmony.
              </p>
              
              <h3 className="text-md font-semibold text-gray-900 mb-3">Add a New Message for Clarity (Tune into Shared Understanding!)</h3>
              <form onSubmit={addClarityMessage} className="space-y-4">
                <div>
                  <label htmlFor="clarity-title" className="block text-sm font-medium text-gray-700 mb-2">
                    Message Title (Short & Factual, like a calm weather report):
                  </label>
                  <input
                    id="clarity-title"
                    type="text"
                    value={newClarityMessage.title}
                    onChange={(e) => setNewClarityMessage({...newClarityMessage, title: e.target.value})}
                    placeholder="e.g., 'Dishwasher Contents Query' or 'Mysterious Light Switch Situation'"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="clarity-observation" className="block text-sm font-medium text-gray-700 mb-2">
                    Observation / Context (What happened or what's unclear? No blame, just facts!):
                  </label>
                  <textarea
                    id="clarity-observation"
                    value={newClarityMessage.observation}
                    onChange={(e) => setNewClarityMessage({...newClarityMessage, observation: e.target.value})}
                    placeholder="Describe the situation or observation without assigning blame (e.g., 'The dishwasher was run, but items are still visibly un-clean.')"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="clarity-question" className="block text-sm font-medium text-gray-700 mb-2">
                    Question / Need for Clarity (How can we collectively attune to this?):
                  </label>
                  <textarea
                    id="clarity-question"
                    value={newClarityMessage.question}
                    onChange={(e) => setNewClarityMessage({...newClarityMessage, question: e.target.value})}
                    placeholder="Frame this as a question or a need for shared understanding/decision (e.g., 'What process can we use to ensure items are clean before a cycle?')"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="clarity-resolution" className="block text-sm font-medium text-gray-700 mb-2">
                    Suggested Resolution (Optional: Share your initial wavelength for a solution):
                  </label>
                  <textarea
                    id="clarity-resolution"
                    value={newClarityMessage.suggestedResolution}
                    onChange={(e) => setNewClarityMessage({...newClarityMessage, suggestedResolution: e.target.value})}
                    placeholder="Optional: Propose a way forward, if you have a clear frequency in mind."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:focus:border-indigo-500"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircleQuestion className="h-4 w-4" />
                  Send Message for Clarity!
                </button>
              </form>
            </div>

            {/* Active Messages for Clarity List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Messages for Clarity (Waves Still Rippling... Let's Attune!)</h2>
              <div className="space-y-4">
                {clarityMessages.length > 0 ? (
                  clarityMessages.map((message) => (
                    <div key={message.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                        <MessageCircleQuestion className="h-5 w-5 text-indigo-500" />
                        {message.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">**Observation:** {message.observation}</p>
                      <p className="text-gray-600 text-sm mb-2">**Question:** {message.question}</p>
                      {message.suggestedResolution && <p className="text-gray-600 text-sm mb-2">**Suggested:** {message.suggestedResolution}</p>}
                      <p className="text-xs text-gray-500 mt-2">
                        Added by {message.userName} on {new Date(message.createdAt.toDate()).toLocaleDateString()}
                      </p>
                      <div className="flex justify-end gap-2 mt-3">
                          {message.userId === user.uid && (
                            <button
                              onClick={() => deleteClarityMessage(message.id, message.title)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete this message (if the universe has already clarified)."
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => resolveClarityMessage(message)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                            title="Mark as resolved and archive (for future reference and harmony!)."
                          >
                            <CheckCircle className="h-4 w-4" /> Resolve
                          </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No active messages for clarity. Our wavelengths must be perfectly aligned today!</p>
                )}
              </div>
            </div>

            {/* Resolved Agreements & Baselines Archive */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolved Agreements & Baselines (Our Codex of Collective Harmony!)</h2>
              <p className="text-gray-600 mb-4">
                This archive holds the wisdom gained from past attunement sessions. It's our living "rulebook" of agreed-upon processes and understandings, ensuring future ripples are harmonious, not chaotic.
              </p>
              <div className="space-y-4">
                {resolvedAgreements.length > 0 ? (
                  resolvedAgreements.map((agreement) => (
                    <div key={agreement.id} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                      <h3 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                        <Archive className="h-5 w-5 text-blue-500" />
                        Resolved: {agreement.originalTitle}
                      </h3>
                      <p className="text-gray-700 text-sm mb-2">
                        **Original Question:** {agreement.originalQuestion}
                      </p>
                      <p className="text-gray-700 text-sm mb-2">
                        **Agreed Resolution:** {agreement.agreedResolution}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Resolved by {agreement.resolvedByName} on {new Date(agreement.resolvedAt.toDate()).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No resolved agreements yet. Let's start resolving some clarity messages!</p>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'harmony-gallery':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">The Harmony Gallery & Bard Booth (Where offloaded admin meets creative genius!)</h2>
              <p className="text-gray-600 mb-4">
                Now that all the tedious household administration is safely offloaded onto this ingenious Hub (and thus, shared equally, *cough*), your minds are free to create! Share your jokes, poetry, song lyrics, or even links to your digital art/music. Let's make this space resonate with our collective, sometimes absurd, brilliance.
              </p>
              <form onSubmit={addHarmonyCreative} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What kind of brilliance are you sharing today?
                  </label>
                  <select
                    value={newCreativeType}
                    onChange={(e) => setNewCreativeType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="joke">Joke 😂</option>
                    <option value="poetry">Poetry ✍️</option>
                    <option value="song">Song/Lyric 🎶</option>
                    <option value="art">Art/Image Link 🎨</option>
                    <option value="random-thought">Random Thought 🤔</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Give your masterpiece a title (Optional, but encouraged for posterity!)
                  </label>
                  <input
                    type="text"
                    value={newCreativeTitle}
                    onChange={(e) => setNewCreativeTitle(e.target.value)}
                    placeholder="e.g., 'Ode to a Clean Toilet' or 'The Ballad of the Unmatched Socks'"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Creative Spark (text or link):
                  </label>
                  <textarea
                    value={newCreativeContent}
                    onChange={(e) => setNewCreativeContent(e.target.value)}
                    placeholder="Type your poem, joke, lyrics, or paste a link to your art/song. Let it flow!"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Unleash the Awesomeness!
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Our Collective Masterpieces (Applaud or politely scratch your head.)</h2>
              <div className="space-y-4">
                {harmonyCreatives.length > 0 ? (
                  harmonyCreatives.map((creative) => (
                    <div key={creative.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {creative.type === 'joke' && <Laugh className="h-5 w-5 text-yellow-600" />}
                            {creative.type === 'poetry' && <Feather className="h-5 w-5 text-purple-600" />}
                            {creative.type === 'song' && <Music className="h-5 w-5 text-blue-600" />}
                            {creative.type === 'art' && <Palette className="h-5 w-5 text-green-600" />}
                            {creative.type === 'random-thought' && <Lightbulb className="h-5 w-5 text-gray-600" />}
                            {creative.type === 'comic-book' && <Image className="h-5 w-5 text-indigo-600" />} {/* Icon for comic book */}
                            <h3 className="font-medium text-gray-900">{creative.title} <span className="text-sm text-gray-500 ml-2">({creative.type.charAt(0).toUpperCase() + creative.type.slice(1)})</span></h3>
                          </div>
                          {creative.type === 'comic-book' ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                  {creative.comicPanels && creative.comicPanels.map((panel, idx) => (
                                      <div key={idx} className="border border-gray-300 p-2 rounded">
                                          {panel.imageUrl && <img src={panel.imageUrl} alt={`Comic Panel ${idx + 1}`} className="w-full h-auto object-cover mb-2 rounded" />}
                                          {panel.caption && <p className="text-gray-700 text-sm italic">{panel.caption}</p>}
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{creative.content}</p>
                          )}
                          {/* Basic handling for links */}
                          {(creative.type === 'art' || creative.type === 'song') && creative.content.startsWith('http') && (
                            <a href={creative.content} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">
                              View/Listen to the Masterpiece!
                            </a>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Shared by {creative.userName} on {new Date(creative.createdAt.toDate()).toLocaleDateString()}
                          </p>
                          {creative.privacy === 'private' && (
                              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteHarmonyCreative(creative.id, creative.type)}
                          className="text-red-500 hover:text-red-700 transition-colors ml-4"
                          title={`Delete this ${creative.type} (if you dare to destroy beauty).`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    The Harmony Gallery is currently a blank canvas. Let's fill it with our glorious (or hilariously bad) creations! Don't let your inner artist wither from lack of appreciation.
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'personal-expression-studio': // New tab for creating personal narratives
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">The Personal Expression Studio: Weave Your Own Narrative!</h2>
            <p className="text-gray-600 mb-6">
              Welcome to your canvas for emotional truth! Here, **all forms of expression are welcome, and seen and heard with no judgment. We approach your creations with simple curiosity, active listening, and as much care as we have capacity for.** Your unique wave is safe to share.
            </p>

            <form onSubmit={addHarmonyCreative} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Your Medium (How will your wave manifest?):
                </label>
                <select
                  value={newExpressionType}
                  onChange={(e) => {
                    setNewExpressionType(e.target.value);
                    setNewCreativeType(e.target.value); // Keep sync with creativeType for storage
                    setComicPanels([{ imageUrl: '', caption: '' }]); // Reset comic panels on type change
                    setNewCreativeContent(''); // Clear content as it might be different for each type
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="poem">Poem ✍️ (Compose your resonant words.)</option>
                  <option value="song">Song/Lyrics 🎶 (Let your feelings find their rhythm.)</option>
                  <option value="comic-book">Comic Book 🖼️ (Capture moments from your wave visually and textually.)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Give your masterpiece a title (Optional, but encouraged for posterity!)
                </label>
                <input
                  type="text"
                  value={newCreativeTitle}
                  onChange={(e) => setNewCreativeTitle(e.target.value)}
                  placeholder={
                    newExpressionType === 'poem' ? "e.g., 'Ode to a Clean Toilet'" :
                    newExpressionType === 'song' ? "e.g., 'The Ballad of the Unmatched Socks'" :
                    "e.g., 'The Great Dust Bunny Conspiracy'"
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {newExpressionType === 'comic-book' ? (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Comic Panels:</h4>
                  {comicPanels.map((panel, index) => (
                    <div key={index} className="border border-gray-200 p-4 rounded-lg bg-gray-50 relative">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Panel {index + 1}</h5>
                      <input
                        type="text"
                        value={panel.imageUrl}
                        onChange={(e) => handleComicPanelChange(index, 'imageUrl', e.target.value)}
                        placeholder="Image URL (e.g., from Imgur, Unsplash)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-1 focus:ring-indigo-500"
                      />
                      <textarea
                        value={panel.caption}
                        onChange={(e) => handleComicPanelChange(index, 'caption', e.target.value)}
                        placeholder="Caption or dialogue for this panel"
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                      />
                      {comicPanels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeComicPanel(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          title="Remove Panel"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addComicPanel}
                    className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Panel
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Creative Spark (text or external link):
                  </label>
                  <textarea
                    value={newCreativeContent}
                    onChange={(e) => setNewCreativeContent(e.target.value)}
                    placeholder={
                      newExpressionType === 'poem' ? "Type your poem here..." :
                      "Type your song lyrics here, or paste a link to your audio recording (e.g., SoundCloud, Vocaroo)"
                    }
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="expression-private"
                  checked={newExpressionIsPrivate}
                  onChange={(e) => setNewExpressionIsPrivate(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="expression-private" className="text-sm text-gray-700">
                  Keep this Private (Only I can see this expression of my wave)
                </label>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
              >
                <PenTool className="h-4 w-4" />
                Unleash Your Personal Expression!
              </button>
            </form>
          </div>
        );

      case 'skill-hub': // New Case for Skill Hub
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">The Skill Hub: Level Up Your Domestic Abilities!</h2>
              <p className="text-gray-600 mb-4">
                "There are no mistakes, only lessons learned" – especially when it comes to loading the dishwasher efficiently! This is where we acknowledge areas for growth and proactively seek to improve our household superpowers.
              </p>

              <h3 className="text-md font-semibold text-gray-900 mb-3">Request New Training (Because even superheroes need mentors.)</h3>
              <form onSubmit={addTrainingRequest} className="space-y-4 mb-6">
                <div>
                  <label htmlFor="training-skill" className="block text-sm font-medium text-gray-700 mb-2">
                    Skill to Master:
                  </label>
                  <input
                    id="training-skill"
                    type="text"
                    value={newTrainingSkill}
                    onChange={(e) => setNewTrainingSkill(e.target.value)}
                    placeholder="e.g., 'Advanced Dust Bunny Hunting' or 'Mystery Stain Removal'"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="training-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Training Type:
                  </label>
                  <select
                    id="training-type"
                    value={newTrainingType}
                    onChange={(e) => setNewTrainingType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Internal">Internal (Someone in the house teaches me!)</option>
                    <option value="External">External (Point me to a YouTube video, a course, or just leave me alone with it.)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="training-notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Any Specifics? (e.g., "Need patience training for laundry folding.")
                  </label>
                  <textarea
                    id="training-notes"
                    value={newTrainingNotes}
                    onChange={(e) => setNewTrainingNotes(e.target.value)}
                    placeholder="Why this skill? Any specific challenges?"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <GraduationCap className="h-4 w-4" />
                  Request Training! (For a smarter, more capable us!)
                </button>
              </form>
            </div>

            {/* All Training Requests */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Training Missions (Waves of Learning!)</h3>
              <div className="space-y-3">
                {trainingRequests.length > 0 ? (
                  trainingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{request.skillName}</p>
                        <p className="text-sm text-gray-600">Requested by: {request.requestedByName}</p>
                        <p className="text-xs text-gray-500">Type: {request.trainingType} | Status: {request.status}</p>
                        {request.notes && <p className="text-xs text-gray-500 italic mt-1">Notes: "{request.notes}"</p>}
                      </div>
                      {(request.requestedBy === user.uid) && (
                        <button
                          onClick={() => deleteTrainingRequest(request.id, request.skillName)}
                          className="text-red-500 hover:text-red-700 transition-colors ml-4"
                          title="Cancel this training quest."
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No training requests pending. Are we already domestic gods?</p>
                )}
              </div>
            </div>

            {/* My Skills Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Personal Skill Tree (Amplify Your Resonance!):</h3>
                <p className="text-gray-600 mb-4">
                    List your skills here, from 'Novice' to 'Grand Master'! Because knowing what you're good at (or want to be good at) is part of self-awareness. Each new skill amplifies your contribution to the collective harmony.
                </p>
                <form onSubmit={(e) => { e.preventDefault(); addMySkill(e.target.skillNameInput.value); e.target.skillNameInput.value = ''; }} className="flex gap-3 mb-6">
                    <input
                        id="skillNameInput"
                        type="text"
                        placeholder="e.g., 'Dishwasher Loading', 'Emergency Snack Deployment'"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Skill
                    </button>
                </form>

                <div className="space-y-3">
                    {currentSkills.length > 0 ? (
                        currentSkills.map(skill => (
                            <div key={skill.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="h-5 w-5 text-purple-500" />
                                    <span className="font-medium text-gray-900">{skill.name}</span>
                                    <select
                                        value={skill.level}
                                        onChange={(e) => updateMySkillLevel(skill.name, e.target.value)}
                                        className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="Novice">Novice</option>
                                        <option value="Apprentice">Apprentice</option>
                                        <option value="Journeyman">Journeyman</option>
                                        <option value="Expert">Expert</option>
                                        <option value="Grand Master">Grand Master</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => removeMySkill(skill.name)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    title={`Remove "${skill.name}" from your skill list`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-8">Your skill tree is looking a bit bare. Time to branch out! Add some skills above.</p>
                    )}
                </div>
            </div>
          </div>
        );

      // --- Removed old Feature Requests and Sync Session Ideas as they're now under Clarity Hub or replaced ---
      // case 'feature-requests':
      //   return (...)
      // case 'sync-session-ideas':
      //   return (...)

      default:
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon (Probably after we've mastered telekinesis.)</h2>
            <p className="text-gray-600">This feature is still under top-secret development. We're working on making it so amazing, it will spontaneously generate peace and quiet.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Home className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">Home Harmony Hub (Now with more sarcasm and resonant vibes!)</span>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <form onSubmit={handleQuickAddTask} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickAddTaskText}
                    onChange={(e) => setNewTask(e.target.value)} // Changed from setNewTaskText to setNewTask
                    placeholder="Quick task? (Before it escapes!)"
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-40"
                  />
                  <button type="submit" className="text-gray-500 hover:text-indigo-600 transition-colors" title="Manifest quick task (before you forget why you walked into this room).">
                    <Plus className="h-5 w-5" />
                  </button>
                  {/* Placeholder for Mic Input - will be implemented later */}
                  <button type="button" className="text-gray-500 hover:text-indigo-600 transition-colors" title="Voice Input (Whisper sweet tasks into my mic, coming soon!)" disabled>
                    <Mic className="h-5 w-5" />
                  </button>
                </form>
              )}

              <div className="flex items-center gap-2 text-gray-700">
                {user && user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                )}
                {user && user.displayName && (
                    <span className="font-medium">{user.displayName} (The Grand Harmonizer)</span>
                )}
              </div>
              {user && (
                <button
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Log out and return to the blissful ignorance of unmanaged chores."
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="w-64">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <nav className="space-y-2">
                {[
                  { id: 'dashboard', label: 'Our Harmony Dashboard', icon: Home },
                  { id: 'tasks', label: 'All Harmony Tasks', icon: CheckCircle },
                  { id: 'clarity-hub', label: 'The Clarity Hub', icon: MessageCircleQuestion },
                  { id: 'harmony-gallery', label: 'Harmony Gallery & Bard Booth', icon: Heart },
                  { id: 'personal-expression-studio', label: 'My Creative Canvas', icon: PenTool }, // New tab for creation
                  { id: 'our-harmony-guide', label: 'Our Harmony Guide', icon: BookOpen },
                  { id: 'path-to-good-vibes', label: 'The Path to Good Vibes', icon: Award },
                  { id: 'family', label: 'Our Awesome Household', icon: Users },
                  { id: 'skill-hub', label: 'The Skill Hub', icon: GraduationCap },
                  { id: 'budget', label: 'Budget', icon: DollarSign },
                  { id: 'settings', label: 'Settings', icon: Settings }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === id
                        ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Harmony Narrative Booth Modal */}
      {showNarrativeBoothModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative">
            <button
              onClick={closeNarrativeBooth}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Harmony Narrative Booth: Weave Your Feelings!</h2>
            <p className="text-gray-600 mb-6 text-center">
              It takes immense strength to name your feelings. From the "Atlas of the Heart," select the emotions that resonate with your current, past, or even future (anxiety) wavelength.
            </p>

            {!matchedNarrative ? (
              <>
                <div className="mb-6 space-y-4 max-h-96 overflow-y-auto pr-2">
                  {humanEmotionsAtlas.map(categoryData => (
                    <div key={categoryData.category} className="border-b border-gray-200 pb-3 last:border-b-0">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{categoryData.category}</h3>
                      <div className="flex flex-wrap gap-2">
                        {categoryData.emotions.map(emotion => (
                          <button
                            key={emotion}
                            onClick={() => handleEmotionSelection(emotion)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                              ${selectedNarrativeEmotions.includes(emotion) ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
                            `}
                          >
                            {emotion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleShowMeAStory}
                  disabled={selectedNarrativeEmotions.length === 0}
                  className={`w-full px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2
                    ${selectedNarrativeEmotions.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}
                  `}
                >
                  <BookOpen className="h-5 w-5" />
                  Show Me a Story! (Let's see if this resonates!)
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Oh. Here's a story. Is this about right about how you feel?
                </h3>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-left shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-1">{matchedNarrative.title}</h4>
                  <p className="text-gray-700 italic">"{matchedNarrative.text}"</p>
                  <p className="text-xs text-gray-500 mt-2">
                    (Themes: {matchedNarrative.theme})
                  </p>
                </div>

                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={() => handleNarrativeFeedback('spot-on')}
                    className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${narrativeFeedback === 'spot-on' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    Spot On! 🎉
                  </button>
                  <button
                    onClick={() => handleNarrativeFeedback('close')}
                    className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${narrativeFeedback === 'close' ? 'bg-yellow-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                  >
                    Close, But Not Quite 🤔
                  </button>
                  <button
                    onClick={() => handleNarrativeFeedback('nope')}
                    className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${narrativeFeedback === 'nope' ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    Nope, Not Me 🤷‍♀️
                  </button>
                </div>

                {narrativeFeedback && (
                  <div className="mt-6 border-t pt-4 text-center">
                    <p className="text-gray-700 font-semibold mb-3">
                      Your vulnerability is a gift. Would you like to share this piece of your journey with the household?
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => handleBroadcastVulnerability(false)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Globe className="h-5 w-5" /> Broadcast My Revelation!
                      </button>
                      <button
                        onClick={() => handleBroadcastVulnerability(true)}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <User className="h-5 w-5" /> Share Anonymously
                      </button>
                      <button
                        onClick={closeNarrativeBooth}
                        className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Just For Me (Keep this wave private)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Personal Expression Studio Modal */}
      {showExpressionStudioModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative my-8">
            <button
              onClick={closeExpressionStudio}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">The Personal Expression Studio: Weave Your Own Narrative!</h2>
            <p className="text-gray-600 mb-6 text-center">
              Welcome to your canvas for emotional truth! Here, **all forms of expression are welcome, and seen and heard with no judgment. We approach your creations with simple curiosity, active listening, and as much care as we have capacity for.** Your unique wave is safe to share.
            </p>

            <form onSubmit={addHarmonyCreative} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Your Medium (How will your wave manifest?):
                </label>
                <select
                  value={newExpressionType}
                  onChange={(e) => {
                    setNewExpressionType(e.target.value);
                    setNewCreativeType(e.target.value); // Keep sync with creativeType for storage
                    setComicPanels([{ imageUrl: '', caption: '' }]); // Reset comic panels on type change
                    setNewCreativeContent(''); // Clear content as it might be different for each type
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="poem">Poem ✍️ (Compose your resonant words.)</option>
                  <option value="song">Song/Lyrics 🎶 (Let your feelings find their rhythm.)</option>
                  <option value="comic-book">Comic Book 🖼️ (Capture moments from your wave visually and textually.)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Give your masterpiece a title (Optional, but encouraged for posterity!)
                </label>
                <input
                  type="text"
                  value={newCreativeTitle}
                  onChange={(e) => setNewCreativeTitle(e.target.value)}
                  placeholder={
                    newExpressionType === 'poem' ? "e.g., 'Ode to a Clean Toilet'" :
                    newExpressionType === 'song' ? "e.g., 'The Ballad of the Unmatched Socks'" :
                    "e.g., 'The Great Dust Bunny Conspiracy'"
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {newExpressionType === 'comic-book' ? (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Comic Panels:</h4>
                  {comicPanels.map((panel, index) => (
                    <div key={index} className="border border-gray-200 p-4 rounded-lg bg-gray-50 relative">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Panel {index + 1}</h5>
                      <input
                        type="text"
                        value={panel.imageUrl}
                        onChange={(e) => handleComicPanelChange(index, 'imageUrl', e.target.value)}
                        placeholder="Image URL (e.g., from Imgur, Unsplash) - for visual wave manifestation"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-1 focus:ring-indigo-500"
                      />
                      <textarea
                        value={panel.caption}
                        onChange={(e) => handleComicPanelChange(index, 'caption', e.target.value)}
                        placeholder="Caption or dialogue for this panel (What's your wave saying here?)"
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                      />
                      {comicPanels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeComicPanel(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          title="Remove Panel"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addComicPanel}
                    className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Panel (Add another ripple to your story!)
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Creative Spark (text or external link to audio/image):
                  </label>
                  <textarea
                    value={newCreativeContent}
                    onChange={(e) => setNewCreativeContent(e.target.value)}
                    placeholder={
                      newExpressionType === 'poem' ? "Type your poem here... Let your unique wavelength take form in words." :
                      "Type your song lyrics here, or paste a link to your audio recording (e.g., SoundCloud, Vocaroo). Let your feelings find their rhythm."
                    }
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="expression-private"
                  checked={newExpressionIsPrivate}
                  onChange={(e) => setNewExpressionIsPrivate(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="expression-private" className="text-sm text-gray-700">
                  Keep this Private (Only I can see this expression of my wave)
                </label>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
              >
                <PenTool className="h-4 w-4" />
                Unleash Your Personal Expression!
              </button>
            </form>
          </div>
        </div>
      )}
    </div> // End of main app div (do not delete this line!)
  );
}

export default App;

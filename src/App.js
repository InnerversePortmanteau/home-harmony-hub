import React, { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, updateDoc, arrayUnion, arrayRemove, writeBatch, setDoc, getDoc } from 'firebase/firestore'; // Added getDoc and setDoc
import { auth, googleProvider, db } from './firebase';
// All icons used, including new ones for MySpace, Skills, and Benefits page
import { CheckCircle, Plus, Trash2, Calendar, User, LogOut, Home, Users, DollarSign, Settings, Bell, Lightbulb, Send, Globe, Lock, UserCheck, BookOpen, MessageSquare, Mic, XCircle, Palette, Music, Laugh, Feather, Heart, Award, UserSquare, GraduationCap, Clock } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [featureRequests, setFeatureRequests] = useState([]);
  const [newFeatureRequest, setNewFeatureRequest] = useState({ title: '', description: '', priority: 'medium' });

  // Task related states
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskIsPrivate, setNewTaskIsPrivate] = useState(false);
  // Re-evaluating familyMembers to fetch from Firestore users collection
  const [householdMembers, setHouseholdMembers] = useState([]); // Renamed from familyMembers for clarity

  // Sync Session Ideas states
  const [syncSessionIdeas, setSyncSessionIdeas] = useState([]);
  const [newSyncSessionIdea, setNewSyncSessionIdea] = useState('');

  // Quick add in header state
  const [quickAddTaskText, setQuickAddTaskText] = useState('');

  // Dynamic Categories state
  const [availableCategories, setAvailableCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  // States for Harmony Gallery & Bard Booth
  const [harmonyCreatives, setHarmonyCreatives] = useState([]);
  const [newCreativeContent, setNewCreativeContent] = useState('');
  const [newCreativeTitle, setNewCreativeTitle] = useState('');
  const [newCreativeType, setNewCreativeType] = useState('joke');

  // New states for MySpace (User Profile)
  const [myAvailabilityStatus, setMyAvailabilityStatus] = useState('Available for Tasks');
  const [mySpaceNotes, setMySpaceNotes] = useState('');

  // New states for Skill Hub
  const [trainingRequests, setTrainingRequests] = useState([]);
  const [newTrainingSkill, setNewTrainingSkill] = useState('');
  const [newTrainingType, setNewTrainingType] = useState('Internal');
  const [newTrainingNotes, setNewTrainingNotes] = useState('');
  const [currentSkills, setCurrentSkills] = useState([]); // For the current user's skills


  // Suggested Categories for household responsibilities (for initial fallback)
  const initialDefaultCategories = [
    'General', 'Cleaning', 'Cooking & Meal Prep', 'Shopping & Errands',
    'Yard Work & Outdoor', 'Pet Care', 'Home Maintenance & Repairs',
    'Bills & Finances', 'Appointments & Planning', 'Vehicle Maintenance',
    'Tech & Gadgets', 'Donations & Decluttering', 'Health & Wellness'
  ];

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // Ensure user profile exists in Firestore and initialize it
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          // Initialize user profile with default MySpace info and empty skills
          await setDoc(userRef, {
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            availabilityStatus: 'Available for Tasks',
            mySpaceNotes: 'Ready to harmonize!',
            skills: [],
            createdAt: new Date()
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadTasks();
      loadFeatureRequests();
      loadSyncSessionIdeas();
      loadCategories();
      loadHarmonyCreatives();
      loadHouseholdMembers(); // Load all household members
      loadMySpaceInfo(); // Load current user's MySpace info
      loadTrainingRequests(); // Load training requests
      loadMySkills(); // Load current user's skills
    } else {
      setTasks([]);
      setFeatureRequests([]);
      setSyncSessionIdeas([]);
      setAvailableCategories([]); // Clear categories on logout
      setHarmonyCreatives([]); // Clear creative content on logout
      setHouseholdMembers([]);
      setMyAvailabilityStatus('Available for Tasks');
      setMySpaceNotes('');
      setTrainingRequests([]);
      setCurrentSkills([]);
    }
  }, [user]);

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
      console.error('Error loading household members:', error);
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
      }
    } catch (error) {
      console.error('Error loading MySpace info:', error);
      alert("Couldn't retrieve your personal harmony settings. Perhaps the cosmic alignment is off.");
    }
  };

  const updateMySpaceInfo = async (e) => {
    e.preventDefault(); // Prevent page reload if this is part of a form
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        availabilityStatus: myAvailabilityStatus,
        mySpaceNotes: mySpaceNotes,
        updatedAt: new Date()
      });
      alert("Your MySpace status has been updated! Now everyone knows if you're avoiding them... I mean, focusing on deep work.");
      await loadHouseholdMembers(); // Refresh for others to see
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
    if (!newCategoryName.trim()) return;

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

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert("Sign-in failed. Did you forget your Google password? Or perhaps the universe is just testing our harmony.");
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      alert("Can't escape that easily! Just kidding, sign out failed for some reason. Maybe it loves you too much.");
    }
  };

  // Load tasks from Firestore
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

  // Add task to Firestore
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
      alert(`Task "${newTask}" added. Now, about that clarity... 😉`);
    } catch (error) {
      console.error('Error adding task:', error);
      alert("Adding a task failed. Maybe the universe doesn't want you to have that much harmony just yet.");
    }
  };

  // Handle quick add task from header
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
      alert(`Quick task "${quickAddTaskText}" added. Another item for the grand ballet of domestic bliss!`);
    } catch (error) {
      console.error('Error adding quick task:', error);
      alert("Failed to quickly add task. Is it a sign you should just go back to bed?");
    }
  };

  // Delete task from Firestore
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

  // Toggle task completion
  const toggleTaskCompletion = async (task) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        completed: !task.completed
      });
      await loadTasks();
      if (!task.completed) {
        alert(`Congratulations, ${user.displayName}! You've conquered "${task.text}"! A true hero of the harmonious home.`);
      } else {
        alert(`"${task.text}" is back on the list. Did you miss it? Or just enjoy the thrill of re-doing things?`);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      alert("Couldn't flip the completion switch. Maybe the task is in a rebellious phase?");
    }
  };

  // Assign task to a user
  const assignTask = async (taskId, assignedUserUid, assignedUserName) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        assignedTo: assignedUserUid,
        assignedToName: assignedUserName,
      });
      await loadTasks();
      if (assignedUserUid) {
        alert(`Huzzah! "${assignedUserName}" has bravely volunteered for duty! Let the shared mental load commence!`);
      } else {
        alert("Task unassigned. Who knew freedom could feel so... unburdened?");
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      alert("Assignment failed. Perhaps the task is too complex for human understanding, or it's just really bad at commitment.");
    }
  };

  // Load feature requests from Firestore
  const loadFeatureRequests = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'featureRequests'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const loadedRequests = [];
      querySnapshot.forEach((doc) => {
        loadedRequests.push({ id: doc.id, ...doc.data() });
      });
      setFeatureRequests(loadedRequests);
    } catch (error) {
      console.error('Error loading feature requests:', error);
      alert("Failed to load bright ideas. Maybe they were too bright and blinded the database?");
    }
  };

  // Add feature request to Firestore
  const addFeatureRequest = async (e) => {
    e.preventDefault();
    if (!newFeatureRequest.title.trim() || !newFeatureRequest.description.trim() || !user) {
        alert("Please, don't leave me hanging. Give your brilliant idea a title and description, or it will forever be a mystery.");
        return;
    }

    try {
      await addDoc(collection(db, 'featureRequests'), {
        title: newFeatureRequest.title,
        description: newFeatureRequest.description,
        priority: newFeatureRequest.priority,
        status: 'pending',
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        createdAt: new Date()
      });
      setNewFeatureRequest({ title: '', description: '', priority: 'medium' });
      await loadFeatureRequests();
      alert("Your bright idea has been submitted! We'll get to it after we've solved world peace... or peeled those potatoes.");
    } catch (error) {
      console.error('Error adding feature request:', error);
      alert("Failed to send your brilliant idea. Did you try turning it off and on again?");
    }
  };

  // Delete feature request from Firestore
  const deleteFeatureRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to retract this stroke of genius? What if it was *the one*?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'featureRequests', requestId));
      await loadFeatureRequests();
      alert("Idea removed. Probably for the best. Some ideas are just *too* brilliant.");
    } catch (error) {
      console.error('Error deleting feature request:', error);
      alert("Couldn't delete the idea. It's probably self-aware and resisting.");
    }
  };

  // Load Sync Session Ideas from Firestore
  const loadSyncSessionIdeas = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'syncSessionIdeas'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const loadedIdeas = [];
      querySnapshot.forEach((doc) => {
        loadedIdeas.push({ id: doc.id, ...doc.data() });
      });
      setSyncSessionIdeas(loadedIdeas);
    } catch (error) {
      console.error('Error loading sync session ideas:', error);
      alert("Failed to load sync ideas. Maybe everyone's just too in sync to need more ideas?");
    }
  };

  // Add Sync Session Idea to Firestore
  const addSyncSessionIdea = async (e) => {
    e.preventDefault();
    if (!newSyncSessionIdea.trim() || !user) {
        alert("Even brilliant minds need to type something. What's on your mind?");
        return;
    }
    try {
      await addDoc(collection(db, 'syncSessionIdeas'), {
        text: newSyncSessionIdea,
        userId: user.uid,
        userName: user.displayName,
        createdAt: new Date()
      });
      setNewSyncSessionIdea('');
      await loadSyncSessionIdeas();
      alert(`Sync idea added! Another nugget of conversational gold for our next 'get-in-sync' hang out.`);
    } catch (error) {
      console.error('Error adding sync session idea:', error);
      alert("Failed to add sync idea. Perhaps the cosmos deems this discussion unworthy. (Or Firebase is acting up).");
    }
  };

  // Delete single Sync Session Idea from Firestore
  const deleteSyncSessionIdea = async (ideaId) => {
    try {
      await deleteDoc(doc(db, 'syncSessionIdeas', ideaId));
      await loadSyncSessionIdeas();
      alert("Idea gracefully removed. Just like that time we 'decided' to ignore a task by deleting it.");
    } catch (error) {
      console.error('Error deleting sync session idea:', error);
      alert("This idea is stubbornly refusing to leave. Must be a really important topic.");
    }
  };

  // Clear all Sync Session Ideas (e.g., after a meeting)
  const clearAllSyncSessionIdeas = async () => {
    if (window.confirm("Are you sure you want to clear all sync session ideas? This cannot be undone, much like that embarrassing story from last holiday.")) {
      try {
        const querySnapshot = await getDocs(collection(db, 'syncSessionIdeas'));
        const batch = writeBatch(db);
        querySnapshot.forEach((document) => {
          batch.delete(document.ref);
        });
        await batch.commit();
        await loadSyncSessionIdeas();
        alert("All sync ideas cleared! Now, what *were* we talking about?");
      } catch (error) {
        console.error('Error clearing all sync session ideas:', error);
        alert("Clearing ideas failed. They're probably too attached to us.");
      }
    }
  };

  // --- Firestore Operations for Harmony Creatives ---
  const loadHarmonyCreatives = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'harmonyCreatives'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const loadedCreatives = [];
      querySnapshot.forEach((doc) => {
        loadedCreatives.push({ id: doc.id, ...doc.data() });
      });
      setHarmonyCreatives(loadedCreatives);
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
        createdAt: new Date()
      });
      setNewCreativeContent('');
      setNewCreativeTitle('');
      setNewCreativeType('joke'); // Reset to default
      await loadHarmonyCreatives();
      alert(`Your ${newCreativeType} has been added to the Harmony Gallery! Prepare for applause... or polite silence.`);
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

  // --- Firestore Operations for Skill Hub ---
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

    // Prevent duplicates
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

  // Loading screen
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

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Home className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Home Harmony Hub</h1>
            <p className="text-gray-600 mb-8">Organize your family life with ease (and a dash of shared sarcasm!)</p>
            <button
              onClick={signInWithGoogle}
              className="w-full bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
            >
              <img 
                src="https://developers.google.com/identity/images/g-logo.png" 
                alt="Google" 
                className="w-5 h-5"
              />
              Sign in with Google (Don't worry, we won't tell anyone about the potato incident.)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main app content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a New Harmony Task</h2>
              <form onSubmit={addTask} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="What harmony needs to be created? (Be specific, unlike that time with the 'clean the kitchen' task.)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label htmlFor="task-category" className="text-sm text-gray-700">Category:</label>
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
                    Keep this one just for me (because some harmony is a solo act).
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Harmony Task (May the odds be ever in your favor!)
                </button>
              </form>

              {/* Add New Category Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Add a New Category (Because 'Miscellaneous' is so last season.)</h3>
                <form onSubmit={addCategory} className="flex gap-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., 'Existential Dread' or 'Snack Procurement'"
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
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Our Curated Category Collection (Handle with care, they're delicate):</h4>
                    <div className="flex flex-wrap gap-2">
                        {availableCategories.map(category => (
                            <span key={category} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                {category}
                                <button
                                    onClick={() => removeCategory(category)}
                                    className="ml-2 -mr-0.5 h-4 w-4 text-gray-500 hover:text-red-600 transition-colors"
                                    title={`Banish "${category}"`}
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Harmony Tasks (Behold, our efforts!)</h2>
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
                        {task.isPrivate ? <Lock className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Private Task: Don't Touch My Precious!" /> : <Globe className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Shared Task: For All to Behold (and do)." />}
                        {task.assignedToName && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"><UserCheck className="h-3 w-3" /> Assigned to: {task.assignedToName} (Good luck, champ!)</span>}
                      </span>
                    </div>
                    {task.userId === user.uid && ( // Only the creator can delete
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 transition-colors ml-2"
                        title="Delete this task (if you dare)."
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No harmony tasks yet. The universe is surprisingly quiet. Let's add some chaos... I mean, harmony!</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Harmony Tasks (A Symphony of To-Dos!)</h2>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => toggleTaskCompletion(task)} className="focus:outline-none" title="Mark as Done/Undone (The eternal struggle!)">
                      <CheckCircle className={`h-5 w-5 ${task.completed ? 'text-green-500' : 'text-gray-400'}`} />
                    </button>
                    <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                      {task.text}
                      {task.category && <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{task.category}</span>}
                      {task.isPrivate ? <Lock className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Private Task: My Secret Burden" /> : <Globe className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Shared Task: Your Burden Now!" />}
                      {task.assignedToName && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"><UserCheck className="h-3 w-3" /> Assigned to: {task.assignedToName}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!task.assignedTo && !task.isPrivate && ( // Can only assign shared tasks
                       <button
                         onClick={() => assignTask(task.id, user.uid, user.displayName)}
                         className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                         title="Volunteer for glory (or chores)."
                       >
                         Assign to Me! (Be brave!)
                       </button>
                    )}
                    {task.assignedTo === user.uid && ( // Only current assignee can unassign
                      <button
                        onClick={() => assignTask(task.id, null, null)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition-colors"
                        title="Abandon ship! (Just kidding, re-open for grabs)."
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
                <p className="text-gray-500 text-center py-8">No harmony tasks yet. The house is either sparkling or we're all in denial. Probably the latter. Add one from the dashboard!</p>
              )}
            </div>
          </div>
        );

      case 'family': // This will now be the "MySpace" area for household members
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Our Awesome Household! (The Pillars of Harmony & Occasional Chaos!)</h2>
            <p className="text-gray-600 mb-4">Behold the magnificent individuals contributing to our domestic bliss. See who's currently available for heroic acts (like bringing snacks) or deep contemplation.</p>
            
            {/* MySpace Section for Current User */}
            <div className="mb-8 p-6 bg-indigo-50 rounded-lg shadow-sm border border-indigo-100">
                <h3 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-2">
                    <UserSquare className="h-6 w-6"/> Your Personal MySpace (Keep it real, folks!)
                </h3>
                <form onSubmit={updateMySpaceInfo} className="space-y-4">
                    <div>
                        <label htmlFor="availability-status" className="block text-sm font-medium text-gray-700 mb-2">
                            My Current Vibe/Availability:
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
                        <label htmlFor="myspace-notes" className="block text-sm font-medium text-gray-700 mb-2">
                            My Inner Monologue / Important Notes for the Household:
                        </label>
                        <textarea
                            id="myspace-notes"
                            value={mySpaceNotes}
                            onChange={(e) => setMySpaceNotes(e.target.value)}
                            placeholder="Feeling reflective today. Or, 'Just finished the laundry, praise me!'"
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Send className="h-4 w-4" />
                        Update MySpace
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
          </div>
        );

      case 'path-to-good-vibes': // Renamed from 'benefits'
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

      case 'sync-session-ideas':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ideas for Our Next Get-In-Sync Hangout! (Because adulting needs bullet points.)</h2>
            <p className="text-gray-600 mb-4">
              Jot down anything that comes to mind for us to chat about during our next family sync-up. That brilliant thought you had while doing the laundry? The minor annoyance from breakfast? The profound philosophical question about why we still have that one broken chair? No pressure, just a shared notepad for topics that require *actual* human interaction, not just task completion.
            </p>
            <form onSubmit={addSyncSessionIdea} className="flex gap-3 mb-6">
              <input
                type="text"
                value={newSyncSessionIdea}
                onChange={(e) => setNewSyncSessionIdea(e.target.value)}
                placeholder="Got an idea for our next riveting chat? Spill it!"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Brainwave!
              </button>
            </form>

            <div className="space-y-3">
              {syncSessionIdeas.length > 0 ? (
                syncSessionIdeas.map((idea) => (
                  <div key={idea.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900 flex-1">
                      {idea.text}
                      <span className="text-xs text-gray-500 ml-2"> (added by {idea.userName} on {new Date(idea.createdAt.toDate()).toLocaleDateString()}, probably just after finding another rogue sock)</span>
                    </span>
                    <button
                      onClick={() => deleteSyncSessionIdea(idea.id)}
                      className="text-red-500 hover:text-red-700 transition-colors ml-4"
                      title="Make this idea vanish like that last piece of cake."
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No ideas yet. Our collective minds are either perfectly aligned, or we're all too busy staring blankly at the ceiling. Add something that pops into your head (before it pops out!).</p>
              )}
            </div>

            {syncSessionIdeas.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={clearAllSyncSessionIdeas}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                  title="Prepare for a fresh start! Or, you know, just tidy up the ideas."
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All Ideas (After Our Epic Sync-Up!)
                </button>
              </div>
            )}
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
                            <h3 className="font-medium text-gray-900">{creative.title} <span className="text-sm text-gray-500 ml-2">({creative.type.charAt(0).toUpperCase() + creative.type.slice(1)})</span></h3>
                          </div>
                          <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{creative.content}</p>
                          {/* Basic handling for links */}
                          {(creative.type === 'art' || creative.type === 'song') && creative.content.startsWith('http') && (
                            <a href={creative.content} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">
                              View/Listen to the Masterpiece!
                            </a>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Shared by {creative.userName} on {new Date(creative.createdAt.toDate()).toLocaleDateString()}
                          </p>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Training Missions:</h3>
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
                      {(request.requestedBy === user.uid) && ( // Only requester can delete their request
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Personal Skill Tree:</h3>
                <p className="text-gray-600 mb-4">
                    List your skills here, from 'Novice' to 'Grand Master'! Because knowing what you're good at (or want to be good at) is part of self-awareness.
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

      case 'feature-requests':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bright Ideas & Wishes for the Hub! (Because even perfect things can be... more perfect.)</h2>
              <p className="text-gray-600 mb-4">Got a brilliant idea to make our Home Harmony Hub even better? Perhaps a button that automatically makes coffee? Let us know!</p>
              <form onSubmit={addFeatureRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idea Title (Keep it snappy, like a good punchline!)
                  </label>
                  <input
                    type="text"
                    value={newFeatureRequest.title}
                    onChange={(e) => setNewFeatureRequest({...newFeatureRequest, title: e.target.value})}
                    placeholder="A quick summary of your awesome idea"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tell us more! (Don't leave out the juicy details!)
                  </label>
                  <textarea
                    value={newFeatureRequest.description}
                    onChange={(e) => setNewFeatureRequest({...newFeatureRequest, description: e.target.value})}
                    placeholder="Describe your idea in more detail... imagine explaining it to a very confused squirrel."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How important is this idea? (On a scale from 'meh' to 'world-changing harmony!')
                  </label>
                  <select
                    value={newFeatureRequest.priority}
                    onChange={(e) => setNewFeatureRequest({...newFeatureRequest, priority: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="low">Low (It can wait for the apocalypse.)</option>
                    <option value="medium">Medium (Worth considering after tea.)</option>
                    <option value="high">High (URGENT! Our very harmony depends on it!)</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Your Bright Idea! (And cross your fingers.)
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Brilliant Ideas Submitted (Prepare for awe!)</h2>
              <div className="space-y-4">
                {featureRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{request.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.priority === 'high' ? 'bg-red-100 text-red-800' :
                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                            request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                        <p className="text-xs text-gray-500">
                          Submitted {new Date(request.createdAt.toDate()).toLocaleDateString()} (by {request.userName})
                        </p>
                      </div>
                      <button
                        onClick={() => deleteFeatureRequest(request.id)}
                        className="text-red-500 hover:text-red-700 transition-colors ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {featureRequests.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No bright ideas yet. Our developers are weeping from boredom. Send us one above!
                  </p>
                )}
              </div>
            </div>
          </div>
        );

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
              <span className="text-xl font-bold text-gray-900">Home Harmony Hub (Now with more sarcasm!)</span>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <form onSubmit={handleQuickAddTask} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickAddTaskText}
                    onChange={(e) => setQuickAddTaskText(e.target.value)}
                    placeholder="Quick task? (Before it escapes!)"
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-40"
                  />
                  <button type="submit" className="text-gray-500 hover:text-indigo-600 transition-colors" title="Add quick task (before you forget why you walked into this room).">
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
                  { id: 'sync-session-ideas', label: 'Sync Session Ideas', icon: MessageSquare },
                  { id: 'harmony-gallery', label: 'Harmony Gallery & Bard Booth', icon: Heart },
                  { id: 'our-harmony-guide', label: 'Our Harmony Guide', icon: BookOpen },
                  { id: 'path-to-good-vibes', label: 'The Path to Good Vibes', icon: Award }, // New Name for Benefits
                  { id: 'family', label: 'Our Awesome Household', icon: Users }, // This is now the MySpace/Member View
                  { id: 'skill-hub', label: 'The Skill Hub', icon: GraduationCap }, // New Skill Hub Tab
                  { id: 'feature-requests', label: 'Bright Ideas & Wishes', icon: Lightbulb },
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
    </div>
  );
}

export default App;
```

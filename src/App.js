import React, { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, updateDoc } from 'firebase/firestore'; // Import updateDoc
import { auth, googleProvider, db } from './firebase';
import { CheckCircle, Plus, Trash2, Calendar, User, LogOut, Home, Users, DollarSign, Settings, Bell, Lightbulb, Send, Globe, Lock, UserCheck } from 'lucide-react'; // Added Globe, Lock, UserCheck icons

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [featureRequests, setFeatureRequests] = useState([]);
  const [newFeatureRequest, setNewFeatureRequest] = useState({ title: '', description: '', priority: 'medium' });

  // New state for task creation/editing
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskIsPrivate, setNewTaskIsPrivate] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]); // To store other users for assignment (simplified for now)


  // Suggested Categories for household responsibilities
  const taskCategories = [
    'General',
    'Cleaning',
    'Cooking',
    'Shopping',
    'Yard Work',
    'Pet Care',
    'Maintenance',
    'Kids',
    'Finances',
    'Appointments',
  ];

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load tasks and family members when user changes
  useEffect(() => {
    if (user) {
      loadTasks();
      loadFeatureRequests();
      // In a real app, you'd fetch family members from a 'users' collection
      // For now, let's simulate by just having the current user as an option
      setFamilyMembers([{ uid: user.uid, displayName: user.displayName, email: user.email }]);
    } else {
      setTasks([]);
      setFeatureRequests([]);
      setFamilyMembers([]);
    }
  }, [user]);

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Load tasks from Firestore
  const loadTasks = async () => {
    if (!user) return;
    
    try {
      // Fetch tasks: private tasks for the current user AND shared tasks
      const qPrivate = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const qShared = query(
        collection(db, 'tasks'),
        where('isPrivate', '==', false), // Only fetch shared tasks
        where('userId', '!=', user.uid), // Don't fetch tasks already covered by qPrivate
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
        // Only add shared tasks that aren't already added as private tasks by the current user
        if (!loadedTasksMap.has(doc.id)) {
          loadedTasksMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
      
      // Convert map values back to an array and sort by createdAt
      const allLoadedTasks = Array.from(loadedTasksMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      setTasks(allLoadedTasks);

    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  // Add task to Firestore
  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !user) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        text: newTask,
        completed: false,
        userId: user.uid,
        userName: user.displayName, // Store creator's name
        isPrivate: newTaskIsPrivate, // New field
        assignedTo: null, // New field, initially unassigned
        assignedToName: null, // New field
        category: newTaskCategory || 'General', // New field, default to 'General'
        createdAt: new Date()
      });
      setNewTask('');
      setNewTaskCategory('');
      setNewTaskIsPrivate(false);
      await loadTasks(); // Reload tasks
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Delete task from Firestore
  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      await loadTasks(); // Reload tasks
    } catch (error) {
      console.error('Error deleting task:', error);
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
    } catch (error) {
      console.error('Error toggling task completion:', error);
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
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  // Load feature requests from Firestore (no changes here for this request)
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
    }
  };

  // Add feature request to Firestore (no changes here for this request)
  const addFeatureRequest = async (e) => {
    e.preventDefault();
    if (!newFeatureRequest.title.trim() || !newFeatureRequest.description.trim() || !user) return;

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
      await loadFeatureRequests(); // Reload requests
    } catch (error) {
      console.error('Error adding feature request:', error);
    }
  };

  // Delete feature request from Firestore (no changes here for this request)
  const deleteFeatureRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'featureRequests', requestId));
      await loadFeatureRequests(); // Reload requests
    } catch (error) {
      console.error('Error deleting feature request:', error);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
            <p className="text-gray-600 mb-8">Organize your family life with ease</p>
            <button
              onClick={signInWithGoogle}
              className="w-full bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
            >
              <img 
                src="https://developers.google.com/identity/images/g-logo.png" 
                alt="Google" 
                className="w-5 h-5"
              />
              Sign in with Google
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
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
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
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasks.filter(task => !task.completed).length}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Task</h2>
              <form onSubmit={addTask} className="space-y-4"> {/* Changed to space-y-4 for vertical layout */}
                <div>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="What needs to be done?"
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
                    <option value="">Select Category</option>
                    {taskCategories.map((category) => (
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
                    Make this task private (only visible to you)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h2>
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
                        {task.isPrivate ? <Lock className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Private Task" /> : <Globe className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Shared Task" />}
                        {task.assignedToName && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"><UserCheck className="h-3 w-3" />{task.assignedToName}</span>}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 hover:text-red-700 transition-colors ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No tasks yet. Add one above!</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Tasks</h2>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => toggleTaskCompletion(task)} className="focus:outline-none">
                      <CheckCircle className={`h-5 w-5 ${task.completed ? 'text-green-500' : 'text-gray-400'}`} />
                    </button>
                    <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                      {task.text}
                      {task.category && <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{task.category}</span>}
                      {task.isPrivate ? <Lock className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Private Task" /> : <Globe className="ml-2 h-4 w-4 text-gray-500 inline-block" title="Shared Task" />}
                      {task.assignedToName && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"><UserCheck className="h-3 w-3" />{task.assignedToName}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!task.assignedTo && (
                       <button
                         onClick={() => assignTask(task.id, user.uid, user.displayName)}
                         className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                       >
                         Assign to Me
                       </button>
                    )}
                    {task.assignedTo === user.uid && (
                      <button
                        onClick={() => assignTask(task.id, null, null)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition-colors"
                      >
                        Unassign
                      </button>
                    )}
                    {task.userId === user.uid && ( // Only the creator can delete
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-gray-500 text-center py-8">No tasks yet. Add one from the dashboard!</p>
              )}
            </div>
          </div>
        );

      case 'family': // Placeholder for Family management
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Family Members</h2>
            <p className="text-gray-600 mb-4">Manage your family members here. In a full application, this would involve inviting members and setting up their accounts.</p>
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div key={member.uid} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-indigo-500" />
                  <span className="font-medium">{member.displayName}</span>
                  <span className="text-gray-500 text-sm">({member.email})</span>
                  {member.uid === user.uid && <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">You</span>}
                </div>
              ))}
              {familyMembers.length === 0 && (
                <p className="text-gray-500 text-center py-8">No family members added yet.</p>
              )}
            </div>
             <p className="mt-6 text-gray-600 text-sm">
                *Note: For a real multi-user family app, you would need more robust user management, including a way to invite and manage family members, perhaps a "family code" system or administrator roles to ensure security and privacy. This current implementation loads tasks based on `userId` (for private tasks) and `isPrivate: false` (for shared tasks), and `familyMembers` is a simplified placeholder.
            </p>
          </div>
        );

      case 'feature-requests':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Request New Feature</h2>
              <form onSubmit={addFeatureRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feature Title
                  </label>
                  <input
                    type="text"
                    value={newFeatureRequest.title}
                    onChange={(e) => setNewFeatureRequest({...newFeatureRequest, title: e.target.value})}
                    placeholder="Brief title for your feature request"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newFeatureRequest.description}
                    onChange={(e) => setNewFeatureRequest({...newFeatureRequest, description: e.target.value})}
                    placeholder="Describe the feature you'd like to see added..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newFeatureRequest.priority}
                    onChange={(e) => setNewFeatureRequest({...newFeatureRequest, priority: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Submit Feature Request
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Feature Requests</h2>
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
                          Submitted {new Date(request.createdAt.toDate()).toLocaleDateString()}
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
                    No feature requests yet. Submit one above!
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600">This feature is under development.</p>
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
              <span className="text-xl font-bold text-gray-900">Home Harmony Hub</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <img 
                  src={user.photoURL} 
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium">{user.displayName}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
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
                  { id: 'dashboard', label: 'Dashboard', icon: Home },
                  { id: 'tasks', label: 'Tasks', icon: CheckCircle },
                  { id: 'family', label: 'Family', icon: Users }, // Moved Family up
                  { id: 'feature-requests', label: 'Feature Requests', icon: Lightbulb },
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

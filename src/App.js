import React, { useState } from 'react';
import { MessageCircle, Plus, CheckCircle, Home, Heart, Users, Star } from 'lucide-react';

const HomeHarmonyHub = () => {
  const [currentView, setCurrentView] = useState('home');
  const [messages, setMessages] = useState([
    {
      id: 1,
      title: "Garden Hose Adventure",
      observation: "The garden hose was left out in the rain and got all tangled up",
      question: "Should we create a fun routine for putting the hose away after each use?",
      suggestion: "Maybe we could make it a 'hose hero' rotating responsibility?",
      status: "needs_discussion",
      author: "Mom",
      timestamp: new Date().toLocaleDateString()
    },
    {
      id: 2,
      title: "Banana Mystery",
      observation: "No bananas were available for breakfast smoothies this morning",
      question: "How can we keep track of breakfast essentials so everyone gets their favorites?",
      suggestion: "Could we create a 'breakfast buddy' system to check supplies?",
      status: "needs_discussion",
      author: "Dad",
      timestamp: new Date().toLocaleDateString()
    }
  ]);

  const [resolvedItems, setResolvedItems] = useState([
    {
      id: 101,
      title: "Compost Bin Routine",
      resolution: "Agreed: Check and empty compost bin every evening after dinner. Responsibility rotates weekly with our fun 'Compost Champion' schedule!",
      dateResolved: "2024-12-15",
      originalAuthor: "Sister"
    }
  ]);

  const [feedback, setFeedback] = useState([]);
  const [newFeedback, setNewFeedback] = useState({
    type: 'improvement',
    title: '',
    description: '',
    priority: 'medium'
  });

  const handleSubmitMessage = () => {
    if (newMessage.title && newMessage.observation && newMessage.question) {
      const message = {
        id: Date.now(),
        ...newMessage,
        status: 'needs_discussion',
        author: 'You',
        timestamp: new Date().toLocaleDateString()
      };
      setMessages([...messages, message]);
      setNewMessage({ title: '', observation: '', question: '', suggestion: '' });
      setCurrentView('active');
    }
  };

  const markAsResolved = (messageId, resolution) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      const resolvedItem = {
        id: messageId,
        title: message.title,
        resolution: resolution,
        dateResolved: new Date().toLocaleDateString(),
        originalAuthor: message.author
      };
      setResolvedItems([...resolvedItems, resolvedItem]);
      setMessages(messages.filter(m => m.id !== messageId));
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      needs_discussion: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Home className="w-8 h-8 text-purple-600" />
              <Heart className="w-6 h-6 text-pink-500" />
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Our Home Harmony Hub</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Welcome to our shared space for clear communication and smooth living! 
              Let's work together to make our home even more harmonious. ✨
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-800">{messages.length}</h3>
              <p className="text-gray-600">Active Messages</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-800">{resolvedItems.length}</h3>
              <p className="text-gray-600">Resolved Items</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-800">100%</h3>
              <p className="text-gray-600">Family Awesome</p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">How Our Hub Works 🌟</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">1️⃣</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Share & Clarify</h3>
                <p className="text-gray-600 text-sm">Notice something that needs clarity? Add it to our hub - no blame, just clear communication!</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">2️⃣</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Discuss Together</h3>
                <p className="text-gray-600 text-sm">We'll review messages together and create solutions that work for everyone.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">3️⃣</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Celebrate & Learn</h3>
                <p className="text-gray-600 text-sm">Mark items as resolved and build our family's living guidebook of harmony!</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setCurrentView('add')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-8 h-8 mx-auto mb-2" />
              <h3 className="text-xl font-bold mb-2">Add New Message</h3>
              <p className="text-blue-100">Share something that needs clarity</p>
            </button>
            <button
              onClick={() => setCurrentView('active')}
              className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg p-6 hover:from-green-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <MessageCircle className="w-8 h-8 mx-auto mb-2" />
              <h3 className="text-xl font-bold mb-2">View Active Messages</h3>
              <p className="text-green-100">See what's ready for discussion</p>
            </button>
          </div>

          {/* Quick Links */}
          <div className="text-center space-y-2">
            <button
              onClick={() => setCurrentView('resolved')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              View Our Resolved Agreements
            </button>
            <br />
            <button
              onClick={() => setCurrentView('feedback')}
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
            >
              <Star className="w-5 h-5" />
              Suggest App Improvements
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'add') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setCurrentView('home')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Home className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Add a New Message for Clarity</h1>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Title (Short & Factual) 📝
                </label>
                <input
                  type="text"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage({...newMessage, title: e.target.value})}
                  placeholder="e.g., 'Saturday Morning Breakfast Prep'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observation / Context 👀
                </label>
                <textarea
                  value={newMessage.observation}
                  onChange={(e) => setNewMessage({...newMessage, observation: e.target.value})}
                  placeholder="Describe what you noticed or what happened, without assigning blame..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Focus on facts and observations, not who did or didn't do something.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question / Need for Clarity ❓
                </label>
                <textarea
                  value={newMessage.question}
                  onChange={(e) => setNewMessage({...newMessage, question: e.target.value})}
                  placeholder="What needs to be understood or decided as a family?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Frame this as a question or a need for shared understanding.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggested Resolution (Optional) 💡
                </label>
                <textarea
                  value={newMessage.suggestion}
                  onChange={(e) => setNewMessage({...newMessage, suggestion: e.target.value})}
                  placeholder="If you have an idea for how to handle this, share it here..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">This is just a starting point for discussion - not a final decision!</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSubmitMessage}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  Add Message to Hub ✨
                </button>
                <button
                  onClick={() => setCurrentView('home')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setCurrentView('home')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Active Messages for Clarity</h1>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {messages.length} active
            </span>
          </div>

          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{message.title}</h3>
                    <p className="text-sm text-gray-500">By {message.author} on {message.timestamp}</p>
                  </div>
                  <StatusBadge status={message.status} />
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Observation:</h4>
                    <p className="text-gray-600">{message.observation}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Question:</h4>
                    <p className="text-gray-600">{message.question}</p>
                  </div>
                  {message.suggestion && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Suggested Resolution:</h4>
                      <p className="text-gray-600">{message.suggestion}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      const resolution = prompt("What was the agreed resolution?");
                      if (resolution) markAsResolved(message.id, resolution);
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    Mark as Resolved ✅
                  </button>
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                    Add Comment 💬
                  </button>
                </div>
              </div>
            ))}
          </div>

          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No active messages</h3>
              <p className="text-gray-500 mb-4">Everything is running smoothly! 🎉</p>
              <button
                onClick={() => setCurrentView('add')}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add a Message
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'feedback') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setCurrentView('home')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Home className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Suggest App Improvements</h1>
              <Star className="w-6 h-6 text-yellow-500" />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">💡 Help Make Our Hub Better!</h3>
              <p className="text-blue-700 text-sm">
                Your ideas make this app work better for our family. What would make it even more awesome?
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback Type 🏷️
                </label>
                <select
                  value={newFeedback.type}
                  onChange={(e) => setNewFeedback({...newFeedback, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="improvement">💡 Improvement Idea</option>
                  <option value="bug">🐛 Something's Not Working</option>
                  <option value="feature">✨ New Feature Request</option>
                  <option value="design">🎨 Design Suggestion</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Summary 📝
                </label>
                <input
                  type="text"
                  value={newFeedback.title}
                  onChange={(e) => setNewFeedback({...newFeedback, title: e.target.value})}
                  placeholder="e.g., 'Add emoji reactions to messages'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell Us More 💭
                </label>
                <textarea
                  value={newFeedback.description}
                  onChange={(e) => setNewFeedback({...newFeedback, description: e.target.value})}
                  placeholder="Describe your idea, what's not working, or what you'd like to see..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How Important? 🎯
                </label>
                <select
                  value={newFeedback.priority}
                  onChange={(e) => setNewFeedback({...newFeedback, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">🟢 Nice to Have</option>
                  <option value="medium">🟡 Would Be Great</option>
                  <option value="high">🔴 Really Need This</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSubmitFeedback}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium"
                >
                  Submit Feedback ✨
                </button>
                <button
                  onClick={() => setCurrentView('home')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {feedback.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Feedback ({feedback.length})</h3>
                <div className="space-y-3">
                  {feedback.slice(-3).map((item) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">
                          {item.type === 'improvement' && '💡'}
                          {item.type === 'bug' && '🐛'}
                          {item.type === 'feature' && '✨'}
                          {item.type === 'design' && '🎨'}
                        </span>
                        <span className="font-medium text-gray-800 text-sm">{item.title}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'resolved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setCurrentView('home')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Our Resolved Agreements</h1>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {resolvedItems.length} resolved
            </span>
          </div>

          <div className="space-y-4">
            {resolvedItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                  <div className="text-right">
                    <StatusBadge status="resolved" />
                    <p className="text-xs text-gray-500 mt-1">Resolved on {item.dateResolved}</p>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Agreed Resolution:</h4>
                  <p className="text-green-700">{item.resolution}</p>
                </div>
                <p className="text-sm text-gray-500 mt-2">Originally raised by {item.originalAuthor}</p>
              </div>
            ))}
          </div>

          {resolvedItems.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No resolved items yet</h3>
              <p className="text-gray-500">Start by adding messages and resolving them together!</p>
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default HomeHarmonyHub;
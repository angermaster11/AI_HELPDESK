// import React, { useState, useRef, useEffect } from 'react';
// import { FiSend, FiPaperclip, FiMic, FiSettings, FiMenu, FiX, FiSun, FiMoon, FiUser } from 'react-icons/fi';
// import { sendMessageToBot } from '../api/api';
// import { Link, useNavigate } from 'react-router-dom';
// import BotMessage from '../api/BotMessage';
// import ScrollToBottom from 'react-scroll-to-bottom';
// import axios from 'axios';
// import { text } from 'framer-motion/client';

// const ModernChatUI = () => {
//   // State management
//   const [messages, setMessages] = useState([
//     { id: 1, text: 'Hello! How can I help you today?', sender: 'bot' }
//   ]);
//   const [input, setInput] = useState({
//     input: "",
//     user_id: localStorage.getItem("user_id") || "",
//     token: localStorage.getItem("token") || "",
//     fileContent: ""
//   });
//   const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
//   const [showSettings, setShowSettings] = useState(false);
//   const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
//   const [sessions, setSessions] = useState([
//     { id: 1, title: 'Getting Started', messages: [{ id: 1, text: 'Hello! How can I help you today?', sender: 'bot' }] }
//   ]);
//   const [activeSession, setActiveSession] = useState(1);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [username, setUsername] = useState('');
//   const [mediaPreview, setMediaPreview] = useState(null);
//   const [fileContent, setFileContent] = useState('');
//   const [error, setError] = useState('');

//   // Refs
//   const inputRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const navigate = useNavigate();

//   // Styles
//   const styles = `
//     .dark .bot-message h2 { color: #e5e7eb; }
//     .dark .bot-message code { background: rgba(255,255,255,0.1); }
//     .dark .bot-message hr { border-top: 1px solid rgba(255,255,255,0.1); }
//     .dark .bot-message a { color: #93c5fd; }
//     .no-scrollbar::-webkit-scrollbar { display: none !important; }
//     .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
//   `;

//   // Effects
//   useEffect(() => {
//     const styleTag = document.createElement('style');
//     styleTag.innerHTML = styles;
//     document.head.appendChild(styleTag);
//     return () => styleTag.remove();
//   }, []);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   useEffect(() => {
//     const savedUsername = localStorage.getItem("username");
//     const user = JSON.parse(localStorage.getItem("user") || "{}");
//     const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    
//     if (loggedIn && savedUsername) {
//       setIsLoggedIn(true);
//       setUsername(savedUsername);
//       const token = localStorage.getItem("token");
//       setInput(prev => ({ ...prev, user_id: user.id || "", token: token || "" }));
//     }
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('darkMode', darkMode);
//     if (darkMode) {
//       document.documentElement.classList.add('dark');
//     } else {
//       document.documentElement.classList.remove('dark');
//     }
//   }, [darkMode]);

//   useEffect(() => {
//     if (inputRef.current) {
//       inputRef.current.style.height = '48px';
//       inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
//     }
//   }, [input.input]);

//   // Helper functions
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
//   };

//   // Handlers
//  const handleSend = async () => {
//   if (!input.input.trim() && !fileContent) return;

//   try {
//     // Create user message with either text or file content
//     const messageContent = input.input || fileContent || "Shared a file";
//     const userMessage = { 
//       id: Date.now(), 
//       text: messageContent,
//       sender: 'user',
//       isFile: !!fileContent  // Add flag to identify file messages
//     };
    
//     // Update UI immediately
//     setMessages(prev => [...prev, userMessage]);
//     setInput(prev => ({ ...prev, input: "" }));
    
//     // Prepare payload for API
//     const payload = {
//       ...input,
//       input: messageContent,
//       fileContent: fileContent  // Include file content in payload
//     };

//     console.log(payload)

//     // Send to backend
//     const botReply = await sendMessageToBot(payload);
//     const botMessage = { 
//       id: Date.now() + 1, 
//       text: botReply, 
//       sender: 'bot' 
//     };
    
//     setMessages(prev => [...prev, botMessage]);
//     setFileContent('');
//     setMediaPreview(null);
//     if (fileInputRef.current) fileInputRef.current.value = '';

//   } catch (err) {
//     console.error('Send message error:', err);
//     setError('Failed to send message');
//   }
// };

// const handleFileChange = async (e) => {
//   const file = e.target.files[0];
//   if (!file) return;

//   try {
//     setError('');
//     setMediaPreview(null);
//     setFileContent('');

//     if (file.size > 5 * 1024 * 1024) {
//       throw new Error('File size too large (max 5MB)');
//     }

//     if (file.type.startsWith('image/')) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setMediaPreview(reader.result);
//         setFileContent(reader.result); // Store the base64 content
//       };
//       reader.readAsDataURL(file);
//     } else {
//       const formData = new FormData();
//       formData.append('file', file);

//       let endpoint = '/parse/pdf';
//       if (file.type.includes('word')) endpoint = '/parse/docx';
//       if (file.type.includes('excel') || file.type.includes('spreadsheet')) endpoint = '/parse/excel';
//       if (file.type === 'text/csv') endpoint = '/parse/csv';

//       const response = await axios.post(`http://localhost:8000${endpoint}`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       setFileContent(response.data.content);
//       setMediaPreview(URL.createObjectURL(file));
//     }
//   } catch (error) {
//     console.error('File upload error:', error);
//     setError(error.response?.data?.message || error.message || 'File upload failed');
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   }
// };

//   const removeMediaPreview = () => {
//     setMediaPreview(null);
//     setFileContent('');
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   };

//   const createNewSession = () => {
//     const newSession = {
//       id: Date.now(),
//       title: `Chat ${new Date().toLocaleTimeString()}`,
//       messages: []
//     };
//     setSessions(prev => [...prev, newSession]);
//     setActiveSession(newSession.id);
//     setMessages([]);
//     if (window.innerWidth < 768) setSidebarOpen(false);
//   };

//   const selectSession = (sessionId) => {
//     const session = sessions.find(s => s.id === sessionId) || { messages: [] };
//     setActiveSession(sessionId);
//     setMessages(session.messages);
//     if (window.innerWidth < 768) setSidebarOpen(false);
//   };

//   const handleLogin = () => {
//     if (isLoggedIn) {
//       localStorage.removeItem("username");
//       localStorage.removeItem("token");
//       localStorage.removeItem("isLoggedIn");
//       setIsLoggedIn(false);
//       setUsername('');
//       navigate('/');
//     } else {
//       navigate('/login');
//       const newUsername = 'User_' + Math.random().toString(36).slice(2, 7);
//       const newUser = { id: Math.random().toString(36).substring(7) };
//       localStorage.setItem("username", newUsername);
//       localStorage.setItem("user", JSON.stringify(newUser));
//       localStorage.setItem("user_id", newUser.id);
//       localStorage.setItem("isLoggedIn", "true");
//       setIsLoggedIn(true);
//       setUsername(newUsername);
//       setInput(prev => ({ ...prev, user_id: newUser.id }));
//     }
//   };

//   return (
//     <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100`}>
//       {/* Sidebar */}
//       <div className={`bg-white dark:bg-gray-800 border-r dark:border-gray-700 
//         ${sidebarOpen ? 'w-64 fixed md:relative z-40 h-full' : 'w-0'} 
//         transition-all duration-300 overflow-hidden`}
//         style={{ minWidth: sidebarOpen ? '16rem' : '0' }}
//       >
//         <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
//           <h2 className="text-lg font-semibold">Chat Sessions</h2>
//           <button 
//             onClick={() => setSidebarOpen(false)} 
//             className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
//           >
//             <FiX />
//           </button>
//         </div>

//         <div className="p-4">
//           <button 
//             onClick={createNewSession} 
//             className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
//           >
//             + New Chat
//           </button>
//         </div>

//         <div className="overflow-y-auto h-[calc(100%-180px)]">
//           {sessions.map(session => (
//             <div 
//               key={session.id} 
//               onClick={() => selectSession(session.id)}
//               className={`p-3 mx-2 my-1 rounded-lg cursor-pointer ${
//                 activeSession === session.id
//                   ? 'bg-blue-100 dark:bg-blue-900'
//                   : 'hover:bg-gray-100 dark:hover:bg-gray-700'
//               }`}
//             >
//               <div className="font-medium truncate">{session.title}</div>
//               <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
//                 {session.messages.length > 0 ? session.messages[0].text : 'No messages yet'}
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="p-4 border-t dark:border-gray-700">
//           <div className="flex items-center gap-2 mb-2">
//             <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
//               <FiUser className={isLoggedIn ? 'text-blue-500' : 'text-gray-500'} />
//             </div>
//             <div>
//               {isLoggedIn && username ? (
//                 <div className="text-sm font-medium">{username}</div>
//               ) : (
//                 <div className="text-sm">Guest User</div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col">
//         {/* Header */}
//         <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
//           <button
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
//           >
//             <FiMenu />
//           </button>

//           <h1 className="text-xl font-medium">ChatGPT Clone</h1>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => setDarkMode(!darkMode)}
//               className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
//             >
//               {darkMode ? <FiSun /> : <FiMoon />}
//             </button>
//             <button
//               onClick={() => setShowSettings(!showSettings)}
//               className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
//             >
//               <FiSettings />
//             </button>
//           </div>
//         </div>

//         {/* Messages Area */}
//         <div className="flex-1 overflow-y-auto no-scrollbar">
//           <div className="h-full flex flex-col">
//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//               {messages.length === 0 ? (
//                 <div className="h-full flex items-center justify-center">
//                   <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow">
//                     <h3 className="text-xl font-medium mb-2">Start a conversation</h3>
//                     <p className="text-gray-500 dark:text-gray-400">
//                       Type a message below to begin chatting
//                     </p>
//                   </div>
//                 </div>
//               ) : (
//                 messages.map(msg => (
//                   <div
//                     key={msg.id}
//                     className={`max-w-3xl mx-4 p-4 rounded-lg ${
//                       msg.sender === 'user'
//                         ? 'bg-blue-500 text-white ml-auto'
//                         : 'bg-gray-100 dark:bg-gray-700 mr-auto'
//                     }`}
//                   >
//                     {msg.sender === 'bot' ? (
//                       <BotMessage text={msg.text} />
//                     ) : (
//                       msg.text
//                     )}
//                   </div>
//                 ))
//               )}
//               <div ref={messagesEndRef} />
//             </div>
//           </div>
//         </div>

//         {/* Input Area */}
//         <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
//           {/* Error Display */}
//           {error && (
//             <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-4 py-2 rounded-md shadow-lg flex items-center justify-between max-w-md">
//               <span>{error}</span>
//               <button 
//                 onClick={() => setError('')} 
//                 className="ml-4 text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100"
//               >
//                 <FiX />
//               </button>
//             </div>
//           )}

//           {/* Media Preview */}
//           {mediaPreview && (
//             <div className="relative mb-3 max-w-xs">
//               {mediaPreview.startsWith('data:image') ? (
//                 <img
//                   src={mediaPreview}
//                   alt="Preview"
//                   className="rounded-lg max-h-40 object-contain"
//                 />
//               ) : (
//                 <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center">
//                   <FiPaperclip className="mr-2" />
//                   <span className="truncate">{fileInputRef.current?.files[0]?.name}</span>
//                 </div>
//               )}
//               <button
//                 onClick={removeMediaPreview}
//                 className="absolute top-1 right-1 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700"
//               >
//                 <FiX size={16} />
//               </button>
//             </div>
//           )}

//           <div className="relative">
//             {/* Hidden file input */}
//             <input
//               type="file"
//               ref={fileInputRef}
//               onChange={handleFileChange}
//               accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,image/*"
//               className="hidden"
//               id="file-upload"
//             />

//             <textarea
//               ref={inputRef}
//               value={input.input}
//               onChange={(e) => setInput({ ...input, input: e.target.value })}
//               onKeyDown={(e) => {
//                 if (e.key === 'Enter' && !e.shiftKey) {
//                   e.preventDefault();
//                   handleSend();
//                 }
//               }}
//               placeholder="Type a message..."
//               className="w-full px-3 py-2 pr-16 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none bg-white dark:bg-gray-700 leading-tight"
//               rows={1}
//               style={{ minHeight: '48px' }}
//             />

//             {/* Icons - Send, Mic, Attach */}
//             <div className="absolute right-3 bottom-2 flex gap-2">
//               <label htmlFor="file-upload" className="p-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer">
//                 <FiPaperclip />
//               </label>
//               <button className="p-1 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400">
//                 <FiMic />
//               </button>
//               <button
//                 onClick={handleSend}
//                 disabled={!input.input.trim() && !fileContent}
//                 className="p-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 disabled:text-gray-300 dark:disabled:text-gray-500"
//               >
//                 <FiSend />
//               </button>
//             </div>
//           </div>

//           <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
//             ChatGPT can make mistakes. Consider checking important information.
//           </p>
//         </div>
//       </div>

//       {/* Settings Modal */}
//       {showSettings && (
//         <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-medium">Settings</h3>
//               <button
//                 onClick={() => setShowSettings(false)}
//                 className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
//               >
//                 <FiX />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <h4 className="font-medium mb-2">Appearance</h4>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setDarkMode(false)}
//                     className={`px-4 py-2 border rounded-md ${
//                       !darkMode 
//                         ? 'bg-blue-100 dark:bg-blue-900 border-blue-300' 
//                         : 'border-gray-300 dark:border-gray-600'
//                     }`}
//                   >
//                     Light
//                   </button>
//                   <button
//                     onClick={() => setDarkMode(true)}
//                     className={`px-4 py-2 border rounded-md ${
//                       darkMode 
//                         ? 'bg-blue-100 dark:bg-blue-900 border-blue-300' 
//                         : 'border-gray-300 dark:border-gray-600'
//                     }`}
//                   >
//                     Dark
//                   </button>
//                 </div>
//               </div>

//               <div>
//                 <h4 className="font-medium mb-2">Data Controls</h4>
//                 <button 
//                   onClick={() => {
//                     setMessages([]);
//                     setShowSettings(false);
//                   }}
//                   className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
//                 >
//                   Clear chat history
//                 </button>
//               </div>
//               <div>
//                 <button
//                   onClick={handleLogin}
//                   className={`w-full py-2 px-4 rounded-md ${
//                     isLoggedIn
//                       ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200'
//                       : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-200'
//                   }`}
//                 >
//                   {isLoggedIn ? 'Logout' : 'Login'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ModernChatUI;

import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiMic, FiSettings, FiMenu, FiX, FiSun, FiMoon, FiUser, FiPlus, FiTrash2 } from 'react-icons/fi';
import { sendMessageToBot } from '../api/api';
import { data, useNavigate } from 'react-router-dom';
import BotMessage from '../api/BotMessage';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ModernChatUI = () => {
  // State management
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! How can I help you today?', sender: 'bot' }
  ]);
  const [input, setInput] = useState({
    input: "",
    user_id: localStorage.getItem("user_id") || "",
    token: localStorage.getItem("token") || "",
    fileContent: ""
  });
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [sessions, setSessions] = useState(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    return savedSessions ? JSON.parse(savedSessions) : [
      { 
        id: 1, 
        title: 'Getting Started', 
        createdAt: new Date().toISOString(),
        messages: [{ id: 1, text: 'Hello! How can I help you today?', sender: 'bot' }] 
      }
    ];
  });
  const [activeSession, setActiveSession] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [mediaPreview, setMediaPreview] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [micActive, setMicActive] = useState(false);

  // Refs
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Effects
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    
    if (loggedIn && savedUsername) {
      setIsLoggedIn(true);
      setUsername(savedUsername);
      const token = localStorage.getItem("token");
      setInput(prev => ({ ...prev, user_id: user.id || "", token: token || "" }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '48px';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input.input]);

  // Helper functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handlers
  const handleSend = async () => {
    if (!input.input.trim() && !fileContent) return;

    try {
      // Create user message with either text or file content
      const messageContent = input.input || fileContent || "Shared a file";
      const userMessage = { 
        id: Date.now(), 
        text: messageContent,
        sender: 'user',
        isFile: !!fileContent,
        timestamp: new Date().toISOString()
      };
      
      // Update UI immediately
      setMessages(prev => [...prev, userMessage]);
      setInput(prev => ({ ...prev, input: "" }));
      
      // Update active session
      setSessions(prev => prev.map(session => 
        session.id === activeSession 
          ? { ...session, messages: [...session.messages, userMessage] }
          : session
      ));

      // Prepare payload for API
      const payload = {
        ...input,
        input: messageContent,
        fileContent: fileContent
      };

      // Show typing indicator
      setIsTyping(true);
      
      // Send to backend
      const botReply = await sendMessageToBot(payload);
      const botMessage = { 
        id: Date.now() + 1, 
        text: botReply, 
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setSessions(prev => prev.map(session => 
        session.id === activeSession 
          ? { ...session, messages: [...session.messages, botMessage] }
          : session
      ));
      
      setFileContent('');
      setMediaPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Send message error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setError('');
      setMediaPreview(null);
      setFileContent('');

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size too large (max 10MB)');
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(reader.result);
          setFileContent(reader.result);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('audio/')) {
        // Handle audio files
        const audioUrl = URL.createObjectURL(file);
        setMediaPreview(audioUrl);
        setFileContent(`[Audio file: ${file.name}]`);
      } else if (file.type.startsWith('video/')) {
        // Handle video files
        const videoUrl = URL.createObjectURL(file);
        setMediaPreview(videoUrl);
        setFileContent(`[Video file: ${file.name}]`);
      } else {
        // Handle documents
        const formData = new FormData();
        formData.append('file', file);

        let endpoint = '/parse/pdf';
        if (file.type.includes('word')) endpoint = '/parse/docx';
        if (file.type.includes('excel') || file.type.includes('spreadsheet')) endpoint = '/parse/excel';
        if (file.type === 'text/csv') endpoint = '/parse/csv';
        if (file.type === 'text/plain') endpoint = '/parse/txt';

        const response = await axios.post(`http://localhost:8000${endpoint}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        let database = response.data.content || '';
        console.log(database);
        if(Array.isArray(database)) {
          database = database.join('\n');
        }
        console.log(database);
        setFileContent(database);
        setMediaPreview(URL.createObjectURL(file));
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError(error.response?.data?.message || error.message || 'File upload failed');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMediaPreview = () => {
    setMediaPreview(null);
    setFileContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createNewSession = () => {
    const newSession = {
      id: Date.now(),
      title: `Chat ${new Date().toLocaleTimeString()}`,
      createdAt: new Date().toISOString(),
      messages: []
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSession(newSession.id);
    setMessages([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const selectSession = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId) || { messages: [] };
    setActiveSession(sessionId);
    setMessages(session.messages);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const deleteSession = (sessionId, e) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSession === sessionId) {
      setMessages([]);
      if (sessions.length > 1) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setActiveSession(remainingSessions[0].id);
        setMessages(remainingSessions[0].messages);
      } else {
        createNewSession();
      }
    }
  };

  const handleLogin = () => {
    if (isLoggedIn) {
      localStorage.removeItem("username");
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user_id");
      setIsLoggedIn(false);
      setUsername('');
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  const toggleMic = async () => {
  if (!micActive) {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      let audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        
        try {
          // Convert to MP3 (simplified - you'd need proper conversion)
          const audioBuffer = await audioBlob.arrayBuffer();
          // Here you would typically use a library to convert to MP3
          // For demo, we'll just send the WAV file
          
          const formData = new FormData();
          formData.append('audio', new Blob([audioBuffer], { type: 'audio/wav' }), 'recording.wav');
          
          const response = await axios.post('http://localhost:5000/convert', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          
          if (response.data.message) {
            setInput(prev => ({ ...prev, input: response.data.message }));
            handleSend();
          }
        } catch (err) {
          console.error('Audio conversion error:', err);
          setError('Failed to convert speech to text');
        }
      };
      
      mediaRecorder.start();
      setMicActive(true);
      
      // Stop recording after 5 seconds of silence or when button clicked again
      const stopRecording = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }
        setMicActive(false);
      };
      
      // Auto-stop after 30 seconds max
      const timeoutId = setTimeout(stopRecording, 30000);
      
      // Store these so we can clean up
      micRef.current = { mediaRecorder, stream, timeoutId, stopRecording };
      
    } catch (err) {
      console.error('Microphone access error:', err);
      setError(`Error accessing microphone: ${err.message}`);
      setMicActive(false);
    }
  } else {
    // Stop recording
    if (micRef.current) {
      micRef.current.stopRecording();
    }
  }
};

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200`}>
      {/* Sidebar */}
      <div className={`bg-white dark:bg-gray-800 border-r dark:border-gray-700 
        ${sidebarOpen ? 'w-64 fixed md:relative z-40 h-full' : 'w-0'} 
        transition-all duration-300 overflow-hidden flex flex-col`}
        style={{ minWidth: sidebarOpen ? '16rem' : '0' }}
      >
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Chat Sessions</h2>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiX />
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={createNewSession} 
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            <FiPlus /> New Chat
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {sessions.map(session => (
            <div 
              key={session.id} 
              onClick={() => selectSession(session.id)}
              className={`p-3 mx-2 my-1 rounded-lg cursor-pointer transition-colors ${
                activeSession === session.id
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="font-medium truncate flex-1">{session.title}</div>
                <button 
                  onClick={(e) => deleteSession(session.id, e)}
                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session.messages.length > 0 ? 
                  session.messages[session.messages.length - 1].text.substring(0, 50) + 
                  (session.messages[session.messages.length - 1].text.length > 50 ? '...' : '') 
                  : 'No messages yet'}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatDate(session.createdAt)}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
              <FiUser className={isLoggedIn ? 'text-blue-500' : 'text-gray-500'} />
            </div>
            <div className="flex-1 min-w-0">
              {isLoggedIn && username ? (
                <div className="text-sm font-medium truncate">{username}</div>
              ) : (
                <div className="text-sm">Guest User</div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isLoggedIn ? 'Logged in' : 'Not logged in'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogin}
            className={`w-full py-1 px-3 rounded-md text-sm ${
              isLoggedIn
                ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200'
                : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-200'
            }`}
          >
            {isLoggedIn ? 'Logout' : 'Login'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiMenu />
          </button>

          <h1 className="text-xl font-medium flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
              AI Assistant
            </span>
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Settings"
            >
              <FiSettings />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-w-md w-full">
                    <h3 className="text-xl font-medium mb-2">Start a conversation</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Type a message below to begin chatting with your AI assistant
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setInput({...input, input: "What can you do?"})}
                        className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        What can you do?
                      </button>
                      <button 
                        onClick={() => setInput({...input, input: "Explain AI in simple terms"})}
                        className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        Explain AI
                      </button>
                      <button 
                        onClick={() => setInput({...input, input: "Give me coding help"})}
                        className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        Coding help
                      </button>
                      <button 
                        onClick={() => setInput({...input, input: "Tell me a joke"})}
                        className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        Tell me a joke
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`max-w-3xl mx-4 p-4 rounded-lg ${
                        msg.sender === 'user'
                          ? 'bg-blue-500 text-white ml-auto'
                          : 'bg-gray-100 dark:bg-gray-700 mr-auto'
                      }`}
                    >
                      {msg.sender === 'bot' ? (
                        <BotMessage text={msg.text} />
                      ) : msg.isFile ? (
                        mediaPreview ? (
                          mediaPreview.startsWith('data:image') ? (
                            <img
                              src={mediaPreview}
                              alt="User uploaded"
                              className="rounded-lg max-h-60 object-contain"
                            />
                          ) : (
                            <div className="p-3 bg-white/20 rounded-lg">
                              <a 
                                href={mediaPreview} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <FiPaperclip /> View attached file
                              </a>
                            </div>
                          )
                        ) : (
                          msg.text
                        )
                      ) : (
                        msg.text
                      )}
                      <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-3xl mx-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 mr-auto"
                    >
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
          {/* Error Display */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-4 py-2 rounded-md shadow-lg flex items-center justify-between max-w-md z-50"
            >
              <span>{error}</span>
              <button 
                onClick={() => setError('')} 
                className="ml-4 text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100"
              >
                <FiX />
              </button>
            </motion.div>
          )}

          {/* Media Preview */}
          {mediaPreview && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="relative mb-3 max-w-xs"
            >
              {mediaPreview.startsWith('data:image') ? (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="rounded-lg max-h-60 object-contain"
                />
              ) : mediaPreview.startsWith('blob:') && (fileInputRef.current?.files[0]?.type.startsWith('audio/') || 
                                                      fileInputRef.current?.files[0]?.type.startsWith('video/')) ? (
                fileInputRef.current?.files[0]?.type.startsWith('audio/') ? (
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-2">
                    <FiMic />
                    <span>Audio file ready</span>
                  </div>
                ) : (
                  <video 
                    src={mediaPreview} 
                    controls 
                    className="rounded-lg max-h-60"
                  />
                )
              ) : (
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-2">
                  <FiPaperclip />
                  <span className="truncate">{fileInputRef.current?.files[0]?.name}</span>
                </div>
              )}
              <button
                onClick={removeMediaPreview}
                className="absolute top-1 right-1 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 transition-colors"
              >
                <FiX size={16} />
              </button>
            </motion.div>
          )}

          <div className="relative">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,image/*,audio/*,video/*"
              className="hidden"
              id="file-upload"
            />

            <textarea
              ref={inputRef}
              value={input.input}
              onChange={(e) => setInput({ ...input, input: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-16 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none bg-white dark:bg-gray-700 leading-tight transition-all duration-200"
              rows={1}
              style={{ minHeight: '48px' }}
            />

            {/* Icons - Send, Mic, Attach */}
            <div className="absolute right-3 bottom-3 flex gap-2">
              <label 
                htmlFor="file-upload" 
                className={`p-1 cursor-pointer transition-colors ${
                  fileContent ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500 dark:hover:text-blue-400'
                }`}
              >
                <FiPaperclip />
              </label>
              <button 
                onClick={toggleMic}
                className={`p-1 transition-colors ${
                  micActive ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-blue-500 dark:hover:text-blue-400'
                }`}
              >
                <FiMic />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.input.trim() && !fileContent}
                className={`p-1 transition-colors ${
                  input.input.trim() || fileContent 
                    ? 'text-blue-500 hover:text-blue-600 dark:hover:text-blue-400' 
                    : 'text-gray-300 dark:text-gray-500'
                }`}
              >
                <FiSend />
              </button>
            </div>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            AI assistant may produce inaccurate information. Verify important facts.
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Appearance</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDarkMode(false)}
                      className={`px-4 py-2 border rounded-md transition-colors ${
                        !darkMode 
                          ? 'bg-blue-100 dark:bg-blue-900 border-blue-300' 
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setDarkMode(true)}
                      className={`px-4 py-2 border rounded-md transition-colors ${
                        darkMode 
                          ? 'bg-blue-100 dark:bg-blue-900 border-blue-300' 
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Dark
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Chat Settings</h4>
                  <button 
                    onClick={() => {
                      setMessages([]);
                      setShowSettings(false);
                    }}
                    className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    Clear current chat
                  </button>
                  <button 
                    onClick={() => {
                      createNewSession();
                      setShowSettings(false);
                    }}
                    className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    Start new chat
                  </button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Account</h4>
                  <button
                    onClick={handleLogin}
                    className={`w-full py-2 px-4 rounded-md transition-colors ${
                      isLoggedIn
                        ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200'
                        : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-200'
                    }`}
                  >
                    {isLoggedIn ? 'Logout' : 'Login'}
                  </button>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Account</h4>
                  <button
                    onClick={()=>{
                      navigate('/speech');
                      
                    }}
                    className={`w-full py-2 px-4 rounded-md transition-color bg-blue-100 hover:bg-blue-200 text-red-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-red-200 `}
                      
                  >
                    Voice Mode
                  </button>
                </div>

                <div className="pt-2 border-t dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Version 1.0.0
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernChatUI;
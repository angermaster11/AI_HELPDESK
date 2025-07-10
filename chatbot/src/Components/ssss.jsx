import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { FaMicrophone, FaPaperPlane, FaPlus, FaBars, FaTimes, FaMoon, FaSun } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(() => JSON.parse(localStorage.getItem('sessions')) || ['Welcome']);
  const [currentSession, setCurrentSession] = useState(() => localStorage.getItem('currentSession') || 'Welcome');
  const [allMessages, setAllMessages] = useState(() => JSON.parse(localStorage.getItem('allMessages')) || {
    Welcome: [{ sender: 'bot', text: 'Hello! How can I assist you with COSMOS University today?' }]
  });
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('darkMode')) || false);
  const [aiTyping, setAiTyping] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const messagesEndRef = useRef(null);
  
  const messages = allMessages[currentSession] || [];

  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(sessions));
    localStorage.setItem('currentSession', currentSession);
    localStorage.setItem('allMessages', JSON.stringify(allMessages));
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (token) {
      localStorage.setItem('token', token);
    }
  }, [sessions, currentSession, allMessages, darkMode, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

const handleLogin = () => {
  if(!token){
    navigate('/login');
  }else {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  }
}

const handleSend = async () => {
  if (!input.trim()) return;

  const updatedMessages = [...messages, { sender: 'user', text: input }];
  const updatedAllMessages = { ...allMessages, [currentSession]: updatedMessages };
  setAllMessages(updatedAllMessages);
  setInput('');
  setAiTyping(true);

  try {
    let token = localStorage.getItem('token');
    let response;

    if (!token) {
      response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input,
        }),
      });
    } else {
      response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          input: input,
          token: token,
        }),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Request failed');
    }

    const data = await response.json();
    if (!data) {
      throw new Error('No response from server');
    }console.log(data);
    
    
    
    // Handle different response formats
    let botResponse;
//     const userString = localStorage.getItem('user');
//     if (!userString) {
//   throw new Error('User not found in localStorage');
// }
// const user = JSON.parse(userString);
// const role = user.role;
    if (typeof data === 'string') {
      botResponse = data
    } else if (data.content) {
      // Handle the response format you shared
      botResponse = data.content;
    } 
    else {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.role === 'staff') {
        botResponse = data.message || 'No response available';
      } else {
        botResponse = data || 'No response available';
      }
    }

    setAllMessages(prev => ({
      ...prev,
      [currentSession]: [...updatedMessages, { sender: 'bot', text: botResponse }]
    }));
  } catch (error) {
    const errorMessage = { sender: 'bot', text: `❌ Error: ${error.message}` };
    setAllMessages(prev => ({ ...prev, [currentSession]: [...updatedMessages, errorMessage] }));
  } finally {
    setAiTyping(false);
  }
};

  const handleNewSession = () => {
    const newSession = `Chat ${sessions.length + 1}`;
    setSessions([newSession, ...sessions]);
    setCurrentSession(newSession);
    setAllMessages(prev => ({
      ...prev,
      [newSession]: [{ sender: 'bot', text: 'New session started! How can I help you with COSMOS University?' }]
    }));
    setSidebarOpen(false);
  };

  const switchSession = (s) => {
    setCurrentSession(s);
    setSidebarOpen(false);
  };

  return (
    <div className={`chat-wrapper ${darkMode ? 'dark' : ''}`}>
      <div className="topbar glass">
        <div className="menu-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </div>
        <div className="logo">COSMOS HelpDesk</div>
        <div className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </div>
        <button className="login-btn" onClick={handleLogin}>
          {token ? 'Log Out' : 'Login'}
        </button>
      </div>

      <div className="chat-app">
        <div className={`sidebar glass ${sidebarOpen ? 'open' : ''}`}>
          <h2>Sessions</h2>
          <button className="new-chat-btn" onClick={handleNewSession}>
            <FaPlus /> New Chat
          </button>
          <div className="session-list">
            {sessions.map((s, i) => (
              <div
                key={i}
                onClick={() => switchSession(s)}
                className={`session-item ${currentSession === s ? 'active' : ''}`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="chat-window">
          <div className="chat-header">{currentSession}</div>
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                {msg.text}
              </motion.div>
            ))}
            {aiTyping && (
              <motion.div className="message bot-message typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                HelpDesk is typing<span className="dots">...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area glass">
            <button className="icon-btn">
              <FaMicrophone />
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about COSMOS University..."
            />
            <button className="send-btn" onClick={handleSend}>
              <FaPaperPlane /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
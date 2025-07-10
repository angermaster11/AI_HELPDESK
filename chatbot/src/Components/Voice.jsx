import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Voice = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('Press Start Listening');
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('Speech recognition not supported in your browser');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true; // Keep listening continuously
    recognitionRef.current.interimResults = true; // Show interim results as user speaks
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      console.log("Speech recognition started");
      setStatus('Listening... Speak now');
    };

    recognitionRef.current.onresult = async (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      // Process interim and final results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Only update transcript with interim results
      setTranscript(interimTranscript);

      // Once the speech is final, process the command
      if (finalTranscript) {
        console.log("Final Command recognized:", finalTranscript);
        await processCommand(finalTranscript.trim());
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setStatus('No speech detected. Still listening...');
      } else if (event.error === 'not-allowed') {
        setStatus('Microphone access denied. Please allow microphone access.');
        setIsListening(false);
      } else {
        setStatus(`Error: ${event.error}`);
      }
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        recognitionRef.current.start(); // Restart recognition when it ends
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  // Process voice commands
  const processCommand = async (command) => {
    const lowerCommand = command.toLowerCase();
    console.log("Processing command:", command);

    // Basic example: responds to "hello"
    if (lowerCommand.includes('hello')) {
      const reply = 'Hello there! How can I assist you today?';
      setResponse(reply);
      speak(reply);
    } else {
      await fetchChatbotResponse(command);  // Fetch response from FastAPI
    }
  };

  // Fetch chatbot response from FastAPI
  const fetchChatbotResponse = async (userInput) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    if (!token || !userId) {
      setStatus('User not logged in');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:8000/chat',
        { input: userInput, user_id: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const botResponse = response.data.bot_response?.content || 'No response from server';
      setResponse(botResponse);
      speak(botResponse);  // Speak the bot response immediately
    } catch (error) {
      console.error('Error fetching from API:', error);
      setStatus('Error communicating with the server');
    }
  };

  // Text-to-speech function
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setStatus('Press Start Listening');  // Update status after speaking
    };
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatus('Press Start Listening');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setStatus('Listening... Speak now');
      } catch (error) {
        setStatus('Error starting recognition');
        console.error('Error starting recognition:', error);
      }
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '500px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center' }}>Voice Interaction</h1>
      
      <div style={{ 
        backgroundColor: '#f0f0f0',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <p>{status}</p>
      </div>
      
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button 
          onClick={toggleListening}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isListening ? '#ff4444' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        minHeight: '100px'
      }}>
        <h3 style={{ marginTop: '0' }}>Your Speech:</h3>
        <p>{transcript || '...'}</p>
      </div>
      
      <div style={{ 
        backgroundColor: '#e8f5e9',
        borderRadius: '8px',
        padding: '15px',
        minHeight: '100px'
      }}>
        <h3 style={{ marginTop: '0' }}>Response:</h3>
        <p>{response || '...'}</p>
      </div>
    </div>
  );
};

export default Voice;

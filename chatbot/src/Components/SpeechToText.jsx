import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function SpeechToText() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showResponse, setShowResponse] = useState(true);
  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const lastTranscriptRef = useRef('');

  // Initialize speech synthesis and WebSocket
  useEffect(() => {
    speechSynthesisRef.current = window.speechSynthesis;

    const setupWebSocket = () => {
      if (socketRef.current) {
        socketRef.current.close();
      }

      const ws = new WebSocket('ws://localhost:5000/ws/stt');
      socketRef.current = ws;

      ws.onopen = () => console.log('✅ WebSocket connected');
      ws.onmessage = (event) => {
        if (event.data && event.data !== lastTranscriptRef.current) {
          setTranscript(prev => {
            const newText = prev + ' ' + event.data;
            lastTranscriptRef.current = newText;
            return newText;
          });
        }
      };
      ws.onerror = (error) => console.error('❌ WebSocket error:', error);
      ws.onclose = () => console.log('⚠️ WebSocket closed');

      return () => {
        if (ws.readyState === WebSocket.OPEN) ws.close();
      };
    };

    setupWebSocket();

    return () => {
      if (socketRef.current) socketRef.current.close();
      stopAllSpeech();
    };
  }, []);

  const stopAllSpeech = () => {
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const startRecording = async () => {
    try {
      // Stop any ongoing speech
      stopAllSpeech();
      
      // Reset states
      setTranscript('');
      setChatResponse('');
      lastTranscriptRef.current = '';
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Setup audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(2048, 1, 1);
      
      processorRef.current.onaudioprocess = (e) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          const audioData = e.inputBuffer.getChannelData(0);
          const int16Data = convertFloat32ToInt16(audioData);
          socketRef.current.send(int16Data.buffer);
        }
      };
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);

    if (transcript.trim()) {
      await sendToChatbot(transcript);
    }
  };

  const convertFloat32ToInt16 = (buffer) => {
    const l = buffer.length;
    const buf = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      buf[i] = Math.min(1, buffer[i]) * 0x7FFF;
    }
    return buf;
  };

  const clearTranscript = () => {
    stopAllSpeech();
    setTranscript('');
    setChatResponse('');
    lastTranscriptRef.current = '';
  };

  const sendToChatbot = async (text) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user_id = localStorage.getItem('user_id');

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          user_id: user_id,
          token: token
        })
      });

      const data = await response.json();
      setChatResponse(data.output || "No response from chatbot");
      
      if (data.output) {
        speakResponse(data.output);
      }
    } catch (error) {
      console.error('Error sending to chatbot:', error);
      setChatResponse('Error connecting to chatbot');
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = (text) => {
    stopAllSpeech();
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesisRef.current.speak(utterance);
    } else {
      console.warn('Text-to-speech not supported in this browser');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleMicClick = () => {
    if (isSpeaking) {
      stopAllSpeech();
    }
    toggleRecording();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Voice Assistant</h1>
            <p className="text-indigo-200">Tap to speak with AI</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-all"
            >
              ChatMode
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-all"
            >
              Login
            </button>
          </div>
        </header>

        <div className="flex flex-col items-center">
          {/* Circular microphone button - always clickable */}
          <button
            onClick={handleMicClick}
            className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 mb-8
              ${isRecording 
                ? 'bg-red-500 animate-pulse ring-4 ring-red-300/50' 
                : 'bg-indigo-600 hover:bg-indigo-700 ring-2 ring-indigo-400/30'}
              ${isSpeaking ? 'ring-yellow-400/50' : ''}`}
          >
            {isRecording ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 md:h-16 md:w-16 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 md:h-16 md:w-16 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Clear button */}
          <button 
            onClick={clearTranscript}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-full text-white font-medium flex items-center transition-all mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Clear Conversation
          </button>

          {/* Toggle buttons for text visibility */}
          <div className="flex space-x-4 mb-8">
            <button 
              onClick={() => setShowTranscript(!showTranscript)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${showTranscript ? 'bg-green-500' : 'bg-gray-500'}`}
            >
              {showTranscript ? 'Hide Input' : 'Show Input'}
            </button>
            <button 
              onClick={() => setShowResponse(!showResponse)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${showResponse ? 'bg-green-500' : 'bg-gray-500'}`}
            >
              {showResponse ? 'Hide Response' : 'Show Response'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {showTranscript && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-2 text-indigo-300">Your Message:</h2>
              <div className="min-h-20 p-3 bg-black/30 rounded">
                {transcript || <span className="text-gray-400">Your spoken message will appear here...</span>}
              </div>
            </div>
          )}

          {showResponse && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-2 text-indigo-300">AI Response:</h2>
              <div className="min-h-20 p-3 bg-black/30 rounded flex items-center">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce delay-200"></div>
                  </div>
                ) : chatResponse ? (
                  chatResponse
                ) : (
                  <span className="text-gray-400">AI response will appear here...</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-indigo-300 mt-6">
          <p>
            {isSpeaking ? "AI is speaking - tap mic to interrupt" : 
             isRecording ? "Listening... tap again to stop" : 
             "Tap the microphone to speak"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SpeechToText;
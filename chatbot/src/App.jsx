import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './Components/Chat'; // Main chat componentr
import Login from './Components/Login';
import Voice from './Components/Voice';
import SpeechToText from './Components/SpeechToText'; // Speech-to-text component

// import Home from './Home'; // Optional home page component

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Main chat interface at root path */}
          <Route path="/" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/voice" element={<Voice />} />
          <Route path="/speech" element={<SpeechToText />} />
          {/* <Route path="/voice" element={<Voice />} /> */}
          
          {/* Optional additional routes */}
          {/* <Route path="/about" element={<About />} /> */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
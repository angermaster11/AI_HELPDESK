import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await axios.post('http://localhost:8000/auth/login', {
        email: username,
        password: password,
      });

      const data = res.data;
      console.log('✅ Login success:', data);

      // Save token and user info to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', data.user.username || data.user.email); // adjust as needed

      navigate('/');
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      setErrorMsg('Invalid credentials or server error.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back!</h2>
        <p className="login-subtitle">Please sign in to continue.</p>

        {errorMsg && <p className="error-msg">{errorMsg}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="login-button"
          >
            Login
          </button>
        </form>

        <div className="login-links">
          <a href="#" className="login-link">Forgot Password?</a> |{' '}
          <a href="#" className="login-link">Create an Account</a>
        </div>
      </div>
    </div>
  );
};

export default Login;

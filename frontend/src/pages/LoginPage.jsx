import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <h2 style={{ fontSize: '1.875rem', fontWeight: '700', textAlign: 'center', color: '#111827' }}>
          Login to Smart Speak
        </h2>
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
          <button type="submit" className="practice-button">
            Login
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#4b5563' }}>
            Don't have an account? <Link to="/signup" style={{ fontWeight: '500', color: '#4f46e5' }}>Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
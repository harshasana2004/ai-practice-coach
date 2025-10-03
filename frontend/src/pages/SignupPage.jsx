import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signup(email, password);
      navigate('/'); // Redirect to dashboard on successful signup
    } catch (err) {
      // Provide more specific feedback based on the error code
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('This email address is already in use.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters long.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        default:
          setError('Failed to create an account. Please try again.');
          break;
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <h2 style={{ fontSize: '1.875rem', fontWeight: '700', textAlign: 'center', color: '#111827' }}>
          Create an Account
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
            Sign Up
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#4b5563' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: '500', color: '#4f46e5' }}>Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
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
      navigate('/');
    } catch (err) {
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
        <h2 className="title" style={{ textAlign: 'center' }}>
          Create an Account
        </h2>
        <form onSubmit={handleSubmit} className="auth-form">
           <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" />
           <input type="password" placeholder="Password (min. 6 characters)" required value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" />
           {error && <p style={{ color: 'var(--error-color)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
           <button type="submit" className="practice-button">Sign Up</button>
           <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
             Already have an account? <Link to="/login" className="auth-link">Login</Link>
           </p>
        </form>
      </div>
    </div>
  );
};
export default SignupPage;
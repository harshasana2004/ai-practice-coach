import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SessionReportPage from './pages/SessionReportPage';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, isLoading } = useAuth();
  const showHeader = user && !isLoading;

  return (
    <div className="app-container">
      {showHeader && <Header />}
      <main className={showHeader ? "main-content" : ""}>
        <div className={showHeader ? "content-wrapper" : ""}>
          <Routes>
            {/* Auth pages do not have the content wrapper padding */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected pages */}
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/session/:sessionId" element={<ProtectedRoute><SessionReportPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
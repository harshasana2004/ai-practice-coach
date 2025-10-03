import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage'; // Import new History page
import SessionReportPage from './pages/SessionReportPage'; // Import new Report page
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
      <div className="app-container">
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
      />
      <Route
        path="/history"
        element={<ProtectedRoute><HistoryPage /></ProtectedRoute>}
      />
      <Route
        path="/session/:sessionId"
        element={<ProtectedRoute><SessionReportPage /></ProtectedRoute>}
      />
    </Routes>
    </div>
  );
}

export default App;

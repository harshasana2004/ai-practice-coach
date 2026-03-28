import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import RadialProgress from './RadialProgress';
import ProgressChart from './ProgressChart';
import CustomDateReport from './CustomDateReport';

const Dashboard = ({ sessions, onStartPractice }) => {
  const stats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { total: 0, avgDuration: '0:00', avgWpm: 0, avgConfidence: 0 };
    }
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalWpm = sessions.reduce((acc, s) => acc + (s.wpm || 0), 0);
    const totalConfidence = sessions.reduce((acc, s) => acc + (s.analysis?.confidenceScore || s.confidenceScore || 0), 0);

    const avgDurationSec = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    const minutes = Math.floor(avgDurationSec / 60);
    const seconds = avgDurationSec % 60;

    return {
      total: totalSessions,
      avgDuration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      avgWpm: totalSessions > 0 ? Math.round(totalWpm / totalSessions) : 0,
      avgConfidence: totalSessions > 0 ? Math.round(totalConfidence / totalSessions) : 0,
    };
  }, [sessions]);

  const getConfidenceClass = (score) => {
    if (score >= 75) return 'confidence-high';
    if (score >= 50) return 'confidence-medium';
    return 'confidence-low';
  };

  return (
    <div className="page-container">
      <div className="dashboard-hero">
        <h1>Ready to Practice?</h1>
        <p>Record a new session and get instant AI feedback to improve your delivery.</p>
        <button onClick={onStartPractice} className="hero-button">
          <MicIcon />
          <span>Start New Session</span>
        </button>
      </div>

      <h2 className="dashboard-recent-sessions" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        Overall Statistics
      </h2>
      <div className="dashboard-stats">
        <div className="stat-item">
          <span className="stat-item-label">Total Sessions</span>
          <span className="stat-item-value" style={{color: 'var(--primary-color)'}}>{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-item-label">Avg Duration</span>
          <span className="stat-item-value">{stats.avgDuration}</span>
        </div>
        <div className="stat-item">
          <RadialProgress label="Avg Words/Min" value={stats.avgWpm} maxValue={250} unit=" WPM" />
        </div>
        <div className="stat-item">
          <RadialProgress label="Avg Confidence" value={stats.avgConfidence} maxValue={100} unit="%" />
        </div>
      </div>

      <div className="dashboard-recent-sessions">
        <h2>Recent Sessions</h2>
        {!sessions || sessions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
             <p className="subtitle" style={{marginTop: 0}}>You haven't completed any sessions yet. Click "Start New Session" above to begin!</p>
          </div>
        ) : (
          <div className="recent-sessions-grid">
            {sessions.slice(0, 3).map((session) => {
              const confidence = session.analysis?.confidenceScore || session.confidenceScore || 0;
              return (
                <Link to={`/session/${session.id}`} key={session.id} className="card session-card">
                    <p className="session-card-transcript">"{session.transcript || 'No transcript'}"</p>
                    <div className="session-card-details">
                      <span>{session.wpm || 0} WPM</span>
                      <span>{(session.duration || 0).toFixed(1)}s</span>
                      <span className={`session-card-confidence ${getConfidenceClass(confidence)}`}>
                          {confidence}% Conf.
                      </span>
                    </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <CustomDateReport sessions={sessions} />
      <ProgressChart sessions={sessions} />
    </div>
  );
};

const MicIcon = () => <svg style={{height: '1.25rem', width: '1.25rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;

export default Dashboard;
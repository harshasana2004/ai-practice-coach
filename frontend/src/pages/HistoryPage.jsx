import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const HistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userSessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
      }));
      setSessions(userSessions);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const getConfidenceClass = (score) => {
    if (score >= 75) return 'confidence-high';
    if (score >= 50) return 'confidence-medium';
    return 'confidence-low';
  };

  return (
    <div className="page-container" style={{ maxWidth: '64rem', margin: 'auto' }}>
      <div className="page-header" style={{textAlign: 'left'}}>
          <h1 className="title">Session History</h1>
          <p className="subtitle">Review your past practice sessions and track improvements.</p>
      </div>
      <div className="card">
        <div className="history-list">
          {loading && <p>Loading history...</p>}
          {!loading && sessions.length === 0 && (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0' }}>
              You haven't completed any practice sessions yet.
            </p>
          )}
          {sessions.map(session => {
            // --- SAFE DATA ACCESS ---
            const confidence = session.analysis?.confidenceScore || session.confidenceScore || 0;
            return (
              <Link to={`/session/${session.id}`} key={session.id} className="history-list-item">
                <div className="history-item-left">
                  <p className="history-item-transcript">"{session.transcript || 'No transcript'}"</p>
                  <div className="history-item-details">
                    <span>{session.wpm || 0} WPM</span>
                    <span>{(session.duration || 0).toFixed(1)}s</span>
                  </div>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem'}}>
                   <span className={`session-card-confidence ${getConfidenceClass(confidence)}`}>
                      {confidence}% Conf.
                   </span>
                   <span className="history-item-date">
                      {session.createdAt ? session.createdAt.toLocaleDateString() : ''}
                   </span>
                 </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  );
};
export default HistoryPage;
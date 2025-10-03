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
        // Convert Firestore Timestamp to a readable JS Date object
        createdAt: doc.data().createdAt.toDate(),
      }));
      setSessions(userSessions);
      setLoading(false);
    });

    // Clean up the real-time listener when the component unmounts
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <div className="content-wrapper" style={{ maxWidth: '56rem' }}>
          <div className="history-page">
            <h1 className="title">Session History</h1>
            <div className="card">
              <div className="history-list">
                {loading && <p>Loading history...</p>}
                {!loading && sessions.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem 0' }}>
                    You haven't completed any practice sessions yet.
                  </p>
                )}
                {sessions.map(session => (
                  <Link to={`/session/${session.id}`} key={session.id}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontWeight: '500', color: '#4f46e5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '30rem' }}>
                          "{session.transcript}"
                        </p>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {session.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
                        <span>{session.wpm} WPM</span>
                        <span>{session.duration.toFixed(1)}s Duration</span>
                        <span style={{ fontWeight: '600' }}>{session.confidenceScore}% Confidence</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HistoryPage;
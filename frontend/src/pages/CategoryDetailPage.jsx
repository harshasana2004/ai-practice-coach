import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ProgressChart from '../components/ProgressChart';
import CustomDateReport from '../components/CustomDateReport';
import Header from '../components/Header';

const CategoryDetailPage = () => {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state
  const { user } = useAuth();

  // 1. Fetch the category's details
  useEffect(() => {
    if (!user || !categoryId) return;
    const getCategoryInfo = async () => {
      try {
        const docRef = doc(db, 'categories', categoryId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          setCategory(docSnap.data());
        } else {
          setError("Category not found or you do not have permission to view it.");
        }
      } catch (err) {
        console.error("Error fetching category info:", err);
        setError("Failed to load category details.");
      }
    };
    getCategoryInfo();
  }, [user, categoryId]);

  // 2. Fetch all sessions for this category
  useEffect(() => {
    if (!user || !categoryId) return;
    setLoading(true);
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      where('categoryId', '==', categoryId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userSessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // --- SAFE DATE HANDLING ---
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
      }));
      setSessions(userSessions);
      setLoading(false);
    }, (err) => {
      console.error("Error listening to sessions (Check your indexes):", err);
      setError("Failed to load sessions for this category.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, categoryId]);

  const getConfidenceClass = (score) => {
    if (score >= 75) return 'confidence-high';
    if (score >= 50) return 'confidence-medium';
    return 'confidence-low';
  };

  // --- RENDER STATES ---

  if (loading) {
    return <div className="page-container" style={{paddingTop: '5rem', textAlign: 'center'}}>Loading sessions...</div>;
  }

  if (error) {
    return (
      <div className="page-container" style={{paddingTop: '5rem', textAlign: 'center'}}>
        <p style={{color: 'var(--error-color)'}}>{error}</p>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/categories" className="auth-link">← Back to All Categories</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '64rem', margin: 'auto' }}>
      <div className="page-header" style={{textAlign: 'left'}}>
          <Link to="/categories" className="auth-link" style={{ fontSize: '0.875rem' }}>← Back to All Categories</Link>
          <h1 className="title" style={{ marginTop: '0.5rem' }}>
            Category: {category ? category.name : '...'}
          </h1>
          <p className="subtitle">All your practice sessions and stats for this category.</p>
      </div>

      {!loading && sessions.length > 0 && (
        <>
          <CustomDateReport sessions={sessions} />
          <ProgressChart sessions={sessions} />
        </>
      )}

      <div className="dashboard-recent-sessions" style={{marginTop: '2.5rem'}}>
        <h2>Sessions in this Category</h2>
        <div className="card">
          <div className="history-list">
            {!loading && sessions.length === 0 && (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0' }}>
                You haven't recorded any sessions for this category yet.
              </p>
            )}
            {sessions.map(session => {
              // --- "BULLETPROOF" DATA ACCESS ---
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
    </div>
  );
};

export default CategoryDetailPage;
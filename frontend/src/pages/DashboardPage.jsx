import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import PracticeModal from '../components/PracticeModal';

const DashboardPage = () => {
  const [sessions, setSessions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userSessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(userSessions);
    }, (error) => {
      console.error("Error listening to Firestore:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAnalysisComplete = async (newSessionData) => {
    if (!user) return;
    const sessionToSave = {
      ...newSessionData,
      userId: user.uid,
      createdAt: new Date(),
    };
    try {
      await addDoc(collection(db, 'sessions'), sessionToSave);
      console.log("New session successfully saved to Firestore.");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <div className="content-wrapper">
          <Dashboard
            sessions={sessions}
            onStartPractice={() => setIsModalOpen(true)}
          />
        </div>
      </main>
      {isModalOpen && (
        <PracticeModal
          onClose={() => setIsModalOpen(false)}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
    </div>
  );
};
export default DashboardPage;
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

  // This effect fetches ALL sessions for the user to calculate stats correctly
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
    });
    return () => unsubscribe();
  }, [user]);

  // --- THIS IS THE CORRECTED FUNCTION ---
  // Its only job is to save the new session to the database.
  // It no longer touches the local 'sessions' state directly.
  const handleAnalysisComplete = async (newSessionData) => {
    if (!user) return;

    const sessionToSave = {
      ...newSessionData,
      userId: user.uid,
      createdAt: new Date(),
    };

    try {
      // The onSnapshot listener will automatically detect this change and update the UI.
      await addDoc(collection(db, 'sessions'), sessionToSave);
      console.log("New session successfully saved to Firestore.");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
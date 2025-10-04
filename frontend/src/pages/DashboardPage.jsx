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

  // This effect listens for any changes in the Firestore database
  // and updates our component's state, making it the "Single Source of Truth".
  useEffect(() => {
    if (!user) return; // Don't run if the user is not logged in

    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // onSnapshot creates a real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userSessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(userSessions);
    }, (error) => {
      console.error("Error listening to Firestore:", error);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [user]);

  // This function's only job is to save the new session to the database.
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

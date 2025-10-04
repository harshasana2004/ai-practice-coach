import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import StatCard from './StatCard';

const Dashboard = ({ sessions, onStartPractice }) => {
  const stats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { total: 0, avgDuration: '0:00', avgWpm: 0, avgConfidence: '0%' };
    }
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalWpm = sessions.reduce((acc, s) => acc + (s.wpm || 0), 0);
    const totalConfidence = sessions.reduce((acc, s) => acc + (s.confidenceScore || 0), 0);

    const avgDurationSec = Math.round(totalDuration / totalSessions);
    const minutes = Math.floor(avgDurationSec / 60);
    const seconds = avgDurationSec % 60;

    return {
      total: totalSessions,
      avgDuration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      avgWpm: Math.round(totalWpm / totalSessions),
      avgConfidence: `${Math.round(totalConfidence / totalSessions)}%`,
    };
  }, [sessions]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="title">Practice Dashboard</h1>
        <p className="subtitle">Track your progress and improve your speaking skills</p>
      </div>
      <div className="stats-grid">
        <StatCard title="Total Sessions" value={stats.total} icon={<MicIcon />} />
        <StatCard title="Avg Duration" value={stats.avgDuration} icon={<ClockIcon />} />
        <StatCard title="Words/Min" value={stats.avgWpm} icon={<ZapIcon />} />
        <StatCard title="Avg Confidence" value={stats.avgConfidence} icon={<TrendingUpIcon />} />
      </div>
      <div className="action-grid">
        <div className="card">
          <h2>Start Practicing</h2>
          <p className="subtitle">Record a new practice session to improve your skills</p>
          <button onClick={onStartPractice} className="practice-button">
            <MicIcon />
            <span>New Practice Session</span>
          </button>
        </div>
        <div className="card">
          <h2>Recent Sessions</h2>
          <p className="subtitle">Your latest practice attempts</p>
          <div className="history-list">
            {!sessions || sessions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem 0' }}>
                No practice sessions yet. Start your first one!
              </p>
            ) : (
              sessions.slice(0, 3).map((session) => (
                <Link to={`/session/${session.id}`} key={session.id}>
                  <div>
                    <p style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      "{session.transcript}"
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {session.wpm || 0} WPM - {(session.duration || 0).toFixed(1)}s
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MicIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const ClockIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ZapIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const TrendingUpIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;

export default Dashboard;


// import React, { useMemo } from 'react';
// import { Link } from 'react-router-dom';
// import StatCard from './StatCard';
//
// const Dashboard = ({ sessions, onStartPractice }) => {
//   // Calculate statistics from the full sessions data provided by DashboardPage
//   const stats = useMemo(() => {
//     const totalSessions = sessions.length;
//     if (totalSessions === 0) {
//       return { total: 0, avgDuration: '0:00', avgWpm: 0, avgConfidence: '0%' };
//     }
//     const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0);
//     const totalWpm = sessions.reduce((acc, s) => acc + s.wpm, 0);
//     const totalConfidence = sessions.reduce((acc, s) => acc + s.confidenceScore, 0);
//
//     const avgDurationSec = Math.round(totalDuration / totalSessions);
//     const minutes = Math.floor(avgDurationSec / 60);
//     const seconds = avgDurationSec % 60;
//
//     return {
//       total: totalSessions,
//       avgDuration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
//       avgWpm: Math.round(totalWpm / totalSessions),
//       avgConfidence: `${Math.round(totalConfidence / totalSessions)}%`,
//     };
//   }, [sessions]);
//
//   return (
//     <div className="p-8 space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900">Practice Dashboard</h1>
//         <p className="text-gray-500 mt-1">Track your progress and improve your speaking skills</p>
//       </div>
//
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard title="Total Sessions" value={stats.total} icon={<MicIcon />} />
//         <StatCard title="Avg Duration" value={stats.avgDuration} icon={<ClockIcon />} />
//         <StatCard title="Words/Min" value={stats.avgWpm} icon={<ZapIcon />} />
//         <StatCard title="Avg Confidence" value={stats.avgConfidence} icon={<TrendingUpIcon />} />
//       </div>
//
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         <div className="bg-white p-6 rounded-xl border border-gray-200">
//           <h2 className="text-lg font-semibold text-gray-800">Start Practicing</h2>
//           <p className="text-gray-500 mt-1">Record a new practice session to improve your skills</p>
//           <button
//             onClick={onStartPractice}
//             className="mt-4 w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center space-x-2"
//           >
//             <MicIcon />
//             <span>New Practice Session</span>
//           </button>
//         </div>
//
//         <div className="bg-white p-6 rounded-xl border border-gray-200">
//           <h2 className="text-lg font-semibold text-gray-800">Recent Sessions</h2>
//           <p className="text-gray-500 mt-1">Your latest practice attempts</p>
//           <div className="mt-4 space-y-3">
//             {sessions.length === 0 ? (
//               <p className="text-center text-gray-500 py-4">No practice sessions yet. Start your first one!</p>
//             ) : (
//               // Display the first 3 sessions from the full list
//               sessions.slice(0, 3).map((session) => (
//                 <Link to={`/session/${session.id}`} key={session.id} className="block border-b border-gray-100 pb-2 hover:bg-gray-50 p-2 rounded">
//                   <p className="font-medium text-gray-700 truncate">"{session.transcript}"</p>
//                   <p className="text-sm text-gray-500">{session.wpm} WPM - {session.duration.toFixed(1)}s</p>
//                 </Link>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
//
// // SVG Icons
// const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
// const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
// const ZapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
// const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
//
// export default Dashboard;
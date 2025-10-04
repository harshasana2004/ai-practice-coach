import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';

const ReportCard = ({ title, children, color = 'blue' }) => {
    const colors = { blue: '#1d4ed8', purple: '#7e22ce', gray: '#374151', green: '#15803d', orange: '#c2410c' };
    const titleStyle = { fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem', color: colors[color] };
    return (
        <div className="card report-card">
            <h3 style={titleStyle}>{title}</h3>
            <div style={{ color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{children}</div>
        </div>
    );
};

const SessionReportPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'sessions', sessionId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSession({ ...docSnap.data(), id: docSnap.id });
        }
      } catch (error) { console.error("Error fetching session:", error); }
      finally { setLoading(false); }
    };
    fetchSession();
  }, [sessionId]);

  if (loading) { return ( <div className="app-container"><Header /><p style={{ paddingTop: '5rem', textAlign: 'center' }}>Loading report...</p></div> ); }
  if (!session) { return ( <div className="app-container"><Header /><p style={{ paddingTop: '5rem', textAlign: 'center' }}>Session not found.</p><div style={{ textAlign: 'center', marginTop: '1rem' }}><Link to="/history" style={{ color: '#4f46e5', textDecoration: 'underline' }}>← Back to History</Link></div></div> ); }

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <div className="content-wrapper" style={{ maxWidth: '56rem' }}>
            <div className="page-container">
                <div className="page-header">
                    <Link to="/history" style={{ color: '#4f46e5', textDecoration: 'underline', fontSize: '0.875rem' }}>← Back to History</Link>
                    <h1 className="title" style={{ marginTop: '0.5rem' }}>Session Report</h1>
                    <p className="subtitle">{session.createdAt.toDate().toLocaleString()}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {session.audioURL && (<ReportCard title="Your Recording" color="purple"><audio controls src={session.audioURL} style={{ width: '100%' }}></audio></ReportCard>)}
                    <ReportCard title="Full Transcript" color="gray"><p style={{ fontStyle: 'italic' }}>"{session.transcript}"</p></ReportCard>
                    <div className="report-grid-3">
                        <ReportCard title="Speaking Pace"><p style={{ fontSize: '1.875rem', fontWeight: '700' }}>{session.wpm} <span style={{ fontSize: '1rem', fontWeight: '400' }}>WPM</span></p></ReportCard>
                        <ReportCard title="Confidence"><p style={{ fontSize: '1.875rem', fontWeight: '700' }}>{session.confidenceScore}<span style={{ fontSize: '1rem', fontWeight: '400' }}>%</span></p></ReportCard>
                        <ReportCard title="Vocal Variety"><p style={{ fontSize: '1.875rem', fontWeight: '700' }}>{session.pitchModulation.toFixed(1)}</p></ReportCard>
                    </div>
                    <ReportCard title="Feedback Summary" color="blue"><p>{session.feedback}</p></ReportCard>
                    <div className="report-grid-2">
                        <ReportCard title="Areas for Improvement" color="green">
                            <ul>{session.improvements.map((item, index) => (<li key={index}>{item.point ? <strong>{item.point}:</strong> : null} {item.explanation || item}</li>))}</ul>
                        </ReportCard>
                        <ReportCard title="Potential Mistakes" color="orange">
                            <ul>{session.mistakes.filter(m => m.point || m).map((item, index) => (<li key={index}>{item.point ? <strong>{item.point}:</strong> : null} {item.explanation || item}</li>))}</ul>
                        </ReportCard>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};
export default SessionReportPage;
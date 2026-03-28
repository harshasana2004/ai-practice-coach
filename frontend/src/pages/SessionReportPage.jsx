import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import RadialProgress from '../components/RadialProgress'; // Import RadialProgress

// ---------- Reusable ReportCard Component ----------
const ReportCard = ({ title, children, color = 'gray' }) => {
  const colors = { blue: '#2563eb', purple: '#9333ea', gray: '#4b5563', green: '#16a34a', orange: '#ea580c' };
  const titleStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: colors[color] || colors['gray'],
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `2px solid ${colors[color] || colors['gray']}`,
    paddingBottom: '0.5rem',
    display: 'inline-block'
  };
  return (
    <div className="report-section">
      <h3 style={titleStyle}>{title}</h3>
      <div style={{ color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '1rem' }}>
        {children}
      </div>
    </div>
  );
};

// ---------- Main Component ----------
const SessionReportPage = () => {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!sessionId) throw new Error("Session ID is missing from the URL.");

        console.log("🔎 Fetching session:", sessionId);
        const docRef = doc(db, 'sessions', sessionId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          console.log("✅ Session fetched successfully:", data);
          setSessionData(data);
        } else {
          console.warn("⚠️ No session found with ID:", sessionId);
          setError("Session not found in the database.");
        }
      } catch (err) {
        console.error("❌ Error fetching session:", err);
        setError(`Failed to load session data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading) {
    return <div className="page-container" style={{ paddingTop: '5rem', textAlign: 'center' }}>Loading report...</div>;
  }

  if (error || !sessionData) {
    return (
      <div className="page-container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--error-color)' }}>{error || "Session data could not be loaded."}</p>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/history" className="auth-link">← Back to History</Link>
        </div>
      </div>
    );
  }

  // ---------- Safe Data Extraction ----------
  const analysis = sessionData.analysis || {};
  const safeAnalysis = {
    overallFeedback: analysis.overallFeedback || sessionData.feedback || "No feedback available.",
    confidenceScore: analysis.confidenceScore || sessionData.confidenceScore || 0,
    grammaticalErrors: analysis.grammaticalErrors || [],
    clarityConciseness: analysis.clarityConciseness || [],
    pacingAnalysis: analysis.pacingAnalysis || {
      assessment: `${sessionData.wpm || 'N/A'} WPM`,
      recommendation: "Maintain a natural and steady pace.",
    },
    vocalVarietyAnalysis: analysis.vocalVarietyAnalysis || {
      assessment: `Score: ${(sessionData.pitchModulation || 0).toFixed(1)}`,
      recommendation: "Try more pitch variation for emphasis.",
    },
    fillerWordAnalysis: analysis.fillerWordAnalysis || [],
    pauseAnalysis: analysis.pauseAnalysis || [],
    keyImprovements:
      analysis.keyImprovements ||
      (sessionData.improvements
        ? sessionData.improvements.map((imp) => ({ area: "General", action: imp }))
        : []),
  };

  const formattedDate =
    sessionData.createdAt?.toDate
      ? sessionData.createdAt.toDate().toLocaleString()
      : typeof sessionData.createdAt === 'string'
      ? sessionData.createdAt
      : 'Date unavailable';

  // ---------- UI ----------
  return (
    <div className="page-container" style={{ maxWidth: '64rem', margin: 'auto' }}>
      <div className="page-header" style={{ textAlign: 'left' }}>
        <Link to="/history" className="auth-link" style={{ fontSize: '0.875rem' }}>← Back to History</Link>
        <h1 className="title" style={{ marginTop: '0.5rem' }}>Session Report</h1>
        <p className="subtitle">{formattedDate}</p>
      </div>

      <div className="report-page-container">
        {/* Recording */}
        {sessionData.audioURL && (
          <ReportCard title="Recording" color="purple">
            <audio controls src={sessionData.audioURL} style={{ width: '100%' }}></audio>
          </ReportCard>
        )}

        {/* Transcript */}
        <ReportCard title="Transcript" color="gray">
          <p style={{ fontStyle: 'italic', lineHeight: 1.7 }}>
            "{sessionData.transcript || 'No transcript available.'}"
          </p>
        </ReportCard>

        {/* Metrics */}
        <div className="report-metrics-grid">
          <div className="stat-item">
            <span className="stat-item-label">Speaking Pace (WPM)</span>
            <span className="stat-item-value">{sessionData.wpm || 0}</span>
            <p className="subtitle" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {safeAnalysis.pacingAnalysis?.assessment}
            </p>
          </div>
          <div className="stat-item">
            <span className="stat-item-label">Confidence Score</span>
            <RadialProgress value={safeAnalysis.confidenceScore} maxValue={100} unit="%" />
          </div>
          <div className="stat-item">
            <span className="stat-item-label">Vocal Variety Score</span>
            <span className="stat-item-value">{(sessionData.pitchModulation || 0).toFixed(1)}</span>
            <p className="subtitle" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {safeAnalysis.vocalVarietyAnalysis?.assessment}
            </p>
          </div>
        </div>

        {/* Feedback */}
        <ReportCard title="Overall Feedback" color="blue">
          <p>{safeAnalysis.overallFeedback}</p>
        </ReportCard>

        {/* Detailed Analysis */}
        <ReportCard title="Detailed Analysis" color="orange">
          {safeAnalysis.fillerWordAnalysis?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Filler Words Detected:</strong>
              <ul>
                {safeAnalysis.fillerWordAnalysis.map((item, i) => (
                  <li key={i}>
                    <strong>{item.word}:</strong> {item.count} time(s)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {safeAnalysis.pauseAnalysis?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Pauses & Hesitations:</strong>
              <ul>
                {safeAnalysis.pauseAnalysis.map((item, i) => (
                  <li key={i}>
                    <strong>{item.type}:</strong> "{item.context}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          {safeAnalysis.clarityConciseness?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Clarity Issues:</strong>
              <ul>
                {safeAnalysis.clarityConciseness.map((item, i) => (
                  <li key={i}>
                    <strong>{item.issue}:</strong> "{item.example}"<br />
                    <em>Suggestion: {item.suggestion}</em>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {safeAnalysis.grammaticalErrors?.length > 0 && (
            <div>
              <strong>Grammatical Mistakes:</strong>
              <ul>
                {safeAnalysis.grammaticalErrors.map((item, i) => (
                  <li key={i}>
                    <strong>{item.error}:</strong> "{item.example}"<br />
                    <em>Correction: {item.correction}</em>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {safeAnalysis.fillerWordAnalysis?.length === 0 &&
            safeAnalysis.pauseAnalysis?.length === 0 &&
            safeAnalysis.clarityConciseness?.length === 0 &&
            safeAnalysis.grammaticalErrors?.length === 0 && (
              <p>No significant mistakes or issues detected. Great job!</p>
            )}
        </ReportCard>

        {/* Key Improvements */}
        {safeAnalysis.keyImprovements?.length > 0 && (
          <ReportCard title="Key Improvements" color="green">
            <ul>
              {safeAnalysis.keyImprovements.map((item, i) => (
                <li key={i}>
                  <strong>{item.area}:</strong> {item.action}
                </li>
              ))}
            </ul>
          </ReportCard>
        )}
      </div>
    </div>
  );
};

export default SessionReportPage;

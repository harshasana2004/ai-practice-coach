import React, { useState, useMemo } from 'react';
import RadialProgress from './RadialProgress';

const PeriodicReport = ({ sessions }) => {
  const [timeRange, setTimeRange] = useState('weekly'); // 'weekly' or 'monthly'

  // This logic filters sessions and calculates stats based on the selected time range
  const reportData = useMemo(() => {
    const now = new Date();
    const startDate = new Date();

    if (timeRange === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(now.getDate() - 30); // ~1 month
    }

    // Filter sessions that are within the selected time range
    const filteredSessions = sessions.filter(session =>
      session.createdAt.toDate() > startDate
    );

    const totalSessions = filteredSessions.length;
    if (totalSessions === 0) {
      return { total: 0, avgWpm: 0, avgConfidence: 0, summary: `No sessions recorded in the last ${timeRange === 'weekly' ? '7' : '30'} days.` };
    }

    const totalWpm = filteredSessions.reduce((acc, s) => acc + (s.wpm || 0), 0);
    const totalConfidence = filteredSessions.reduce((acc, s) => acc + (s.analysis?.confidenceScore || s.confidenceScore || 0), 0);

    const avgWpm = Math.round(totalWpm / totalSessions);
    const avgConfidence = Math.round(totalConfidence / totalSessions);

    let summary = `This ${timeRange.replace('ly', '')}, you completed ${totalSessions} session(s) with an average confidence of ${avgConfidence}%.`;
    if(avgConfidence > 75) {
        summary += " Fantastic work, you're showing great confidence!";
    } else if (avgConfidence > 50) {
        summary += " Good job, keep practicing to build even more consistency.";
    } else {
        summary += " Keep at it! Focus on clarity and pace to help boost your confidence.";
    }

    return {
      total: totalSessions,
      avgWpm: avgWpm,
      avgConfidence: avgConfidence,
      summary: summary
    };
  }, [sessions, timeRange]);

  return (
    <div className="card periodic-report-card">
      <div className="periodic-report-header">
        <h2>Your {timeRange === 'weekly' ? 'Weekly' : 'Monthly'} Report</h2>
        <div className="time-range-toggle">
          <button
            className={`toggle-button ${timeRange === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeRange('weekly')}
          >
            Weekly
          </button>
          <button
            className={`toggle-button ${timeRange === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeRange('monthly')}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="report-stats-grid">
        <div className="stat-item" style={{backgroundColor: 'var(--bg-light)', boxShadow: 'none'}}>
          <span className="stat-item-label">Sessions This {timeRange.replace('ly', '')}</span>
          <span className="stat-item-value" style={{color: 'var(--primary-color)'}}>{reportData.total}</span>
        </div>
        <div className="stat-item">
          <RadialProgress label="Avg WPM" value={reportData.avgWpm} maxValue={250} unit=" WPM" />
        </div>
        <div className="stat-item">
          <RadialProgress label="Avg Confidence" value={reportData.avgConfidence} maxValue={100} unit="%" />
        </div>
      </div>

      <p className="report-summary">{reportData.summary}</p>
    </div>
  );
};

export default PeriodicReport;
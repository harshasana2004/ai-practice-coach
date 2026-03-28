import React, { useState, useMemo, forwardRef } from 'react';
import RadialProgress from './RadialProgress';
import DatePicker from 'react-datepicker';

const CustomDateInput = forwardRef(({ label, value, onClick }, ref) => (
  <button className="date-range-button" onClick={onClick} ref={ref}>
    <span className="label">{label}</span>
    <span className="date-text">
      {new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </span>
  </button>
));

const CustomDateReport = ({ sessions }) => {

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState(new Date());

  const reportData = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredSessions = sessions.filter(session => {
      if (session.createdAt && typeof session.createdAt.toDate === 'function') {
        const sessionDate = session.createdAt.toDate();
        return sessionDate >= start && sessionDate <= end;
      }
      return false;
    });

    const totalSessions = filteredSessions.length;
    if (totalSessions === 0) {
      return { total: 0, avgWpm: 0, avgConfidence: 0, summary: "No sessions recorded in this date range." };
    }

    const totalWpm = filteredSessions.reduce((acc, s) => acc + (s.wpm || 0), 0);
    const totalConfidence = filteredSessions.reduce((acc, s) => acc + (s.analysis?.confidenceScore || s.confidenceScore || 0), 0);
    const avgWpm = Math.round(totalWpm / totalSessions);
    const avgConfidence = Math.round(totalConfidence / totalSessions);
    let summary = `In this period, you completed ${totalSessions} session(s) with an average confidence of ${avgConfidence}%.`;

    return { total: totalSessions, avgWpm, avgConfidence, summary };
  }, [sessions, startDate, endDate]);

  return (
    <div className="card custom-report-card">
      <div className="custom-report-header">
        <h2>Custom Date Report</h2>
        <div className="date-picker-container">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            maxDate={endDate}
            dateFormat="MM/dd/yyyy"
            customInput={<CustomDateInput label="From:" value={startDate} />}
            popperPlacement="top-end"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            minDate={startDate}
            maxDate={new Date()}
            dateFormat="MM/dd/yyyy"
            customInput={<CustomDateInput label="To:" value={endDate} />}
            popperPlacement="top-end"
          />
        </div>
      </div>

      <div className="report-stats-grid" style={{ marginTop: '1.5rem' }}>
        <div className="stat-item" style={{backgroundColor: 'var(--bg-light)', boxShadow: 'none'}}>
          <span className="stat-item-label">Sessions Found</span>
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

export default CustomDateReport;
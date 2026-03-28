import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const ProgressChart = ({ sessions }) => {
  const chartData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    const validSessions = sessions.filter(s => s.createdAt && typeof s.createdAt.toDate === 'function');

    const sortedSessions = [...validSessions].sort((a, b) =>
      a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime()
    );

    return sortedSessions.map(session => ({
      timestamp: session.createdAt.toDate().getTime(),
      Confidence: session.analysis?.confidenceScore || session.confidenceScore || 0,
      WPM: session.wpm || 0,
    }));
  }, [sessions]);

  if (sessions.length < 2) {
    return (
      <div className="card chart-container-empty" style={{marginTop: '2.5rem'}}>
        <h2>Your Progress</h2>
        <p className="subtitle" style={{textAlign: 'center', marginTop: '1rem'}}>
          Complete at least two sessions to see your progress over time.
        </p>
      </div>
    );
  }

  const customTooltipFormatter = (value, name) => [Math.round(value), name];
  const customTooltipLabelFormatter = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  return (
    <div className="card chart-container" style={{marginTop: '2.5rem'}}>
      <h2>Your Progress Over Time</h2>
      <div className="chart-grid">
        <div className="chart-wrapper">
          <h3 className="chart-title">Confidence (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="timestamp" type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatDate}
                fontSize="0.75rem"
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={customTooltipFormatter}
                labelFormatter={customTooltipLabelFormatter}
              />
              <Legend />
              <Line type="monotone" dataKey="Confidence" stroke="var(--success-color)" strokeWidth={2} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-wrapper">
          <h3 className="chart-title">Speaking Pace (WPM)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="timestamp" type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatDate}
                fontSize="0.75rem"
              />
              <YAxis domain={[0, 'dataMax + 20']} />
              <Tooltip
                formatter={customTooltipFormatter}
                labelFormatter={customTooltipLabelFormatter}
              />
              <Legend />
              <Line type="monotone" dataKey="WPM" stroke="var(--primary-color)" strokeWidth={2} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './FacialAnalysisReport.css';

const FacialAnalysisReport = ({ facialMetrics = {} }) => {
  if (!facialMetrics || Object.keys(facialMetrics).length === 0) {
    return null;
  }

  const {
    average_engagement_score = 0,
    average_confidence_score = 0,
    emotion_breakdown = {},
    dominant_emotion = 'neutral',
    consistency_score = 0,
    total_frames_analyzed = 0
  } = facialMetrics;

  // Prepare emotion breakdown data for pie chart
  const emotionData = Object.entries(emotion_breakdown).map(([emotion, percentage]) => ({
    name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    value: percentage
  }));

  const EMOTION_COLORS = {
    Happy: '#fbbf24',
    Sad: '#60a5fa',
    Angry: '#ef4444',
    Neutral: '#9ca3af',
    Surprised: '#ec4899',
    Disgusted: '#10b981',
    Fearful: '#8b5cf6'
  };

  const scoreData = [
    { name: 'Engagement', score: average_engagement_score },
    { name: 'Confidence', score: average_confidence_score },
    { name: 'Consistency', score: consistency_score }
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getScoreInterpretation = (metric, score) => {
    if (metric === 'Engagement') {
      if (score >= 80) return 'Highly engaged';
      if (score >= 60) return 'Moderately engaged';
      if (score >= 40) return 'Somewhat engaged';
      return 'Low engagement';
    }
    if (metric === 'Confidence') {
      if (score >= 80) return 'Very confident';
      if (score >= 60) return 'Reasonably confident';
      if (score >= 40) return 'Moderately confident';
      return 'Low confidence';
    }
    if (metric === 'Consistency') {
      if (score >= 80) return 'Very consistent';
      if (score >= 60) return 'Reasonably consistent';
      if (score >= 40) return 'Somewhat inconsistent';
      return 'Highly variable';
    }
    return '';
  };

  return (
    <div className="facial-analysis-report">
      <h2 className="report-title">Facial Expression Analysis</h2>

      <div className="report-grid">
        {/* Overall Scores Section */}
        <div className="section score-section">
          <h3>Performance Metrics</h3>
          <div className="scores-container">
            {scoreData.map((item) => (
              <div key={item.name} className="score-card">
                <div className="score-label">{item.name}</div>
                <div className="score-circle" style={{ borderColor: getScoreColor(item.score) }}>
                  <span className="score-value">{Math.round(item.score)}</span>
                </div>
                <div className="score-interpretation">
                  {getScoreInterpretation(item.name, item.score)}
                </div>
              </div>
            ))}
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={scoreData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => `${Math.round(value)}%`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar
                  dataKey="score"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emotion Breakdown Section */}
        <div className="section emotion-section">
          <h3>Emotion Breakdown</h3>
          <div className="dominant-emotion-badge">
            <span className="dominant-label">Dominant Emotion</span>
            <span className="dominant-value">
              {dominant_emotion.charAt(0).toUpperCase() + dominant_emotion.slice(1)}
            </span>
          </div>

          {emotionData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={emotionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${Math.round(value)}%`}
                  >
                    {emotionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={EMOTION_COLORS[entry.name] || '#999'}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Math.round(value)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="no-data-message">No emotion data available</p>
          )}

          <div className="emotion-list">
            {emotionData.map((emotion) => (
              <div key={emotion.name} className="emotion-item">
                <div className="emotion-color" style={{ backgroundColor: EMOTION_COLORS[emotion.name] }}></div>
                <span className="emotion-name">{emotion.name}</span>
                <span className="emotion-percentage">{Math.round(emotion.value)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Insights Section */}
        <div className="section insights-section">
          <h3>Key Insights</h3>
          <ul className="insights-list">
            {average_engagement_score >= 70 && (
              <li className="insight positive">
                <span className="icon">✓</span>
                Great engagement throughout the session
              </li>
            )}
            {average_confidence_score >= 70 && (
              <li className="insight positive">
                <span className="icon">✓</span>
                Strong confidence displayed in facial expressions
              </li>
            )}
            {consistency_score >= 70 && (
              <li className="insight positive">
                <span className="icon">✓</span>
                Maintained consistent emotional expression
              </li>
            )}
            {average_engagement_score < 50 && (
              <li className="insight warning">
                <span className="icon">!</span>
                Try to maintain more eye contact with the camera
              </li>
            )}
            {average_confidence_score < 50 && (
              <li className="insight warning">
                <span className="icon">!</span>
                Work on expressing more confidence through facial expressions
              </li>
            )}
            {consistency_score < 50 && (
              <li className="insight warning">
                <span className="icon">!</span>
                Try to keep your expressions more consistent
              </li>
            )}
            <li className="insight info">
              <span className="icon">📊</span>
              Analyzed {total_frames_analyzed} frames during the session
            </li>
          </ul>
        </div>

        {/* Recommendations Section */}
        <div className="section recommendations-section">
          <h3>Recommendations</h3>
          <ul className="recommendations-list">
            {average_engagement_score < 70 && (
              <li>
                <strong>Improve Engagement:</strong> Make more eye contact with the camera, smile more, and animate your facial expressions to show you're engaged with the topic.
              </li>
            )}
            {average_confidence_score < 70 && (
              <li>
                <strong>Build Confidence:</strong> Practice maintaining an open expression, smile occasionally, and avoid frowning or tensing your face during difficult moments.
              </li>
            )}
            {consistency_score < 70 && (
              <li>
                <strong>Maintain Consistency:</strong> Try to keep your emotional expression steady throughout. Avoid sudden mood shifts that might confuse your audience.
              </li>
            )}
            <li>
              <strong>Facial Expression Tips:</strong> Match your facial expressions to your content. Show enthusiasm for exciting points, concern for serious ones, and understanding when asking questions.
            </li>
            <li>
              <strong>Practice Regularly:</strong> Record yourself regularly to track improvements in engagement, confidence, and consistency over time.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FacialAnalysisReport;


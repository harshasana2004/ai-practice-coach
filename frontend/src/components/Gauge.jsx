import React from 'react';

const Gauge = ({ label, value, max = 200, unit = '' }) => {
  const displayValue = Math.max(0, Math.min(value, max));
  const percentage = max > 0 ? (displayValue / max) * 100 : 0;

  // Calculate rotation for the conic gradient based on percentage
  const rotationDegrees = percentage * 1.8; // 100% = 180 degrees

  const progressStyle = {
    background: `conic-gradient(var(--color-primary-500) ${rotationDegrees}deg, rgba(255, 255, 255, 0.1) ${rotationDegrees}deg)`
  };

  return (
    <div className="gauge-container">
      <div className="gauge">
        <div className="gauge-base"></div>
        <div className="gauge-progress" style={progressStyle}></div>
        <div className="gauge-cover"></div>
        <div className="gauge-value-text">{Math.round(value)}{unit}</div>
      </div>
      <div className="gauge-label">{label}</div>
    </div>
  );
};

export default Gauge;
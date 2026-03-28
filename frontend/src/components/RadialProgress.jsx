import React from 'react';

const RadialProgress = ({ label = '', value = 0, maxValue = 100, unit = '%' }) => {
  const numericValue = Number(value) || 0;
  const clampedValue = Math.max(0, Math.min(numericValue, maxValue));
  const percentage = maxValue > 0 ? (clampedValue / maxValue) : 0;
  const degrees = percentage * 360;

  // Determine color logic based on label and value
  let color = 'var(--primary-color)';
  if (label.toLowerCase().includes('confidence')) {
    if (percentage * 100 < 50) color = 'var(--error-color)';
    else if (percentage * 100 < 75) color = 'var(--warning-color)';
    else color = 'var(--success-color)';
  } else if (label.toLowerCase().includes('wpm')) {
    if (numericValue < 120) color = 'var(--warning-color)';
    else if (numericValue > 170) color = 'var(--warning-color)';
    else color = 'var(--success-color)';
  }

  // SVG circle parameters
  const size = 90;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percentage);

  return (
    <div className="radial-progress-container" style={{ textAlign: 'center' }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', marginBottom: '0.5rem' }}
      >
        {/* Background ring */}
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress ring */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
        />
        {/* Text inside circle */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.35em"
          fontSize="1.1rem"
          fontWeight="600"
          fill="#111827"
          transform="rotate(90, 45, 45)"
        >
          {Math.round(numericValue)}
          {unit && <tspan fontSize="0.7rem">{unit}</tspan>}
        </text>
      </svg>

      {/* Label below circle */}
      {label && (
        <div
          className="radial-progress-label"
          style={{
            fontSize: '0.9rem',
            fontWeight: '500',
            color: '#4B5563',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

export default RadialProgress;

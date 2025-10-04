import React from 'react';

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="card stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className="stat-card-icon">{icon}</div>
      </div>
      <p className="stat-card-value">{value}</p>
    </div>
  );
};
export default StatCard;
import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass = '' }) => {
  return (
    <div className={'stat-card ' + colorClass}>
      <div className="stat-icon-wrapper">
        {typeof Icon === 'string' ? (
          <span style={{ fontSize: '24px' }}>{Icon}</span>
        ) : Icon ? (
          <Icon size={24} />
        ) : null}
      </div>
      <div className="stat-info">
        <span className="stat-title">{title}</span>
        <h3 className="stat-value">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;

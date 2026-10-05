import React from 'react';

const StatusBadge = ({ status }) => {
  const statusLower = status ? status.toLowerCase() : 'pending';

  let badgeClass = 'badge-pending';

  if (statusLower === 'approved') badgeClass = 'badge-approved';
  else if (statusLower === 'successful' || statusLower === 'adopted') badgeClass = 'badge-successful';
  else if (statusLower === 'rejected' || statusLower === 'cancelled') badgeClass = 'badge-rejected';
  else if (statusLower === 'available') badgeClass = 'badge-available';

  return (
    <span className={`badge ${badgeClass}`}>
      {status || 'Pending'}
    </span>
  );
};

export default StatusBadge;

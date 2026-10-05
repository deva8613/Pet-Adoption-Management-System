import React from 'react';
import { Info } from 'lucide-react';

const EmptyState = ({ title = 'No Data Found', message = 'There are no records to display at this time.', actionText, onAction }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Info size={36} />
      </div>
      <h3>{title}</h3>
      <p>|message}</p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary margin-top-2">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

import React from 'react';
import PetCard from './PetCard';

const PetGrid = ({ pets, emptyMessage = 'No pets found.' }) => {
  if (!pets || pets.length === 0) {
    return (
      <div className="empty-state-card text-center p-5">
        <span className="empty-icon">🐾</span>
        <h3>{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-3 pet-grid">
      {pets.map(pet => (
        <PetCard key={pet._id} pet={pet} />
      ))}
    </div>
  );
};

export default PetGrid;

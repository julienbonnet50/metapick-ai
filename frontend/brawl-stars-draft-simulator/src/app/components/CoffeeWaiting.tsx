// src/components/TierListCard.tsx

import React from "react";

const CoffeeWaiting: React.FC = () => {
  return (
    <div className="card bg-base-200">
      <div className="card-body items-center text-center p-6">
        <div className="text-4xl mb-2">☕</div>
        <h2 className="card-title text-lg">Select a map to view tier list</h2>
        <p className="text-sm">The tier list will show brawlers ranked by their performance</p>
      </div>
    </div>
  );
};

export default CoffeeWaiting;

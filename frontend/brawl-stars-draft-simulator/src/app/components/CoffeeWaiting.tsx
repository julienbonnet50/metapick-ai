// src/components/TierListCard.tsx

import React from "react";

interface CoffeeWaitingProps {
  name: string;
  description: string;
}

const CoffeeWaiting: React.FC<CoffeeWaitingProps> = ({name, description}) => {
  return (
    <div className="card bg-base-200">
      <div className="card-body items-center text-center p-6">
        <div className="text-4xl mb-2">☕</div>
        <h2 className="card-title text-lg">Select a map to view {name}</h2>
        <p className="text-sm">{description}</p>
      </div>
    </div>
  );
};

export default CoffeeWaiting;

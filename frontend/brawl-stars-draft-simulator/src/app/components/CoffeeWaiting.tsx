import React from "react";

const CoffeeWaiting: React.FC<CoffeeWaitingProps> = ({name, description}) => {
  return (
    <div className="card bg-base-200">
      <div className="card-body items-center text-center p-6">
        <div className="text-5xl mb-2">☕</div>
        <h2 className="card-title text-2xl font-bold mb-2 title-font">Select a map to view {name}</h2>
        <p className="text-sm">{description}</p>
      </div>
    </div>
  );
};

export default CoffeeWaiting;
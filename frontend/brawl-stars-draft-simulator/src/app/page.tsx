"use client"
import React, { useState } from "react";
import BrawlStarsDraft from "@components/BrawlStarsDraft";
import HowToUse from "@components/HowToUse";
import Navbar from "@components/Navbar";

const App: React.FC = () => {
  const [showHowToUse, setShowHowToUse] = useState<boolean>(false);

  const toggleHowToUse = (): void => {
    setShowHowToUse(!showHowToUse);
  };

  return (
    <div className="flex flex-col">
      {/* Navbar Component */}
      <Navbar toggleHowToUse={toggleHowToUse} showHowToUse={showHowToUse} />
      
      {/* Conditionally render HowToUse Component */}
      {showHowToUse && <HowToUse />}

      {/* Main Content */}

      <BrawlStarsDraft />

    </div>
  );
};

export default App;
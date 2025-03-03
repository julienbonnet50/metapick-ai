"use client"
import React, { useState, useEffect } from "react";
import BrawlStarsDraft from "@components/BrawlStarsDraft";
import HowToUse from "@components/HowToUse";
import Navbar from "@components/Navbar";
import { Analytics } from "@vercel/analytics/react"

const App: React.FC = () => {
  const [showHowToUse, setShowHowToUse] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("Connecting to server...");
  
  // Define your BASE_URL
  const BASE_URL = process.env.NEXT_PUBLIC_ENDPOINT_BASE_URL || "https://metapick-ai.onrender.com";
  console.log("BASE_URL", BASE_URL);


  const toggleHowToUse = (): void => {
    setShowHowToUse(!showHowToUse);
  };

  useEffect(() => {
    const checkEndpoints = async () => {
      try {
        setStatusMessage("Connecting to server... This may take up to 2 minutes if the server was idle.");
        
        // Try to fetch from all endpoints
        const brawlersPromise = fetch(`${BASE_URL}/get_brawlers`, { cache: "no-store" });
        const mapsPromise = fetch(`${BASE_URL}/get_maps`, { cache: "no-store" });
        const gameVersionsPromise = fetch(`${BASE_URL}/get_game_versions`, { cache: "no-store" });
        
        const [brawlersResponse, mapsResponse, gameVersionsResponse] = await Promise.all([
          brawlersPromise, 
          mapsPromise,
          gameVersionsPromise
        ]);
        
        // Only proceed if all endpoints return 200 OK
        if (brawlersResponse.status === 200 && mapsResponse.status === 200 && gameVersionsResponse.status === 200) {
          setIsLoading(false);
        } else {
          let message = "Waiting for backend services to be ready...";
          
          if (brawlersResponse.status !== 200) {
            message += ` Brawlers endpoint: ${brawlersResponse.status}.`;
          }
          
          if (mapsResponse.status !== 200) {
            message += ` Maps endpoint: ${mapsResponse.status}.`;
          }
          
          if (gameVersionsResponse.status !== 200) {
            message += ` Game versions endpoint: ${gameVersionsResponse.status}.`;
          }
          
          setStatusMessage(message);
          if (retryCount < 24) { // Limit to ~2 minutes of retries (24 * 5s = 120s)
            scheduleRetry();
          } else {
            setStatusMessage("Unable to connect to server after multiple attempts. Please refresh the page or try again later.");
          }
        }
      } catch (error: any) {
        console.error("Error checking endpoints:", error);
        
        if (retryCount < 24) { // Limit retries
          // Set an appropriate message based on the error
          if (error.message.includes("Failed to fetch") || 
              error.message.includes("NetworkError") ||
              error.message.includes("ERR_ADDRESS_INVALID")) {
            setStatusMessage("Backend server not accessible. Retrying connection...");
          } else {
            setStatusMessage(`Connection issue: ${error.message}. Retrying...`);
          }
          
          scheduleRetry();
        } else {
          setStatusMessage("Connection failed after multiple attempts. The server may be down or under maintenance.");
        }
      }
    };
    
    const scheduleRetry = () => {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 20000); // Retry every 5 seconds
    };
    
    checkEndpoints();
  }, [BASE_URL, retryCount]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-xl">Loading Brawl Stars Draft</p>
        <p className="mt-2 text-sm text-gray-600">{statusMessage}</p>
        <p className="mt-2 text-xs text-gray-500">
          Retry attempt: {retryCount}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Navbar Component */}
      <Navbar toggleHowToUse={toggleHowToUse} showHowToUse={showHowToUse} />
      
      {/* Conditionally render HowToUse Component */}
      {showHowToUse && <HowToUse />}
      
      {/* Main Content */}
      <BrawlStarsDraft />
      <Analytics />
    </div>
  );
};

export default App;
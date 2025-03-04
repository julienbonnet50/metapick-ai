import React, { useEffect, useState } from "react";
import Image from 'next/image';
import { fetchGameVersions } from "../utils/api";

interface NavbarProps {
  toggleHowToUse: () => void;
  showHowToUse: boolean;
}

interface GameVersion {
  version: string;
  count: number
  date: string;
  name: string;
  description: string;
  ranked_maps: string[];
}

const BASE_URL = process.env.NEXT_PUBLIC_ENDPOINT_BASE_URL || "https://metapick-ai.onrender.com";

const Navbar: React.FC<NavbarProps> = ({ toggleHowToUse, showHowToUse }) => {
  const [latestVersion, setLatestVersion] = useState<GameVersion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadGameVersion = async () => {
      try {
        setIsLoading(true);
        const gameVersionData = await fetchGameVersions(BASE_URL);
        setLatestVersion(gameVersionData);
        
      } catch (error: unknown) {
        console.error('Error fetching game versions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGameVersion();
  }, []);
  
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <nav className="bg-yellow-950 text-amber-50 p-4 shadow-md" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        {/* Left side - Logo and Title */}
        <div className="flex items-center">
          <Image
            width={40}
            height={40}
            src="/web-app-manifest-192x192.png"  
            alt="Logo"
            className="h-10 mr-4" 
          />
          <h1 className="text-xl font-bold">Brawl Stars Draft Tool</h1>
        </div>
        
        {/* Middle - Version Info */}
        <div className="flex items-center justify-center px-4">
          {isLoading ? (
            <div className="text-sm">Loading version info...</div>
          ) : latestVersion ? (
            <div className="text-sm bg-gradient-to-r from-rose-950 to-yellow-800 rounded-full px-4 py-2 shadow-md flex items-center justify-center space-x-2 border border-gray-700 text-gray-200">
            <span className="font-semibold text-white">Version {latestVersion.version}</span>
            <span className="h-1 w-1 bg-gray-500 rounded-full"></span>
            <span><span className="text-violet-400">Mythic+</span>{" ranked games analyzed: " + latestVersion.count.toLocaleString()}</span>
            <span className="h-1 w-1 bg-gray-500 rounded-full"></span>
            <span>{"Updated from " + formatDate(latestVersion.date)}</span>
          </div>
          ) : (
            <div className="text-sm">Version info unavailable</div>
          )}
        </div>
        
        {/* Right side - How to Use button */}
        <button
          onClick={toggleHowToUse}
          className="px-4 py-2 bg-amber-800 rounded hover:bg-amber-700 transition-colors"
        >
          {showHowToUse ? "Hide Guide" : "How to Use"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
"use client"
import React, { useEffect, useState } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Navigation links
  const navLinks = [
    { name: 'Draft tool', path: '/' },
    { name: 'Stats', path: '/stats' },
    { name: 'Tier List', path: '/tier-list' },
    { name: 'About', path: '/about' },
  ];

  return (
    <nav className="bg-yellow-950 text-amber-50 p-4 shadow-md" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        {/* Left side - Logo and Title */}
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center">
              <Image
                width={40}
                height={40}
                src="/web-app-manifest-192x192.png"  
                alt="Logo"
                className="h-10 mr-4" 
              />
              <h1 className="text-xl font-bold">Metapick-AI</h1>
            </div>
          </Link>
        </div>
        
        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex space-x-6 mx-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`hover:text-amber-300 transition-colors ${
                pathname === link.path ? 'text-amber-300 font-bold' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
        
        {/* Middle - Version Info */}
        <div className="hidden md:flex items-center justify-center px-4">
          {isLoading ? (
            <div className="text-sm">Loading version info...</div>
          ) : latestVersion ? (
            <div className="text-sm bg-gradient-to-r from-rose-950 to-yellow-800 rounded-full px-4 py-2 shadow-md flex items-center justify-center space-x-2 border border-gray-700 text-gray-200">
              <span className="font-semibold text-white justify-center">Version {latestVersion.version}</span>
              <span className="h-1 w-1 bg-gray-500 rounded-full justify-center"></span>
              <span><span className="text-violet-400 justify-center">Mythic+</span>{" ranked games analyzed: " + latestVersion.count.toLocaleString()}</span>
              <span className="h-1 w-1 bg-gray-500 rounded-full justify-center"></span>
              <span>{"Updated from " + formatDate(latestVersion.date)}</span>
            </div>
          ) : (
            <div className="text-sm">Version info unavailable</div>
          )}
        </div>
        
        {/* Right side - How to Use button and Mobile Menu Toggle */}
        <div className="flex items-center space-x-4">
          {pathname === '/' && (
            <button
              onClick={toggleHowToUse}
              className="px-4 py-2 bg-amber-800 rounded hover:bg-amber-700 transition-colors"
            >
              {showHowToUse ? "Hide Guide" : "How to Use"}
            </button>
          )}
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden bg-amber-800 p-2 rounded hover:bg-amber-700 transition-colors"
            onClick={toggleMenu}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pt-2 border-t border-amber-800">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`hover:text-amber-300 transition-colors py-2 ${
                  pathname === link.path ? 'text-amber-300 font-bold' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Mobile Version Info */}
            {!isLoading && latestVersion && (
              <div className="text-xs bg-gradient-to-r from-rose-950 to-yellow-800 rounded-full px-3 py-1 shadow-md mt-2">
                <span className="font-semibold text-white">v{latestVersion.version}</span>{" "}
                <span className="text-violet-400">Mythic+</span>{" games: " + latestVersion.count.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
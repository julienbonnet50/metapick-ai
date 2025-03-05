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

interface User {
  name: string;
  email: string;
  picture: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_ENDPOINT_BASE_URL || "https://metapick-ai.onrender.com";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const Navbar: React.FC<NavbarProps> = ({ toggleHowToUse, showHowToUse }) => {
  const [latestVersion, setLatestVersion] = useState<GameVersion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

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
    
    // Load Google's auth SDK
    const loadGoogleAuth = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleAuth;
      document.body.appendChild(script);
    };

    loadGoogleAuth();
  }, []);

  useEffect(() => {
    // Check if the user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
    setIsAuthLoading(false);
  }, []);

  const initializeGoogleAuth = () => {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      console.error('Google SDK or Client ID not available');
      setIsAuthLoading(false);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
      auto_select: false,
    });

    window.google.accounts.id.renderButton(
      document.getElementById('googleSignInButton')!,
      { 
        theme: 'outline', 
        size: 'medium',
        text: 'signin_with',
        shape: 'rectangular',
        width: 180
      }
    );
  };

  const handleGoogleCallback = async (response: any) => {
    try {
      // Decode the JWT token to get user info
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const decodedToken = JSON.parse(jsonPayload);
      
      // You can send the token to your backend for verification
      const verificationResponse = await fetch(`${BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: response.credential }),
        credentials: 'include'
      });

      if (!verificationResponse.ok) {
        throw new Error('Failed to verify token with backend');
      }

      const userData = {
        name: decodedToken.name,
        email: decodedToken.email,
        picture: decodedToken.picture
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      // Call backend to clear session/cookies
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      // Clear local storage and state
      localStorage.removeItem('user');
      setUser(null);
      setShowDropdown(false);

      // Sign out from Google
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

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
        
        {/* Right side - Auth and How to Use */}
        <div className="flex items-center space-x-4">
          {isAuthLoading ? (
            <div className="animate-pulse h-10 w-32 bg-amber-800 rounded opacity-50"></div>
          ) : user ? (
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 bg-amber-900 rounded-full overflow-hidden pr-3 hover:bg-amber-800 transition-colors"
              >
                <Image 
                  src={user.picture} 
                  alt={user.name}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <span className="text-sm font-medium truncate max-w-xs">{user.name}</span>
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-yellow-900 rounded-md shadow-lg z-10 border border-yellow-800">
                  <div className="p-3 border-b border-yellow-800">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-300 truncate">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-yellow-800 rounded transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div id="googleSignInButton"></div>
          )}

          <button
            onClick={toggleHowToUse}
            className="px-4 py-2 bg-amber-800 rounded hover:bg-amber-700 transition-colors"
          >
            {showHowToUse ? "Hide Guide" : "How to Use"}
          </button>
        </div>
      </div>
    </nav>
  );
};

// Add TypeScript declaration for Google SDK
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export default Navbar;
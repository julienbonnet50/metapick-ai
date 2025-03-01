import React from "react";
import Image from 'next/image';

interface NavbarProps {
  toggleHowToUse: () => void;
  showHowToUse: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleHowToUse, showHowToUse }) => {
  return (
    <nav className="bg-yellow-950 text-amber-50 p-4 shadow-md" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Image
          src="/web-app-manifest-192x192.png"  
          alt="Logo"
          className="h-10 mr-4" 
        />
        
        <h1 className="text-xl font-bold">Brawl Stars Draft Tool</h1>
        
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

"use client"
import React, { useState } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import metapickIcon from "../../../public/web-app-manifest-192x192.png";

// import imgBlocMap3 from '../../public/img/image_bloc3.png';
interface NavbarProps {
  toggleHowToUse: () => void;
  showHowToUse: boolean;
}


const Navbar: React.FC<NavbarProps> = ({ toggleHowToUse, showHowToUse }) => {
  {/* Data */}
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();
  
  // Format date to be more readable

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Navigation links
  const navLinks = [
    { name: 'Draft tool', path: '/draft-tool' },
    { name: 'Stats', path: '/stats' },
    { name: 'Tier List', path: '/tier-list' },
    { name: 'Upgrade Helper', path: '/upgrade-helper' },
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
                src={metapickIcon}
                alt="Logo"
                >
              </Image>
              <h1 className="text-xl font-bold title-font">Metapick-AI</h1>
            </div>
          </Link>
        </div>
        
        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex space-x-6 mx-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`hover:text-amber-300 transition-colors title-font${
                pathname === link.path ? 'text-amber-300 font-bold' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
        
        {/* Right side - Mobile Menu Toggle */}
        <div className="flex items-center space-x-4">
          
          {/* Buy Me a Coffee Button */}
          <a 
            href="https://www.buymeacoffee.com/metapickai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary bg-yellow-600 hover:bg-yellow-700 border-none text-white"
          >
            Buy Me a Coffee ☕
          </a>

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
            
          </div>
        </div>
      )}
    </nav>   
  );
};

export default Navbar;
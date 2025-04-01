// ClientLayout.tsx
"use client";
import { useState } from "react";
import Navbar from "@components/Navbar";
import HowToUseDraft from "@components/HowToUseDraft";
import BottomNavbar from "@components/BottomNavbar"; // Import BottomNavbar
import Seo from "@components/Seo";
import metapickIcon from '../../../public/web-app-manifest-192x192.png'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showHowToUse, setShowHowToUse] = useState(false);
  
  const toggleHowToUse = () => setShowHowToUse(!showHowToUse);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Seo 
        title="Metapick-AI" 
        description="Your complete toolkit for mastering Brawl Stars - stats, tier lists, draft tools, and more to dominate every match." 
        url="https://metapick-ai.vercel.app/" 
        image={metapickIcon.src}
      />
      <Navbar toggleHowToUse={toggleHowToUse} showHowToUse={showHowToUse} />
      {showHowToUse && <HowToUseDraft />}
      <main className="flex-grow">{children}</main>
      
      {/* Bottom Navbar Component */}
      <BottomNavbar />
      
      <footer className="bg-base-200 py-3 text-center border-t border-base-300">
        <div className="container mx-auto px-4">
          <p className="text-sm text-base-content/70">
            This site is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it.
          </p>
          <p className="text-xs text-base-content/50 mt-1">
            All game content and materials are trademarks and copyrights of Supercell.
          </p>
        </div>
      </footer>
    </div>
  );
}

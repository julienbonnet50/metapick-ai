"use client";
import { useState } from "react";
import Navbar from "@components/Navbar";
import HowToUseDraft from "@components/HowToUseDraft";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showHowToUse, setShowHowToUse] = useState(false);

  const toggleHowToUse = () => setShowHowToUse(!showHowToUse);

  return (
    <>
      <Navbar toggleHowToUse={toggleHowToUse} showHowToUse={showHowToUse} />
      {showHowToUse && <HowToUseDraft />}
      {children}
    </>
  );
}
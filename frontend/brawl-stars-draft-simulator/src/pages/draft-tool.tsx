"use client"
import React from "react";
import BrawlStarsDraft from "@components/BrawlStarsDraft";
import ImageProvider from "@components/ImageProvider";

const DraftTool: React.FC = () => {
  return (
    <div>
        <main className="flex flex-col">
          <ImageProvider>
            <BrawlStarsDraft />
          </ImageProvider>
        </main>
    </div>
  );
};

export default DraftTool;
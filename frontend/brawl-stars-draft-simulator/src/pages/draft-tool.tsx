"use client"
import React, { useState, useEffect } from "react";
import BrawlStarsDraft from "@components/BrawlStarsDraft";
import { useDataContext } from '@components/DataProviderContext';

const DraftTool: React.FC = () => {
  const { isLoading } = useDataContext();
  const [retryCount, setRetryCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("Connecting to server...");

  // if (isLoading) {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
  //       <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
  //       <p className="mt-4 text-xl">Loading Brawl Stars Draft</p>
  //       <p className="mt-2 text-sm text-gray-600">{statusMessage}</p>
  //       <p className="mt-2 text-xs text-gray-500">Retry attempt: {retryCount}</p>
  //     </div>
  //   );
  // }

  return (
    <div>
        <main className="flex flex-col">
            <BrawlStarsDraft />
        </main>
    </div>
  );
};

export default DraftTool;
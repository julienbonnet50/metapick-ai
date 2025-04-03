"use client";
import { fetchBrawlers, fetchGameVersions, fetchMaps } from 'app/utils/api';
import React, { createContext, useState, useEffect, ReactNode } from 'react';

const DataProviderContext = createContext<DataProviderContextType | undefined>(undefined);

interface DataProviderContextProps {
  children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderContextProps) => {
  const [brawlers, setBrawlers] = useState<Brawler[]>([]);
  const [latestVersion, setLatestVersion] = useState<GameVersion | null>(null);
  const [maps, setMaps] = useState<MapBs[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  const STORAGE_KEY = 'brawlstars-account-tag';
  const TUTORIAL_SHOWN_KEY = 'brawlstars-tutorial-shown';
  const TUTORIAL_LAST_SHOWN_KEY = 'brawlstars-tutorial-last-shown-date';
  const BASE_URL = process.env.NEXT_PUBLIC_ENDPOINT_BASE_URL || "https://metapick-ai.onrender.com";

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch Data
        const [brawlersData, mapsData, gameVersionData] = await Promise.all([
          fetchBrawlers(BASE_URL),
          fetchMaps(BASE_URL),
          fetchGameVersions(BASE_URL),
        ]);

        setLatestVersion(gameVersionData);

        // Process Brawlers
        const excludedBrawlerName = '';
        const filteredBrawlers = brawlersData
          .filter((brawler: Brawler) => brawler.name !== excludedBrawlerName)
          .map((brawler: Brawler) =>
            brawler.name === "LARRY & LAWRIE" ? { ...brawler, name: "Larry" } : brawler
          );

        const sortedBrawlers = filteredBrawlers.sort((a: { name: string; }, b: { name: any; }) => a.name.localeCompare(b.name));

        // Process Maps
        const sortedMaps = mapsData.sort((a: { gameMode: string; name: string; }, b: { gameMode: any; name: any; }) => {
          const gameModeComparison = a.gameMode.localeCompare(b.gameMode);
          return gameModeComparison === 0 ? a.name.localeCompare(b.name) : gameModeComparison;
        });

        // Set State
        setBrawlers(sortedBrawlers);
        setMaps(sortedMaps);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [BASE_URL]);

  return (
    <DataProviderContext.Provider
      value={{
        brawlers,
        maps,
        baseUrl: BASE_URL,
        isLoading,
        latestVersion,
        storageKey: STORAGE_KEY,
        torialShownKey: TUTORIAL_SHOWN_KEY,
        tutorialLastShownKey: TUTORIAL_LAST_SHOWN_KEY,
      }}
    >
      {children}
    </DataProviderContext.Provider>
  );
};

export const useDataContext = () => {
  const context = React.useContext(DataProviderContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

export { DataProviderContext };

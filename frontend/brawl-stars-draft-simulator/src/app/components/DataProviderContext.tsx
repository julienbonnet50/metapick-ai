"use client"
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
      const brawlersData = await fetchBrawlers(BASE_URL);
      const mapsData = await fetchMaps(BASE_URL);
      const gameVersionData = await fetchGameVersions(BASE_URL);

      setLatestVersion(gameVersionData);

      // Sort brawlers and maps
      const excludedBrawlerName = '';
      const filteredBrawlers = brawlersData
        .filter((brawler: Brawler) => brawler.name !== excludedBrawlerName)
        .map((brawler: Brawler) => {
          if (brawler.name === "LARRY & LAWRIE") {
            return { ...brawler, name: "Larry" };
          }
          return brawler;
        });

      const sortedBrawlers = filteredBrawlers.sort((a: Brawler, b: Brawler) => a.name.localeCompare(b.name));
      const sortedMaps = mapsData.sort((a: MapBs, b: MapBs) => {
        const gameModeComparison = a.gameMode.localeCompare(b.gameMode);
        if (gameModeComparison === 0) {
          return a.name.localeCompare(b.name);
        }
        return gameModeComparison;
      });

      setBrawlers(sortedBrawlers);
      setMaps(sortedMaps);
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <DataProviderContext.Provider value={{ 
        brawlers, maps, 
        baseUrl: BASE_URL, 
        isLoading, latestVersion, 
        storageKey: STORAGE_KEY,
        torialShownKey: TUTORIAL_SHOWN_KEY,
        tutorialLastShownKey: TUTORIAL_LAST_SHOWN_KEY
        }}>
      {children}
    </DataProviderContext.Provider>
  );
};

export const useDataContext = () => {
  const context = React.useContext(DataProviderContext);
  if (!context) {
    throw new Error('useBrawlerMapContext must be used within a BrawlerMapProvider');
  }
  return context;
};

export { DataProviderContext };
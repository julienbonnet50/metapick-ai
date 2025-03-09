"use client";
import ClientLayout from "@components/ClientLayout";
import React, { useState, useEffect, useMemo } from "react";
import { fetchBrawlers, fetchMaps } from "../app/utils/api";
import SelectMap from "@components/SelectMap";
import Image from 'next/image';
import CoffeeWaiting from "@components/CoffeeWaiting";


const TierListPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tierData, setTierData] = useState<any[]>([]); 
  const [brawlers, setBrawlers] = useState<Brawler[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>("");
  const [mapsData, setMaps] = useState<MapBs[]>([]);

  const BASE_URL = process.env.NEXT_PUBLIC_ENDPOINT_BASE_URL || "https://metapick-ai.onrender.com";

  const handleMapChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMapValue = e.target.value;
    setSelectedMap(selectedMapValue);

    if (selectedMapValue) {
      try {
        const response = await fetch(`${BASE_URL}/tier_list`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ map: selectedMapValue }),
        });

        const data = await response.json();
        setTierData(data); 
      } catch (error) {
        console.error("Error fetching tier data:", error);
        setTierData([]); 
      }
    }
  };

  // Using useMemo to prevent recalculation on every render
  const tieredBrawlers = useMemo(() => {
    // Default empty tier structure
    const tiers = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
    const emptyTiers: Record<string, [string, number][]> = {};
    
    tiers.forEach(tier => {
      emptyTiers[tier] = [];
    });

    if (!tierData || tierData.length === 0) {
      return emptyTiers;
    }
    
    // Sort brawlers by score in descending order
    const sortedBrawlers = [...tierData].sort((a, b) => b[1] - a[1]);
    
    // Calculate mean and standard deviation
    const scores = sortedBrawlers.map(item => item[1]);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Define tier boundaries using standard deviations
    const tierBoundaries = [
      mean + 1.5 * stdDev,  // S tier: >1.5σ above mean
      mean + 0.8 * stdDev,  // A tier: 0.8σ to 1.5σ above mean
      mean + 0.3 * stdDev,  // B tier: 0.3σ to 0.8σ above mean
      mean - 0.3 * stdDev,  // C tier: -0.3σ to 0.3σ from mean (average)
      mean - 0.8 * stdDev,  // D tier: -0.8σ to -0.3σ below mean
      mean - 1.5 * stdDev,  // E tier: -1.5σ to -0.8σ below mean
      -Infinity            // F tier: <-1.5σ below mean
    ];
    
    // Create the tiered data structure
    const tieredData: Record<string, [string, number][]> = {};
    
    tiers.forEach(tier => {
      tieredData[tier] = [];
    });
    
    // Distribute brawlers into tiers based on standard deviation boundaries
    sortedBrawlers.forEach(brawler => {
      const [name, score] = brawler;
      for (let i = 0; i < tierBoundaries.length; i++) {
        if (score >= tierBoundaries[i]) {
          tieredData[tiers[i]].push([name, score]);
          break;
        }
      }
    });
    
    return tieredData;
  }, [tierData]);

  useEffect(() => {
    const loadData = async () => {
      const brawlersData = await fetchBrawlers(BASE_URL);
      const mapsData = await fetchMaps(BASE_URL);

      // Filter out excluded brawlers and sort remaining ones
      const excludedBrawlerName = 'Lumi';
      const filteredBrawlers = brawlersData.filter((brawler: Brawler) => brawler.name !== excludedBrawlerName);
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
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Traditional tier list color scheme
  const getTierColors = (tier: string) => {
    const colorMap: Record<string, { bg: string, text: string }> = {
      'S': { bg: 'bg-red-500', text: 'text-white' },
      'A': { bg: 'bg-orange-500', text: 'text-white' },
      'B': { bg: 'bg-yellow-500', text: 'text-black' },
      'C': { bg: 'bg-green-500', text: 'text-white' },
      'D': { bg: 'bg-blue-500', text: 'text-white' },
      'E': { bg: 'bg-indigo-500', text: 'text-white' },
      'F': { bg: 'bg-gray-500', text: 'text-white' }
    };
    return colorMap[tier];
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-300 text-base-content">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4 text-xl font-medium">Brewing your tier list...</p>
      </div>
    );
  }

  return (
    <ClientLayout>
      <main className="container mx-auto p-4">
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body p-4">
            <h1 className="card-title text-xl font-bold text-primary">Brawl Stars Tier List</h1>
            
            <SelectMap
              mapsData={mapsData}
              selectedMap={selectedMap}
              handleMapChange={handleMapChange}
            />
          </div>
        </div>

        {selectedMap && tierData.length > 0 ? (
          <div className="space-y-2">
            {Object.keys(tieredBrawlers).map((tier) => (
              tieredBrawlers[tier].length > 0 && (
                <div key={tier} className="flex flex-col shadow-md rounded-md overflow-hidden">
                  <div className={`${getTierColors(tier).bg} ${getTierColors(tier).text} py-2 px-4 flex items-center`}>
                    <div className="font-bold text-lg mr-2">{tier}</div>
                    <div className="text-sm">TIER</div>
                  </div>
                    <div className="bg-base-100 p-2"> 
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                        {tieredBrawlers[tier].map(([brawlerName, score], index) => {
                          const brawler = brawlers.find(b => b.name.toUpperCase() === brawlerName); // Find the brawler object from the brawlers array
                          if (!brawler) return null; // If brawler not found, skip this iteration

                          return (
                            <div key={index} className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="card-body p-1 gap-y-1 text-xs">
                                {/* Display the brawler's image */}
                                
                                <Image
                                  width={150}
                                  height={150}
                                  src={brawler.imageUrl} // Image URL for the brawler
                                  alt={brawlerName}
                                  className="h-14 sm:h-10 md:h-10 lg:h-14 xl:h-18 object-contain mx-auto"
                                />
                                <h3 className="font-bold text-center truncate" title={brawlerName}>{brawlerName}</h3>
                                <div className="text-center opacity-70">{score.toFixed(2)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                </div>
              )
            ))}
          </div>
        ) : (
          !isLoading && (
            <CoffeeWaiting />
          )
        )}
      </main>
    </ClientLayout>
  );
};

export default TierListPage;
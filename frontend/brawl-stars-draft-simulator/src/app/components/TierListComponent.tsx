"use client";
import React, { useEffect, useState } from "react";
import { useImageCache } from "./ImageProvider";
import CachedImage from "./CachedImage";

const TierListComponent: React.FC<TierListProps> = ({ brawlers, tierData, selectedMap }) => {

  const { imagesReady, preloadImages } = useImageCache(); // Use the context hook
  const [imagesLoading, setImagesLoading] = useState<boolean>(true);

      // Load from cache on mount
  useEffect(() => {
    const loadInitialData = async () => {
        // Preload brawler images
        const brawlerImages = brawlers.map(brawler => brawler.imageUrl);
    
        // Combine all image sources
        const allImages = [...brawlerImages];
        
        setImagesLoading(true);
        await preloadImages(allImages);
        setImagesLoading(false);
    };
    
    loadInitialData();
    }, [brawlers, preloadImages]);
  
  // Traditional tier list color scheme
  const getTierColors = (tier: string) => {
    const colorMap: Record<string, { bg: string, text: string }> = {
      'S': { bg: 'bg-red-500', text: 'text-white title-font' },
      'A': { bg: 'bg-orange-500', text: 'text-white title-font' },
      'B': { bg: 'bg-yellow-500', text: 'text-white title-font' },
      'C': { bg: 'bg-green-500', text: 'text-white title-font' },
      'D': { bg: 'bg-blue-500', text: 'text-white title-font' },
      'E': { bg: 'bg-indigo-500', text: 'text-white title-font' },
      'F': { bg: 'bg-gray-500', text: 'text-white title-font' }
    };
    return colorMap[tier];
  };

  // Calculate tiered brawlers
  const tieredBrawlers = React.useMemo(() => {
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

  return (
    <div className="space-y-2">
      {Object.keys(tieredBrawlers).map((tier) => (
        tieredBrawlers[tier].length > 0 && (
          <div key={tier} className="flex flex-col shadow-md rounded-md overflow-hidden">
            <div className={`${getTierColors(tier).bg} ${getTierColors(tier).text} py-2 px-4 flex items-center`}>
              <div className="text-lg mr-2">{tier}</div>
              <div className="text-sm">TIER</div>
            </div>
            <div className="bg-base-100 p-2"> 
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {tieredBrawlers[tier].map(([brawlerName, score], index) => {
                  const brawler = brawlers.find(b => b.name.toUpperCase() === brawlerName);
                  if (!brawler) return null;

                  return (
                    <div key={index} className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="card-body p-1 gap-y-1 text-xs">
                        <CachedImage
                          key={`${brawlerName}-${tier}-${index}`}
                          width={150}
                          height={150}
                          src={brawler.imageUrl}
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
  );
};

export default TierListComponent;
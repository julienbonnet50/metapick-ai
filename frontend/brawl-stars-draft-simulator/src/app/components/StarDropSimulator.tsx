import React, { useState } from 'react';
import { generateUniqueId, getDropChances, getItemImage, getRarityColor } from '../utils/dropChance';

const StarDrop = () => {
  const [dropResults, setDropResults] = useState<DropResult[]>([]);
  const [aggregatedResults, setAggregatedResults] = useState<{ [key: string]: { [key: string]: number } }>({});
  const [isDropping, setIsDropping] = useState(false);
  const [numDrops, setNumDrops] = useState(10);
  const dropChances = getDropChances();

  // Rarity themes for visual styling based on Brawl Stars colors
  const rarityThemes: { [key: string]: RarityTheme } = getRarityColor();

  // Simulate one drop and return a promise with the result
  const simulateSingleDrop = (): Promise<DropResult> => {
    return new Promise((resolve) => {
      const randomRarity = Math.random();
      let selectedRarity = null;
      let cumulativeChance = 0;
  
      // Select the rarity based on the chances
      for (let i = 0; i < dropChances.length; i++) {
        cumulativeChance += dropChances[i].chance;
        if (randomRarity <= cumulativeChance) {
          selectedRarity = dropChances[i];
          break;
        }
      }
  
      if (!selectedRarity) {
        resolve({ rarity: 'Error', reward: 'Failed to select rarity', id: generateUniqueId() });
        return;
      }
  
      const randomReward = Math.random();
      let cumulativeRewardChance = 0;
      let selectedReward = null;
  
      // Ensure that the total reward probability adds up to 1. If not, normalize it
      const totalProbability = selectedRarity.rewards.reduce((sum, reward) => sum + reward.probability, 0);
      let normalizedRewards = selectedRarity.rewards;
  
      // Normalize the probabilities if needed
      if (totalProbability < 1) {
        const normalizationFactor = 1 / totalProbability;
        normalizedRewards = selectedRarity.rewards.map(reward => ({
          ...reward,
          probability: reward.probability * normalizationFactor
        }));
      }
  
      // Select a reward based on the probabilities
      for (let i = 0; i < normalizedRewards.length; i++) {
        cumulativeRewardChance += normalizedRewards[i].probability;
        if (randomReward <= cumulativeRewardChance) {
          selectedReward = normalizedRewards[i];
          break;
        }
      }
  
      if (!selectedReward) {
        resolve({ rarity: selectedRarity.rarity, reward: 'Error: No reward selected', id: generateUniqueId() });
        return;
      }
  
      const result = {
        rarity: selectedRarity.rarity,
        reward: selectedReward.item,
        id: generateUniqueId()
      };
  
      resolve(result);
    });
  };
  

  // Simulate multiple drops in sequence with visual effects
  const simulateMultipleDrops = async () => {
    setIsDropping(true);

    const newResults: DropResult[] = [];

    // Run drops sequentially if count is small, in batches otherwise
    if (numDrops <= 3) {
      // Sequential drops with animation for each
      for (let i = 0; i < numDrops; i++) {
        const result = await simulateSingleDrop();
        newResults.push(result);
        setDropResults(prev => [...prev, result]);
        updateAggregatedResults([result]);
      }
    } else {
      // Batch process for larger numbers
      const promises: Promise<DropResult>[] = [];
      for (let i = 0; i < numDrops; i++) {
        promises.push(simulateSingleDrop());
      }

      // Process in batches to avoid overwhelming the UI
      const batchSize = 10;
      for (let i = 0; i < promises.length; i += batchSize) {
        const batch = promises.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch);

        newResults.push(...batchResults);
        setDropResults(prev => [...prev, ...batchResults]);
        updateAggregatedResults(batchResults);
      }
    }

    setIsDropping(false);
  };

  // Update aggregated results based on new drops
  const updateAggregatedResults = (newResults: DropResult[]) => {
    const newAggregatedResults = { ...aggregatedResults };

    newResults.forEach((result) => {
      if (!newAggregatedResults[result.rarity]) {
        newAggregatedResults[result.rarity] = {};
      }
      newAggregatedResults[result.rarity][result.reward] =
        (newAggregatedResults[result.rarity][result.reward] || 0) + 1;
    });

    setAggregatedResults(newAggregatedResults);
  };

  const handleNumDropsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= 100) {
      setNumDrops(value);
    }
  };

  // Reset all drop results
  const handleReset = () => {
    setDropResults([]);
    setAggregatedResults({});
  };

  // Get image URL for a reward using the provided function
  const getRewardImageUrl = (reward: string) => {
    const imageName = getItemImage(reward);
    return `/assets/${imageName}`;
  };

  // Format rarity name for CSS class usage
  const formatRarityClass = (rarity: string) => {
    return rarity.replace(/\s+/g, '_');
  };

  // Calculate total drops by rarity
  const calculateTotalsByRarity = () => {
    const totals: {[key: string]: number} = {};

    Object.entries(aggregatedResults).forEach(([rarity, rewards]) => {
      const rarityTotal = Object.values(rewards).reduce((sum, count) => sum + count, 0);
      totals[rarity] = rarityTotal;
    });

    return totals;
  };

  const rarityTotals = calculateTotalsByRarity();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with glow effect */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-5xl font-bold mb-2 text-yellow-300 drop-shadow-lg"
              style={{textShadow: '0 0 10px rgba(255, 241, 44, 0.7)'}}>
            BRAWL STARS BOX SIMULATOR
          </h1>
          <p className="text-blue-200">Test your luck and see what drops you can get!</p>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-800 bg-opacity-70 rounded-xl p-6 mb-8 shadow-2xl border border-gray-700">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <label className="mb-2 text-yellow-200 font-bold">NUMBER OF BOXES</label>
              <input
                type="number"
                value={numDrops}
                onChange={handleNumDropsChange}
                className="w-24 h-12 text-center bg-gray-900 border-2 border-yellow-400 rounded-lg text-white text-xl"
                min="1"
                max="100"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={simulateMultipleDrops}
                disabled={isDropping}
                className="h-16 px-8 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 rounded-lg text-black font-bold text-xl shadow-lg transform hover:scale-105 transition duration-200 disabled:opacity-50"
              >
                {isDropping ? 'OPENING...' : 'OPEN BOXES!'}
              </button>

              <button
                onClick={handleReset}
                disabled={isDropping || dropResults.length === 0}
                className="h-16 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 rounded-lg text-white font-bold text-xl shadow-lg transform hover:scale-105 transition duration-200 disabled:opacity-50"
              >
                RESET
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {dropResults.length > 0 && (
          <div className="bg-gray-800 bg-opacity-70 rounded-xl p-6 shadow-2xl border border-gray-700 mb-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-blue-300 border-b border-gray-600 pb-2">
              Your Results <span className="text-yellow-300">({dropResults.length} total boxes)</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rarities Overview with Pie Chart */}
              <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-blue-200 border-b border-gray-700 pb-2">
                  Rarity Distribution
                </h3>

                <div className="flex flex-col space-y-4">
                  {Object.entries(rarityTotals).sort((a, b) => {
                    // Sort by rarity (custom order from highest to lowest)
                    const rarityOrder = ['Legendary', 'Mythic', 'Epic', 'Super Rare', 'Rare'];
                    return rarityOrder.indexOf(a[0]) - rarityOrder.indexOf(b[0]);
                  }).map(([rarity, count]) => {
                    const percentage = (count / dropResults.length) * 100;

                    return (
                      <div
                        key={rarity}
                        style={{
                          borderLeftColor: rarityThemes[rarity]?.color || '#555'
                        }}
                        className="border-l-4 pl-3 py-1"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span
                            style={{ color: rarityThemes[rarity]?.color }}
                            className="font-bold text-lg"
                          >
                            {rarity}
                          </span>
                          <span className="text-gray-300 text-sm">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>

                        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: rarityThemes[rarity]?.color || '#555'
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Simple Visual Representation */}
                <div className="mt-6 flex flex-wrap justify-center gap-1">
                  {dropResults.map((result, index) => (
                    <div
                      key={result.id || index}
                      style={{ backgroundColor: rarityThemes[result.rarity]?.color || '#555' }}
                      className="w-3 h-3 rounded-sm opacity-80"
                      title={`${result.rarity}: ${result.reward}`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Detailed Rewards by Rarity */}
              <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-blue-200 border-b border-gray-700 pb-2">
                    Detailed Rewards
                </h3>

                <div className="space-y-4">
                    {Object.entries(aggregatedResults).map(([rarity, rewards]) => (
                    <div key={rarity} className="mb-4">
                        <h4
                        style={{ color: rarityThemes[rarity]?.color }}
                        className="font-bold text-lg mb-2"
                        >
                        {rarity}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(rewards).sort((a, b) => b[1] - a[1]).map(([reward, count]) => (
                            <div
                            key={reward}
                            className="flex items-center bg-gray-800 rounded-lg p-2 shadow"
                            >
                            <div className="w-10 h-10 mr-2 flex-shrink-0">
                                <img
                                src={getRewardImageUrl(reward)}
                                alt={reward}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/assets/notfound.png";
                                }}
                                />
                            </div>
                            <div className="flex-grow">
                                <span className="text-gray-200 block text-sm">{reward}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-yellow-300 font-bold">×{count}</span>
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </div>
          </div>
        )}

        {/* Drop Chances Info Card */}
        <div className="bg-gray-800 bg-opacity-70 rounded-xl p-6 mb-8 shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-300">
                Drop Chances
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {dropChances.map((rarityData) => (
                <div
                    key={rarityData.rarity}
                    className="bg-gray-900 bg-opacity-80 rounded-lg p-3 shadow-md"
                    style={{
                    borderLeft: `4px solid ${rarityThemes[rarityData.rarity]?.color || '#fff'}`,
                    }}
                >
                    <div className="flex justify-between items-center mb-2">
                    <span
                        style={{ color: rarityThemes[rarityData.rarity]?.color }}
                        className="font-bold text-lg"
                    >
                        {rarityData.rarity}
                    </span>
                    <span className="text-yellow-300 font-mono">
                        {(rarityData.chance * 100).toFixed(1)}%
                    </span>
                    </div>

                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                        className="h-2.5 rounded-full"
                        style={{
                        width: `${rarityData.chance * 100}%`,
                        backgroundColor: rarityThemes[rarityData.rarity]?.color || '#fff',
                        }}
                    ></div>
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                    <span className="block text-sm font-semibold">Top rewards:</span>
                    <ul className="space-y-2 mt-2">
                        {rarityData.rewards.map((reward, i) => (
                        <li key={i} className="text-gray-300">
                            <div className="flex justify-between items-center">
                            <span>{reward.item}</span>
                            <span className="text-yellow-300 font-mono text-sm">
                                {`(${(reward.probability * 100).toFixed(1)}%)`}
                            </span>
                            </div>
                        </li>
                        ))}
                    </ul>
                    </div>
                </div>
                ))}
            </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-blue-200 text-sm">
          <p>Not affiliated with Supercell. This is a fan-made simulator for Brawl Stars.</p>
          <p>All item images and rarities are based on the game data.</p>
        </div>
      </div>
    </div>
  );
};

export default StarDrop;

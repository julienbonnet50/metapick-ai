import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Brawler {
  id: number;
  name: string;
  rarity: string;
  image: string;
  powerPoints: number;
  currentLevel: number;
  maxLevel: number;
  coins: number;
  gears: number;
}

interface UpgradeResource {
  powerPoints: number;
  coins: number;
  gears: number;
}

const UpgradeHelper: React.FC = () => {
  const [brawlers, setBrawlers] = useState<Brawler[]>([]);
  const [selectedBrawlers, setSelectedBrawlers] = useState<number[]>([]);
  const [resources, setResources] = useState<UpgradeResource>({
    powerPoints: 0,
    coins: 0,
    gears: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterRarity, setFilterRarity] = useState<string>('all');

  // Sample brawler data - in production, you'd fetch this from an API
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setBrawlers([
        { id: 1, name: "Shelly", rarity: "Starting", image: "/brawlers/shelly.png", powerPoints: 0, currentLevel: 9, maxLevel: 11, coins: 1250, gears: 2 },
        { id: 2, name: "Colt", rarity: "Rare", image: "/brawlers/colt.png", powerPoints: 220, currentLevel: 7, maxLevel: 11, coins: 1550, gears: 3 },
        { id: 3, name: "Brock", rarity: "Trophy Road", image: "/brawlers/brock.png", powerPoints: 340, currentLevel: 8, maxLevel: 11, coins: 1250, gears: 2 },
        { id: 4, name: "Jessie", rarity: "Trophy Road", image: "/brawlers/jessie.png", powerPoints: 0, currentLevel: 11, maxLevel: 11, coins: 0, gears: 0 },
        { id: 5, name: "Nita", rarity: "Trophy Road", image: "/brawlers/nita.png", powerPoints: 880, currentLevel: 9, maxLevel: 11, coins: 2000, gears: 2 },
        { id: 6, name: "Dynamike", rarity: "Trophy Road", image: "/brawlers/dynamike.png", powerPoints: 520, currentLevel: 7, maxLevel: 11, coins: 1750, gears: 3 },
        { id: 7, name: "Bo", rarity: "Trophy Road", image: "/brawlers/bo.png", powerPoints: 130, currentLevel: 6, maxLevel: 11, coins: 1000, gears: 3 },
        { id: 8, name: "Spike", rarity: "Legendary", image: "/brawlers/spike.png", powerPoints: 520, currentLevel: 7, maxLevel: 11, coins: 1750, gears: 3 },
        { id: 9, name: "Crow", rarity: "Legendary", image: "/brawlers/crow.png", powerPoints: 0, currentLevel: 11, maxLevel: 11, coins: 0, gears: 0 },
        { id: 10, name: "Leon", rarity: "Legendary", image: "/brawlers/leon.png", powerPoints: 150, currentLevel: 5, maxLevel: 11, coins: 800, gears: 3 },
      ]);
      setIsLoading(false);
    }, 800);
  }, []);

  // Calculate resources needed when selection changes
  useEffect(() => {
    if (selectedBrawlers.length === 0) {
      setResources({ powerPoints: 0, coins: 0, gears: 0 });
      return;
    }

    const totals = selectedBrawlers.reduce((acc, brawlerId) => {
      const brawler = brawlers.find(b => b.id === brawlerId);
      if (brawler) {
        return {
          powerPoints: acc.powerPoints + brawler.powerPoints,
          coins: acc.coins + brawler.coins,
          gears: acc.gears + brawler.gears
        };
      }
      return acc;
    }, { powerPoints: 0, coins: 0, gears: 0 });

    setResources(totals);
  }, [selectedBrawlers, brawlers]);

  const toggleBrawlerSelection = (brawlerId: number) => {
    if (selectedBrawlers.includes(brawlerId)) {
      setSelectedBrawlers(selectedBrawlers.filter(id => id !== brawlerId));
    } else {
      setSelectedBrawlers([...selectedBrawlers, brawlerId]);
    }
  };

  const selectAllBrawlers = () => {
    const allIds = brawlers.map(brawler => brawler.id);
    setSelectedBrawlers(allIds);
  };

  const clearSelection = () => {
    setSelectedBrawlers([]);
  };

  const rarityColors: { [key: string]: string } = {
    "Starting": "from-gray-600 to-gray-800",
    "Trophy Road": "from-blue-600 to-blue-800",
    "Rare": "from-green-600 to-green-800",
    "Super Rare": "from-cyan-600 to-cyan-800",
    "Epic": "from-purple-600 to-purple-800",
    "Mythic": "from-red-600 to-red-800",
    "Legendary": "from-yellow-500 to-amber-700",
    "Chromatic": "from-orange-500 to-orange-700"
  };

  // Filter and search brawlers
  const filteredBrawlers = brawlers.filter(brawler => {
    const matchesSearch = brawler.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = filterRarity === 'all' || brawler.rarity === filterRarity;
    return matchesSearch && matchesRarity;
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold text-amber-50 mb-6">Brawler Upgrade Helper</h1>
      
      <div className="bg-yellow-900 rounded-lg p-6 mb-6 shadow-lg">
        <h2 className="text-xl font-bold text-amber-50 mb-4">Resources Needed</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-800 to-blue-950 rounded-lg p-4 flex items-center">
            <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-blue-300">Power Points</p>
              <p className="text-xl font-bold text-white">{resources.powerPoints.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-700 to-yellow-900 rounded-lg p-4 flex items-center">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-yellow-300">Coins</p>
              <p className="text-xl font-bold text-white">{resources.coins.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-800 to-purple-950 rounded-lg p-4 flex items-center">
            <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-purple-300">Gears</p>
              <p className="text-xl font-bold text-white">{resources.gears}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-900 rounded-lg p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-3 sm:mb-0">
            <input
              type="text"
              placeholder="Search brawlers..."
              className="px-4 py-2 rounded bg-yellow-800 text-amber-50 border border-yellow-700 focus:outline-none focus:ring-2 focus:ring-amber-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              className="px-4 py-2 rounded bg-yellow-800 text-amber-50 border border-yellow-700 focus:outline-none focus:ring-2 focus:ring-amber-600"
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
            >
              <option value="all">All Rarities</option>
              <option value="Starting">Starting</option>
              <option value="Trophy Road">Trophy Road</option>
              <option value="Rare">Rare</option>
              <option value="Super Rare">Super Rare</option>
              <option value="Epic">Epic</option>
              <option value="Mythic">Mythic</option>
              <option value="Legendary">Legendary</option>
              <option value="Chromatic">Chromatic</option>
            </select>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={selectAllBrawlers}
              className="px-4 py-2 bg-amber-700 rounded hover:bg-amber-600 transition-colors text-amber-50"
            >
              Select All
            </button>
            <button 
              onClick={clearSelection}
              className="px-4 py-2 bg-rose-800 rounded hover:bg-rose-700 transition-colors text-amber-50"
            >
              Clear
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-12 h-12 border-t-4 border-amber-500 border-solid rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBrawlers.map(brawler => (
              <div 
                key={brawler.id}
                className={`relative bg-gradient-to-br ${rarityColors[brawler.rarity]} rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 ${
                  selectedBrawlers.includes(brawler.id) 
                    ? 'ring-4 ring-amber-500 scale-105' 
                    : 'hover:scale-102'
                }`}
                onClick={() => toggleBrawlerSelection(brawler.id)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white truncate">{brawler.name}</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-black bg-opacity-30 rounded-full text-white">
                      {brawler.rarity}
                    </span>
                  </div>
                  
                  <div className="flex justify-center mb-3">
                    <div className="h-24 w-24 relative flex items-center justify-center">
                      {/* Replace with actual image path or use placeholder */}
                      <div className="h-20 w-20 rounded-full bg-yellow-800 flex items-center justify-center text-lg font-bold text-white">
                        {brawler.name.substring(0, 2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-white">
                    <div className="flex justify-between">
                      <span>Level:</span>
                      <span>{brawler.currentLevel}/{brawler.maxLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Power Points:</span>
                      <span>{brawler.powerPoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coins:</span>
                      <span>{brawler.coins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gears:</span>
                      <span>{brawler.gears}</span>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-2 right-2">
                  {selectedBrawlers.includes(brawler.id) && (
                    <div className="rounded-full bg-amber-500 h-6 w-6 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filteredBrawlers.length === 0 && !isLoading && (
          <div className="text-center py-10 text-amber-50">
            <p className="text-xl">No brawlers found.</p>
            <p className="text-sm mt-2">Try changing your search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradeHelper;
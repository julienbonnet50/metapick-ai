"use client"
import { useDataContext } from '@components/DataProviderContext';
import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, HelpCircle } from 'lucide-react'; // Added HelpCircle icon
import { getUpgradeHelperTutorials } from '../app/utils/tutorials';

const UpgradeHelper = () => {
  const { baseUrl, storageKey, torialShownKey, tutorialLastShownKey, brawlers } = useDataContext();
  const [data, setData] = useState<PlayerAccountHelper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountTag, setAccountTag] = useState<string>('');
  const [isAccountTagValid, setAccountTagValid] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState('score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [availableBrawlers, setAvailableBrawlers] = useState<PlayerAccountHelper[]>([]);
  
  // Tutorial related states
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialHighlight, setTutorialHighlight] = useState<string | null>(null);

  // Clear input and remove from cache
  const clearInput = () => {
    setAccountTag("");
    setAccountTagValid(null);
    localStorage.removeItem(storageKey);
    setData([]);
  };

  // Handle input change and validate
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setAccountTag(newValue);
    validateInput(newValue);
    localStorage.setItem(storageKey, newValue);
  };

  // Validate input and set validation state
  const validateInput = (tag: string) => {
    const tagPattern = /^#?[A-Za-z0-9]{9}$/; // Allows optional '#' followed by exactly 9 alphanumeric characters
    setAccountTagValid(tagPattern.test(tag));
  };

  // Process form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAccountTagValid) {
      setError("Please enter a valid player tag");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Format the tag (ensure it has # at the beginning)
      const formattedTag = accountTag.startsWith('#') ? accountTag : `#${accountTag}`;
      
      const response = await fetch(`${baseUrl}/account-upgrade-helper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ player_tag: formattedTag }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const responseData = await response.json();
      setData(responseData);
      setAvailableBrawlers(responseData);
      
      // If user has completed search and we're on the relevant tutorial step, move to next step
      if (showTutorial && tutorialStep === 0) {
        setTutorialStep(1);
        setTutorialHighlight('recommended-upgrades');
      }
    } catch (error: unknown) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial validation and tutorial setup on component mount
  useEffect(() => {
    if (accountTag) {
      validateInput(accountTag);
    }
    
    // Check if we should show the tutorial
    if (typeof window !== 'undefined') {
      const tutorialShown = localStorage.getItem(torialShownKey);
      const lastShownDate = localStorage.getItem(tutorialLastShownKey);
      setAccountTag(localStorage.getItem(storageKey) || '');
      const today = new Date().toDateString();
      
      // Show tutorial if it has never been shown or if it's a new day
      if (!tutorialShown || (lastShownDate && lastShownDate !== today)) {
        setShowTutorial(true);
        setTutorialStep(0);
        setTutorialHighlight('account-input');
        // Update the last shown date to today
        localStorage.setItem(tutorialLastShownKey, today);
      }
    }
  }, []);

  // Close tutorial and mark as viewed
  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(torialShownKey, 'true');
  };

  // Handle tutorial navigation
  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      const nextStep = tutorialStep + 1;
      setTutorialStep(nextStep);
      setTutorialHighlight(tutorialSteps[nextStep].highlight);
    } else {
      closeTutorial();
    }
  };

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      const prevStep = tutorialStep - 1;
      setTutorialStep(prevStep);
      setTutorialHighlight(tutorialSteps[prevStep].highlight);
    }
  };

  // Tutorial content for each step
  const tutorialSteps = getUpgradeHelperTutorials();

  const handleSort = (field: keyof PlayerAccountHelper) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field.toString());
      setSortDirection('desc');
    }
    
    // If user sorts and we're on the relevant tutorial step, move to next step
    if (showTutorial && tutorialStep === 2) {
      nextTutorialStep();
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (a[sortField] === null) return 1;
    if (b[sortField] === null) return -1;
    
    // Type assertion to tell TypeScript these are numbers
    const aValue = a[sortField] as number;
    const bValue = b[sortField] as number;
    
    return sortDirection === 'asc' 
      ? aValue - bValue
      : bValue - aValue;
  });

  // Get top 5 brawlers
  const topBrawlers = sortedData
    .filter(brawler => brawler.score !== null)
    .slice(0, 5);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-500';
    if (score > 60) return 'bg-emerald-500';
    if (score > 40) return 'bg-green-500';
    if (score > 20) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Manual trigger for tutorial
  const showTutorialManually = () => {
    setShowTutorial(true);
    setTutorialStep(0);
    setTutorialHighlight('account-input');
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-center text-primary">Brawl Stars Upgrade Helper</h1>
          <button 
            onClick={showTutorialManually} 
            className="btn btn-circle btn-ghost"
            title="Show Tutorial"
          >
            <HelpCircle size={24} />
          </button>
        </div>
        
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Find your best upgrade options</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Account Tag Selection */}
              <div 
                className={`relative w-full md:w-96 ${tutorialHighlight === 'account-input' ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                id="account-input"
              >
                <input
                  type="text"
                  id="accountTag"
                  name="accountTag"
                  placeholder="Account Tag (#GZ95SFSKJ3)"
                  className="input input-bordered w-full pr-10"
                  value={accountTag}
                  onChange={handleInputChange}
                  required
                />
                
                {/* Validation Icon (Only Show When Valid) */}
                {isAccountTagValid && availableBrawlers.length > 0 && (
                  <CheckCircle2
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-green-500"
                    size={20}
                  />
                )}
                
                {/* Clear Button (Only Show When Input is Not Empty) */}
                {accountTag && (
                  <button
                    type="button" // Important to prevent form submission
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={clearInput}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !isAccountTagValid}
              >
                {loading ? <span className="loading loading-spinner"></span> : 'Analyze'}
              </button>
            </form>
            
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
        
        {data.length > 0 && (
          <>
            <div 
              className={`card bg-base-100 shadow-xl mb-8 ${tutorialHighlight === 'recommended-upgrades' ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
              id="recommended-upgrades"
            >
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">Recommended Upgrades</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topBrawlers.map((brawler, index) => {
                  const brawlerData = brawlers.find((b) => 
                    b.name.toUpperCase() === brawler.name.toUpperCase() ||
                    (brawler.name === "LARRY & LAWRIE" && b.name.toUpperCase() === "LARRY")
                  );

                  return (
                    <div key={brawler.name} className="card bg-base-200 shadow-md">
                      <div className="card-body p-4 flex items-center">
                        {/* Brawler Image */}
                        <img
                          width={80}
                          height={80}
                          src={brawlerData?.imageUrl || "/default-image.png"}
                          alt={brawler.name}
                          className="mr-4 rounded-full"
                        />
                        <div className="w-full">
                          <h3 className="card-title text-lg">{brawler.name}</h3>
                          <div className="flex items-center mt-2">
                            <div className="w-full bg-gray-700 rounded-full h-4">
                              <div 
                                className={`${getScoreColor(brawler.score)} h-4 rounded-full`} 
                                style={{width: `${Math.min(100, brawler.score || 0)}%`}}
                              ></div>
                            </div>
                            <span className="ml-2 font-bold">
                              {brawler.score !== null ? brawler.score.toFixed(1) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
            
            <div 
              className={`card bg-base-100 shadow-xl ${tutorialHighlight === 'all-brawlers' ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
              id="all-brawlers"
            >
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">All Brawlers</h2>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th 
                          className="cursor-pointer"
                          onClick={() => handleSort('name')}
                        >
                          Name
                          {sortField === 'name' && (
                            <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                          )}
                        </th>
                        <th 
                          className="cursor-pointer"
                          onClick={() => handleSort('score')}
                        >
                          Score
                          {sortField === 'score' && (
                            <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                          )}
                        </th>
                        <th 
                          className="cursor-pointer"
                          onClick={() => handleSort('total_power_points')}
                        >
                          Power Points
                          {sortField === 'total_power_points' && (
                            <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                          )}
                        </th>
                        <th 
                          className="cursor-pointer"
                          onClick={() => handleSort('total_coins')}
                        >
                          Coins
                          {sortField === 'total_coins' && (
                            <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                    {sortedData.map((brawler) => {
                      const brawlerData = brawlers.find((b) => 
                        b.name.toUpperCase() === brawler.name.toUpperCase() ||
                        (brawler.name === "LARRY & LAWRIE" && b.name.toUpperCase() === "LARRY")
                      );

                      return (
                        <tr key={brawler.name}>
                          <td className="flex items-center">
                            {/* Add Brawler Image before Name */}
                            <img
                              width={20}
                              height={20}
                              src={brawlerData?.imageUrl || "/default-image.png"}
                              alt={brawler.name}
                              className="mr-2"
                            />
                            {brawler.name}
                          </td>
                          <td>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-700 rounded-full h-2 mr-2">
                                <div 
                                  className={`${getScoreColor(brawler.score)} h-2 rounded-full`} 
                                  style={{ width: `${Math.min(100, brawler.score || 0)}%` }}
                                ></div>
                              </div>
                              {brawler.score !== null ? brawler.score.toFixed(1) : 'N/A'}
                            </div>
                          </td>
                          <td>{brawler.total_power_points}</td>
                          <td>{brawler.total_coins}</td>
                        </tr>
                      );
                    })}

                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card bg-base-100 w-full max-w-md mx-4">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title text-xl">{tutorialSteps[tutorialStep].title}</h2>
                <button onClick={closeTutorial} className="btn btn-sm btn-circle btn-ghost">
                  <X size={20} />
                </button>
              </div>
              <p className="py-4">{tutorialSteps[tutorialStep].content}</p>
              <div className="card-actions justify-between mt-4">
                <button 
                  onClick={prevTutorialStep}
                  className="btn btn-outline"
                  disabled={tutorialStep === 0}
                >
                  Previous
                </button>
                <div>
                  <span className="mr-4 text-sm">
                    {tutorialStep + 1} of {tutorialSteps.length}
                  </span>
                  <button 
                    onClick={nextTutorialStep}
                    className="btn btn-primary"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpgradeHelper;
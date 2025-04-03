"use client";
import React, { useEffect, useState } from "react";
import Image from 'next/image';
import SelectMap from "./SelectMap";
import { X, CheckCircle2, AlertOctagonIcon, HelpCircle} from "lucide-react";
import { useDataContext } from "./DataProviderContext";
import DraftInstructions from "@components/DraftInstructions";
import { getDraftToolTutorials } from "app/utils/tutorials";
import { useImageCache } from "./ImageProvider";
import CachedImage from "@components/CachedImage";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const safeToFixed = (value: number, decimals: number = 2) => {
  return typeof value === 'number' ? value.toFixed(decimals) : 'N/A';
};

const BrawlStarsDraft = () => {
  // Query client for cache management
  const queryClient = useQueryClient();
  
  {/* Data */}
  const { brawlers, maps, baseUrl, torialShownKey } = useDataContext();
  const { imagesReady, preloadImages } = useImageCache(); // Use the context hook

  {/* Frontend user */}
  const [selectedMap, setSelectedMap] = useState<string>("");
  const [teamA, setTeamA] = useState<Brawler[]>([]);
  const [teamB, setTeamB] = useState<Brawler[]>([]);
  const [bannedBrawlers, setBannedBrawlers] = useState<Brawler[]>([]);
  const [submissionResult, setSubmissionResult] = useState<SubmissionBrawler[] | null>(null);
  const [isBanMode, setIsBanMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [imagesLoading, setImagesLoading] = useState<boolean>(true);

  {/* User account */}
  const [accountTag, setAccountTag] = useState("");
  const [isAccountTagValid, setAccountTagValid] = useState<boolean | null>(null);
  const STORAGE_KEY = "accountTag"; // Key for localStorage

  {/* Tutorial related states */}
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialHighlight, setTutorialHighlight] = useState<string | null>(null);

  const tutorialSteps = getDraftToolTutorials();

  // Constants for stale time and cache time
  const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

  // Load from cache on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Preload brawler images
      const brawlerImages = brawlers.map(brawler => brawler.imageUrl);
      
      // Preload map images
      const mapImages = maps.map(map => map.imageUrl);
      
      // Combine all image sources
      const allImages = [...brawlerImages, ...mapImages];
      
      setImagesLoading(true);
      await preloadImages(allImages);
      setImagesLoading(false);
      
      // Load cached account tag
      const cachedTag = localStorage.getItem(STORAGE_KEY);
      if (cachedTag) setAccountTag(cachedTag);
    };
    
    loadInitialData();
  }, [brawlers, maps, preloadImages]);

  // React Query for win rate prediction
  const winRateQuery = useQuery({
    queryKey: ['winRate', selectedMap, teamA.map(b => b.id).join(','), teamB.map(b => b.id).join(',')],
    queryFn: async () => {
      if (teamA.length !== 3 || teamB.length !== 3 || !selectedMap) {
        return null;
      }
      
      const friends = teamA.map(brawler => brawler.name);
      const enemies = teamB.map(brawler => brawler.name);
      
      const response = await fetch(`${baseUrl}/predict_winrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          initial_team: friends,
          initial_opponent: enemies,
          map: selectedMap,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch win rate prediction");
      }

      return await response.json();
    },
    staleTime: ONE_DAY_MS, // 1 day stale time
    enabled: teamA.length === 3 && teamB.length === 3 && !!selectedMap,
  });

  // React Query for draft simulation
  const draftSimulationQuery = useQuery({
    queryKey: [
      'draftSimulation', 
      selectedMap, 
      teamA.map(b => b.id).join(','), 
      teamB.map(b => b.id).join(','),
      bannedBrawlers.map(b => b.id).join(','),
      accountTag
    ],
    queryFn: async () => {
      if (!selectedMap) {
        return null;
      }

      // Format teams to only include brawler names
      const formattedTeamA = teamA.map((brawler) => brawler.name);
      const formattedTeamB = teamB.map((brawler) => brawler.name);
      const formattedBannedBrawlers = bannedBrawlers.map((brawler) => brawler.name);

      const draftData = {
        ...(availableBrawlersQuery.data ? { available_brawlers: availableBrawlersQuery.data } : {}),
        map: selectedMap,
        excluded_brawlers: formattedBannedBrawlers,
        initial_team: formattedTeamA, 
        initial_opponent: formattedTeamB,
      };
      
      const response = await fetch(`${baseUrl}/simulate_draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit draft.");
      }

      const result = await response.json();
      
      // Transform the result into the expected format
      return result.map(([info, imageUrl]: [[string, number], string]) => ({
        name: info[0],
        score: info[1],
        imageUrl,
      }));
    },
    staleTime: ONE_DAY_MS, // 1 day stale time
    enabled: !!selectedMap,
  });

  // React Query for available brawlers
  const availableBrawlersQuery = useQuery({
    queryKey: ['availableBrawlers', accountTag],
    queryFn: async () => {
      if (!isAccountTagValid || !accountTag) {
        return [];
      }
      
      const response = await fetch(`${baseUrl}/account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_tag: accountTag,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch user account");
      }
  
      return await response.json();
    },
    staleTime: ONE_DAY_MS, // 1 day stale time
    enabled: Boolean(isAccountTagValid && accountTag), // Ensure this is always a boolean
  });

  // Update UI based on query results
  useEffect(() => {
    if (draftSimulationQuery.data) {
      setSubmissionResult(draftSimulationQuery.data);
    }
  }, [draftSimulationQuery.data]);

  // Toggle ban mode
  const toggleBanMode = () => {
    setIsBanMode(!isBanMode);
  };

  // Handle brawler click
  const handleBrawlerClick = (brawler: Brawler, team: "A" | "B") => {
    if (!selectedMap) {
      alert("Please select a map.");
      return;
    }

    clearSearch();

    // Check if the brawler is already in any team or banned
    const isInTeamA = teamA.some(b => b.id === brawler.id);
    const isInTeamB = teamB.some(b => b.id === brawler.id);
    const isBanned = bannedBrawlers.some(b => b.id === brawler.id);

    // If ban mode is active, handle adding to banned list
    if (isBanMode) {
      if (isBanned) {
        // If already banned, remove from ban list
        setBannedBrawlers(prev => prev.filter(b => b.id !== brawler.id));
      } else if (bannedBrawlers.length < 6 && !isInTeamA && !isInTeamB) {
        // Add to ban list if not already in a team and ban limit not reached
        setBannedBrawlers(prev => [...prev, brawler]);
      } else if (bannedBrawlers.length >= 6) {
        alert("You can only ban up to 6 brawlers.");
      }
      return;
    }

    // If not in ban mode, handle adding to teams
    if (isBanned) {
      alert("This brawler is banned. Unban it first.");
      return;
    }

    if (team === "A" && !isInTeamA && !isInTeamB) {
      if (teamA.length < 3) {
        setTeamA(prev => [...prev, brawler]); // Add to Team A
      } else {
        alert("Team A already has 3 brawlers.");
      }
    } else if (team === "B" && !isInTeamB && !isInTeamA) {
      if (teamB.length < 3) {
        setTeamB(prev => [...prev, brawler]); // Add to Team B
      } else {
        alert("Team B already has 3 brawlers.");
      }
    } else if (isInTeamA && team === "A") {
      // Remove from Team A if clicked again
      setTeamA(prev => prev.filter(b => b.id !== brawler.id));
    } else if (isInTeamB && team === "B") {
      // Remove from Team B if clicked again
      setTeamB(prev => prev.filter(b => b.id !== brawler.id));
    }
  };

  // Handle map selection
  const handleMapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMap(e.target.value);
  };

  // Reset the draft
  const handleReset = () => {
    setSelectedMap("");
    setTeamA([]);
    setTeamB([]);
    setBannedBrawlers([]);
    setSubmissionResult(null);
    setIsBanMode(false);
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['winRate'] });
    queryClient.invalidateQueries({ queryKey: ['draftSimulation'] });
  };

  // Get the current map's image URL
  const currentMapImage = maps.find((map) => map.name === selectedMap)?.imageUrl || "";

  // Function to check if a brawler is selected in any team or banned
  const getBrawlerStatus = (brawler: Brawler) => {
    if (teamA.some(b => b.id === brawler.id)) return "teamA";
    if (teamB.some(b => b.id === brawler.id)) return "teamB";
    if (bannedBrawlers.some(b => b.id === brawler.id)) return "banned";
    return "available";
  };

  const filteredBrawlers = brawlers.filter((brawler) =>
    brawler.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Determine win rate color and text based on the percentage
  const getWinRateColorClass = () => {
    const winRate = winRateQuery.data;
    if (winRate === null) return "";
    if (winRate >= 52) return "text-success";
    if (winRate >= 48) return "text-warning";
    return "text-error";
  };

  const getWinRateText = () => {
    const winRate = winRateQuery.data;
    if (winRate === null) return "Win rate data unavailable – focus on playing your best!";

    if (winRate > 54) return "Dominant matchup – Strong advantage! Stay focused and capitalize on your lead.";
    if (winRate > 52) return "Favorable matchup – Your team has the edge. Play confidently but stay sharp.";
    if (winRate > 50.5) return "Slightly favorable – Small advantage. Stick to solid plays and avoid risks.";
    if (winRate > 49.5) return "Balanced matchup – A close game ahead. Good teamwork will make the difference.";
    if (winRate > 48) return "Even matchup – Could go either way. Adapt and play smart!";
    if (winRate > 45) return "Slight disadvantage – Play carefully and look for opportunities to turn the tide.";
    
    return "Challenging matchup – Tough battle ahead. Stay resilient and work with your team!";
  };

  {/* Account inputs */}

  // Clear input and remove from cache
  const clearInput = () => {
    setAccountTag("");
    setAccountTagValid(null);
    localStorage.removeItem(STORAGE_KEY);
    
    // Invalidate the query
    queryClient.invalidateQueries({ queryKey: ['availableBrawlers'] });
  };

  // Handle input change and validate
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setAccountTag(newValue);
    validateInput(newValue);
    localStorage.setItem(STORAGE_KEY, newValue);
  };

  // Validate input and set validation state
  const validateInput = (tag: string) => {
    const tagPattern = /^#?[A-Za-z0-9]{9}$/; // Allows optional '#' followed by exactly 9 alphanumeric characters
    setAccountTagValid(tagPattern.test(tag));
  };

  {/* Tutorial */}
  
  // Manual trigger for tutorial
  const showTutorialManually = () => {
    setShowTutorial(true);
    setTutorialStep(0);
    setTutorialHighlight('map-input');
  };

  // Close tutorial and mark as viewed
  const closeTutorial = () => {
    setShowTutorial(false);
    setTutorialHighlight('');
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

  return (
    <div className="container mx-auto p-4 px-4 sm:px-8 md:px-16 lg:max-w-full">

      {/* Map and Account Selection */}
      <div className="flex flex-wrap items-start gap-4 mb-4 sm:flex-nowrap">
        {/* Map Selection */}
        <div 
          className={`flex flex-col flex-1 ${tutorialHighlight === 'map-input' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} 
          id="map-input"
        >
          <SelectMap 
            mapsData={maps} 
            selectedMap={selectedMap} 
            handleMapChange={handleMapChange} 
          />
        </div>

        {/* Tutorial Button */}
        {selectedMap && (
          <div className="flex justify-between items-center">
            <button 
              onClick={showTutorialManually} 
              className="btn btn-circle btn-ghost btn-sm" // ⬅ Smaller button on mobile
              title="Show Tutorial"
            >
              <HelpCircle size={20} /> {/* ⬅ Smaller icon */}
            </button>
          </div>
        )}

        {/* Ban Mode Toggle */}
        {selectedMap && (
          <div 
            className={`form-control w-full sm:w-52 mb-2 group relative ${tutorialHighlight === 'ban-mode' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} 
            id="ban-mode"
          >
            <label className="cursor-pointer label">
              <span className="label-text text-sm md:text-md text-sm:text-lg">Ban Mode</span> {/* ⬅ Smaller text */}
              <input 
                type="checkbox" 
                className="toggle toggle-error"
                checked={isBanMode} 
                onChange={toggleBanMode} 
              />
            </label>

            {/* Notification-style message that shows on hover */}
            <div 
              className={`absolute top-full left-0 mt-1 p-2 rounded-md text-xs sm:text-sm w-full 
              ${isBanMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} 
              opacity-0 group-hover:opacity-100 transition-all duration-300`}
            >
              <p>{isBanMode ? "Click on brawlers to ban them (max 6)" : "Click to add to Team A, right-click for Team B"}</p>
            </div>
          </div>
        )}

        {/* Account Tag Selection */}
        {selectedMap && (
          <div 
            className={`flex flex-col w-full sm:w-80 relative ${tutorialHighlight === 'account-input' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} 
            id="account-input"
          >
            <input 
              type="text"
              id="accountTag"
              name="accountTag"
              placeholder="Account Tag (#GZ95SFSKJ3)"
              className="input input-bordered w-full text-sm md:text-sm sm:text-base pr-10" // ⬅ Smaller input text
              value={accountTag}
              onChange={handleInputChange}
              required
            />

            {/* Validation Icon (Only Show When Valid) */}
            {isAccountTagValid && availableBrawlersQuery && (
              <CheckCircle2 
                className="absolute right-8 top-1/2 transform -translate-y-1/2 text-green-500" 
                size={16} // ⬅ Smaller icon
              />
            )}

            {/* Clear Button (Only Show When Input is Not Empty) */}
            {accountTag && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" 
                onClick={clearInput}
              >
                <X size={16} /> {/* ⬅ Smaller clear icon */}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Left Side: Banned Brawlers */}
        {selectedMap && (
          <div className="w-full lg:w-1/6 mb-6 lg:mb-0 lg:pr-4">
            <div className="card bg-base-200 shadow-lg p-2 sm:p-4 rounded-xl h-full flex flex-col">
              {/* Header */}
              <div className="text-center mb-2 sm:mb-4 flex flex-row sm:flex-col justify-between items-center sm:items-stretch px-2 sm:px-0">
                <h2 className="text-lg sm:text-xl font-bold text-primary">
                  Banned Brawlers
                </h2>
                <div className="text-xs sm:text-sm text-gray-400">
                  {bannedBrawlers.length}/6 banned
                </div>
              </div>

              {/* Brawler Grid */}
              <div className="grid grid-cols-3 lg:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-1 sm:gap-2 p-1 sm:p-2 auto-rows-min">
                {bannedBrawlers.map((brawler, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col items-center justify-start bg-base-300/50 p-1 sm:p-2 rounded-lg hover:bg-base-300 transition-all"
                  >
                    {/* Fixed size image container */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex-shrink-0">
                      <CachedImage
                        src={brawler.imageUrl}
                        alt={brawler.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-medium mt-1 text-center line-clamp-1 w-full">
                      {brawler.name}
                    </span>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 6 - bannedBrawlers.length) }).map((_, index) => (
                  <div 
                    key={`empty-${index}`} 
                    className="flex flex-col items-center justify-center bg-base-300/10 p-1 sm:p-2 rounded-lg border border-dashed sm:border-2 border-base-300/30"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-base-300/20 flex items-center justify-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 sm:h-5 sm:w-5 text-base-300"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-xs text-base-300 mt-1">Available</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-base-300/20">
                <button 
                  className="btn btn-error btn-block btn-xs sm:btn-sm hover:scale-[1.02] transition-transform"
                  onClick={handleReset}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Draft
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Middle: Current Map and Teams */}
        <div className={`lg:w-3/6 relative ${tutorialHighlight === 'predict-winrate' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} id="predict-winrate">
          {/* Current Map Image */}
          {selectedMap && (
            <div className="card bg-base-200 shadow-md p-2 sm:p-4 text-center mb-4 sm:mb-8">
              <figure className="relative">
                <Image 
                  src={`${currentMapImage}`}
                  alt={selectedMap}
                  width={256}
                  height={384}
                  className="w-40 h-60 sm:w-64 sm:h-96 mx-auto"
                />
                {/* Team A */}
                <div className="absolute top-0 left-0 w-1/3 sm:w-1/4 p-1 sm:p-2 bg-opacity-75">
                  <h2 className="text-sm sm:text-2xl font-bold mb-1 sm:mb-4">Allies</h2>
                  <div className="space-y-1 sm:space-y-2">
                    {teamA.map((brawler, index) => (
                      <div key={index} className="flex items-center gap-1 sm:gap-2">
                        <CachedImage
                          key={`${brawler.name}-${index}`}
                          src={brawler.imageUrl}
                          alt={brawler.name}
                          width={80}
                          height={80}
                          className="w-6 h-6 sm:w-10 sm:h-10 object-cover rounded-full"
                        />
                        <span className="badge text-xs badge-primary hidden sm:inline whitespace-nowrap">{brawler.name}</span>
                      </div>
                    ))}
                    {/* Empty slots for Team A */}
                    {Array.from({ length: Math.max(0, 3 - teamA.length) }).map((_, index) => (
                      <div key={`empty-a-${index}`} className="flex items-center gap-1 sm:gap-2 opacity-30">
                        <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gray-400"></div>
                        <span className="badge badge-outline hidden sm:inline">Empty</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Team B */}
                <div className="absolute top-0 right-0 w-1/3 sm:w-1/4 p-1 sm:p-2 bg-opacity-75">
                  <h2 className="text-sm sm:text-2xl font-bold mb-1 sm:mb-4">Ennemies</h2>
                  <div className="space-y-1 sm:space-y-2">
                    {teamB.map((brawler, index) => (
                      <div key={index} className="flex items-center gap-1 sm:gap-2">
                        <CachedImage
                          key={`${brawler.name}-${index}`}
                          width={80}
                          height={80}
                          src={brawler.imageUrl}
                          alt={brawler.name}
                          className="w-6 h-6 sm:w-10 sm:h-10 object-cover rounded-full"
                        />
                        <span className="badge badge-secondary hidden sm:inline">{brawler.name}</span>
                      </div>
                    ))}
                    {/* Empty slots for Team B */}
                    {Array.from({ length: Math.max(0, 3 - teamB.length) }).map((_, index) => (
                      <div key={`empty-b-${index}`} className="flex items-center gap-1 sm:gap-2 opacity-30">
                        <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gray-400"></div>
                        <span className="badge badge-outline hidden sm:inline">Empty</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Win Rate Indicator - Shows when both teams are full and win rate is available */}
                {teamA.length === 3 && teamB.length === 3 && (
                  <div className="absolute bottom-0 left-0 right-0 p-1 sm:p-2 bg-base-300 bg-opacity-90 group">
                    <div className="text-center text-xs sm:text-base font-bold cursor-help">
                      {isLoadingWinRate ? (
                        <span className="loading loading-dots loading-sm sm:loading-md"></span>
                      ) : (
                        <>
                          <span>Match Prediction</span>
                          <div className="opacity-100 absolute bottom-full left-0 right-0 p-2 sm:p-3 bg-base-200 rounded-md shadow-lg z-10">
                            {winRate !== null ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-sm sm:text-xl font-bold ${getWinRateColorClass()}`}>
                                  {safeToFixed(winRate, 1)}% Win Rate
                                </span>
                                <span className={`text-xs sm:text-base ${getWinRateColorClass()}`}>
                                  {getWinRateText()}
                                </span>
                                <div className="w-full bg-gray-300 rounded-full h-2 sm:h-4 mt-1 sm:mt-2">
                                  <div 
                                    className={`h-2 sm:h-4 rounded-full ${
                                      winRate >= 52 ? 'bg-success' : 
                                      winRate >= 48 ? 'bg-warning' : 'bg-error'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs mt-1 sm:mt-2 hidden sm:block">
                                  Based on AI analysis of your team composition versus the enemy team on {selectedMap}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs sm:text-base">Unable to calculate win rate</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </figure>
              <h3 className="text-xl sm:text-3xl font-semibold mt-1 sm:mt-2">{selectedMap}</h3>
            </div>
          )}
        </div>
              
        {/* Right Side: Top 10 Brawlers */}
        <div className="lg:w1/6">
          {submissionResult && selectedMap && (
            <div className={`card bg-base-200 shadow-md p-4 ${tutorialHighlight === 'top-10-brawlers' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} id="top-10-brawlers">
              <h2 className="text-xl md:text-lg sm:text-sm font-bold mb-4 text-center">
                Best 10 Brawlers for <span className="text-primary">{selectedMap}</span> by AI Score
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {submissionResult.map((brawler, index) => (
                  <div
                    key={index}
                    className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-2"
                  >
                    <figure className="px-3 pt-3">
                      <CachedImage
                        key={`${brawler.name}-${index}`}
                        width={64}
                        height={64}
                        src={brawler.imageUrl}
                        alt={brawler.name}
                        className="w-16 h-16 sm:w-8 sm:h-10 md:w-12 md:h-14 lg:w-16 lg:h-16 object-cover rounded-full border-2 border-primary gap-1"
                      />
                    </figure>
                    <div className="card-body items-center text-center p-4">
                      {/* Ranking Badge */}
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        #{index + 1}
                      </div>
                      <h3 className="card-title text-lg font-semibold mt-2">{brawler.name}</h3>
                      <p className="text-s md:text-lg sm:text- font-bold text-primary">
                        Score: {safeToFixed(brawler.score * 10, 3)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search bar */}
      {selectedMap && (
        <div className="mb-8 relative">
          <input
            type="text"
            placeholder="Search brawlers..."
            className="input input-bordered w-full max-w-xs pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Clear Button */}
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute top-1/2 left-72 transform -translate-y-1/2 text-3xl"
            >
              &times;
            </button>
          )}
        </div>
      )}

      {/* Brawlers Grid */}
      {submissionResult && selectedMap ? (
        <div 
          className={`brawler-grid ${tutorialHighlight === 'brawler-grid' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} 
          id="brawler-grid"
          style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', 
            gap: '2px'
          }}
        >
          {filteredBrawlers.map((brawler: Brawler) => {
            const status = getBrawlerStatus(brawler);
            let statusClass = "border-2 border-transparent";
            
            if (status === "teamA") statusClass = "border-2 border-primary";
            else if (status === "teamB") statusClass = "border-2 border-secondary";
            else if (status === "banned") statusClass = "border-2 border-error opacity-60";
            
            return (
              <div
                key={brawler.id}
                className={`bg-base-100 hover:bg-base-200 cursor-pointer transition-all rounded shadow-sm mx-auto flex flex-col items-center ${statusClass}`}
                style={{
                  width: 'fit-content'
                }}
                onClick={() => handleBrawlerClick(brawler, "A")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleBrawlerClick(brawler, "B");
                }}
              >
                <CachedImage
                  key={`${brawler.name}`}
                  width={75}
                  height={75}
                  src={brawler.imageUrl}
                  alt={brawler.name}
                  className="w-18 h-18"
                  style={{
                    maxWidth: '100%'
                  }}
                />
                <p className="text-sm font-medium w-full text-center overflow-hidden whitespace-nowrap text-ellipsis">
                  {brawler.name}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <DraftInstructions 
        title="Brawler Draft Instructions" 
        subtitle="Select a map to start draft tool !" 
      />
    )}

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

export default BrawlStarsDraft;
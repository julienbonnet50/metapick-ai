"use client";
import React, { useEffect, useState } from "react";
import Image from 'next/image';
import SelectMap from "./SelectMap";
import { X, CheckCircle2, AlertOctagonIcon, HelpCircle} from "lucide-react";
import { useDataContext } from "./DataProviderContext";
import { getDraftToolTutorials } from "app/utils/tutorials";

const safeToFixed = (value: number, decimals: number = 2) => {
  return typeof value === 'number' ? value.toFixed(decimals) : 'N/A';
};

const BrawlStarsDraft = () => {
  {/* Data */}
  const { brawlers, maps, baseUrl, torialShownKey } = useDataContext();

  {/* Frontend user */}
  const [selectedMap, setSelectedMap] = useState<string>("");
  const [teamA, setTeamA] = useState<Brawler[]>([]);
  const [teamB, setTeamB] = useState<Brawler[]>([]);
  const [bannedBrawlers, setBannedBrawlers] = useState<Brawler[]>([]);
  const [submissionResult, setSubmissionResult] = useState<SubmissionBrawler[] | null>(null);
  const [isBanMode, setIsBanMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [winRate, setWinRate] = useState<number | null>(null);
  const [isLoadingWinRate, setIsLoadingWinRate] = useState<boolean>(false);

  {/* User account */}
  const [availableBrawlers, setAvailableBrawlers] = useState<Brawler[]>([]);
  const [accountTag, setAccountTag] = useState("");
  const [isAccountTagValid, setAccountTagValid] = useState<boolean | null>(null);
  const STORAGE_KEY = "accountTag"; // Key for localStorage

  {/* Tutorial related states */}
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialHighlight, setTutorialHighlight] = useState<string | null>(null);

  const tutorialSteps = getDraftToolTutorials();


    // Load from cache on mount
    useEffect(() => {
      const cachedTag = localStorage.getItem(STORAGE_KEY);
      if (cachedTag) setAccountTag(cachedTag);
    }, []);

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
      // Reset win rate when team composition changes
      setWinRate(null);
    } else if (isInTeamB && team === "B") {
      // Remove from Team B if clicked again
      setTeamB(prev => prev.filter(b => b.id !== brawler.id));
      // Reset win rate when team composition changes
      setWinRate(null);
    }
  };

  // Handle map selection
  const handleMapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMap(e.target.value);
    // Reset win rate when map changes
    setWinRate(null);
  };

  // Fetch win rate prediction when both teams are full
  useEffect(() => {
    const updateWinrate = async () => {
      // Only fetch if both teams are full (3 brawlers each) and a map is selected
      if (teamA.length === 3 && teamB.length === 3 && selectedMap) {
        setIsLoadingWinRate(true);
        
        try {
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
    
          const data = await response.json(); // Return the parsed JSON response (win rate prediction data)
          setWinRate(data);
        } catch (error) {
          console.error("Error fetching win rate:", error);
          setWinRate(null);
        } finally {
          setIsLoadingWinRate(false);
        }
      } else {
        // Reset win rate if teams are not full
        setWinRate(null);
      }
    };
    
    updateWinrate();
  }, [teamA, teamB, selectedMap]);

  // Submit draft data
  const handleSubmit = async () => {
    if (!selectedMap) {
      alert("Please select a map.");
      return;
    }

    // Format teams to only include brawler names
    const formattedTeamA = teamA.map((brawler) => brawler.name);
    const formattedTeamB = teamB.map((brawler) => brawler.name);
    const formattedBannedBrawlers = bannedBrawlers.map((brawler) => brawler.name);

    const draftData = {
      ...(availableBrawlers ? { available_brawlers: availableBrawlers } : {}),
      map: selectedMap,
      excluded_brawlers: formattedBannedBrawlers,
      initial_team: formattedTeamA, 
      initial_opponent: formattedTeamB,
    };
    
    // console.log("Send draft data", JSON.stringify(draftData));

    try {
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
      // console.log("Result : ", result);

      interface FormattedItem {
        name: string;
        score: number;
        imageUrl: string;
      }
      
      // Assuming `result` is an array of tuples like `[[string, number], string]`
      const formattedResult: FormattedItem[] = result.map(([info, imageUrl]: [[string, number], string]) => ({
        name: info[0],
        score: info[1],
        imageUrl,
      }));

      // Transform the result into the expected format
      setSubmissionResult(formattedResult);
    } catch (error: unknown) {
      console.error("Error submitting draft:", error);
      setSubmissionResult(null);
    }
  };

  useEffect(() => {
    if (selectedMap) {
      handleSubmit();
    }
  }, [selectedMap, teamA, teamB, bannedBrawlers, availableBrawlers]); // Re-run handleSubmit when any of these change

  // Reset the draft
  const handleReset = () => {
    setSelectedMap("");
    setTeamA([]);
    setTeamB([]);
    setBannedBrawlers([]);
    setSubmissionResult(null);
    setIsBanMode(false);
    setWinRate(null);
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
    if (winRate === null) return "";
    if (winRate >= 52) return "text-success";
    if (winRate >= 48) return "text-warning";
    return "text-error";
  };

  const getWinRateText = () => {
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

  // Fetch available brawlers when accountTag is valid
  useEffect(() => {
    if (isAccountTagValid && accountTag) {
      fetchAvailableBrawlers(accountTag, baseUrl);
    } else {
      setAvailableBrawlers([]);
    }
  }, [isAccountTagValid, accountTag]);

  const fetchAvailableBrawlers = async (player_tag: string, baseUrl: string) => {
  
    try {
      const response = await fetch(`${baseUrl}/account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_tag: player_tag,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch user account");
      }
  
      const data = await response.json(); // Return the parsed JSON response (win rate prediction data)
      setAvailableBrawlers(data);
    } catch (error) {
      console.error("Error in fetchAvailableBrawlers:", error);
      throw error; 
    }
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
    <div className="container mx-auto p-4 max-w-full sm:px-8 md:px-32 px-48">

      {/* Map and Account Selection */}
      <div className="flex items-start space-x-4 mb-8">
        {/* Map Selection */}
        <div className={`flex flex-col flex-1 ${tutorialHighlight === 'map-input' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} id="map-input">
          <SelectMap
            mapsData={maps}
            selectedMap={selectedMap}
            handleMapChange={handleMapChange}
          />
        </div>

        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={showTutorialManually} 
            className="btn btn-circle btn-ghost"
            title="Show Tutorial"
          >
            <HelpCircle size={24} />
          </button>
        </div>

        {/* Account Tag Selection */}
        <div className={`flex flex-col w-96 relative ${tutorialHighlight === 'account-input' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} id="account-input">
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
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={clearInput}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Left Side: Banned Brawlers */}
        <div className="lg:w-1/6">
          <div className="card bg-base-200 shadow-md p-4">
            <h2 className="text-xl font-bold text-center mb-4">Banned ({bannedBrawlers.length}/6)</h2>
            <div className="flex flex-col gap-1">
              {bannedBrawlers.map((brawler, index) => (
                <div key={index} className="flex items-center bg-base-300 p-2 rounded-lg">
                  <img
                    src={brawler.imageUrl}
                    alt={brawler.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-cover rounded-full mr-2"
                  />
                  <span className="badge badge-error">{brawler.name}</span>
                </div>
              ))}
              {/* Empty slots for banned brawlers */}
              {Array.from({ length: Math.max(0, 6 - bannedBrawlers.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="flex items-center bg-base-300 p-2 rounded-lg opacity-30">
                  <div className="w-10 h-10 rounded-full bg-gray-400 mr-2"></div>
                  <span className="badge badge-outline">Empty</span>
                </div>
              ))}
            </div>
          </div>
          {/* Submit and Reset Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button className="btn btn-success" onClick={handleReset}>
              Reset Draft
            </button>
          </div>
          {/* Ban Mode Toggle */}
          <div className={`form-control w-52 mb-1 group relative ${tutorialHighlight === 'ban-mode' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} id="ban-mode">
            <label className="cursor-pointer label">
              <span className="label-text text-xl">Ban Mode</span>
              <input
                type="checkbox"
                className="toggle toggle-error"
                checked={isBanMode}
                onChange={toggleBanMode}
              />
            </label>

            {/* Notification-style message that shows on hover */}
            <div
              className={`absolute top-full left-0 mt-1 p-2 rounded-md text-sm w-full ${ 
                isBanMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700' } 
                opacity-0 group-hover:opacity-100 transition-all duration-300`}
            >
              <p>{isBanMode ? "Click on brawlers to ban them (max 6)" : "Click to add to Team A, right-click for Team B"}</p>
            </div>
          </div>
        </div>

        {/* Middle: Current Map and Teams */}
        <div className={`lg:w-3/6 relative ${tutorialHighlight === 'predict-winrate' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} id="predict-winrate">
          {/* Current Map Image */}
          {selectedMap && (
            <div className="card bg-base-200 shadow-md p-4 text-center mb-8">
              <figure className="relative">
                <Image 
                  src={`${currentMapImage}`} // Adjust the path as needed
                  alt={selectedMap}
                  width={256}
                  height={384}
                  className="w-64 h-96 mx-auto"
                />
                {/* Team A */}
                <div className="absolute top-0 left-0 w-1/4 p-2 bg-opacity-75">
                  <h2 className="text-2xl font-bold mb-4 ">Allies</h2>
                  <div className="space-y-2">
                    {teamA.map((brawler, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <img
                          src={brawler.imageUrl}
                          alt={brawler.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded-full"
                        />
                        <span className="badge text-s badge-primary whitespace-nowrap">{brawler.name}</span>
                      </div>
                    ))}
                    {/* Empty slots for Team A */}
                    {Array.from({ length: Math.max(0, 3 - teamA.length) }).map((_, index) => (
                      <div key={`empty-a-${index}`} className="flex items-center gap-2 opacity-30">
                        <div className="w-10 h-10 rounded-full bg-gray-400"></div>
                        <span className="badge badge-outline">Empty</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Team B */}
                <div className="absolute top-0 right-0 w-1/4 p-2 bg-opacity-75">
                  <h2 className="text-2xl font-bold mb-4">Ennemies</h2>
                  <div className="space-y-2">
                    {teamB.map((brawler, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <img
                          width={40}
                          height={40}
                          src={brawler.imageUrl}
                          alt={brawler.name}
                          className="w-10 h-10 object-cover rounded-full"
                        />
                        <span className="badge badge-secondary">{brawler.name}</span>
                      </div>
                    ))}
                    {/* Empty slots for Team B */}
                    {Array.from({ length: Math.max(0, 3 - teamB.length) }).map((_, index) => (
                      <div key={`empty-b-${index}`} className="flex items-center gap-2 opacity-30">
                        <div className="w-10 h-10 rounded-full bg-gray-400"></div>
                        <span className="badge badge-outline">Empty</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Win Rate Indicator - Shows when both teams are full and win rate is available */}
                {teamA.length === 3 && teamB.length === 3 && (
                  <div className={`absolute bottom-0 left-0 right-0 p-2 bg-base-300 bg-opacity-90 group`}>
                    <div className={`text-center font-bold cursor-help`}>
                      {isLoadingWinRate ? (
                        <span className="loading loading-dots loading-md"></span>
                      ) : (
                        <>
                          <span>Match Prediction</span>
                          <div className={`opacity-100 absolute bottom-full left-0 right-0 p-3 bg-base-200 rounded-md shadow-lg z-10`}>
                            {winRate !== null ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-xl font-bold ${getWinRateColorClass()}`}>
                                  {safeToFixed(winRate, 1)}% Win Rate
                                </span>
                                <span className={getWinRateColorClass()}>
                                  {getWinRateText()}
                                </span>
                                <div className="w-full bg-gray-300 rounded-full h-4 mt-2">
                                  <div 
                                    className={`h-4 rounded-full ${
                                      winRate >= 52 ? 'bg-success' : 
                                      winRate >= 48 ? 'bg-warning' : 'bg-error'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs mt-2">
                                  Based on AI analysis of your team composition versus the enemy team on {selectedMap}
                                </p>
                              </div>
                            ) : (
                              <p>Unable to calculate win rate</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </figure>
              <h3 className="text-3xl font-semibold mt-2">{selectedMap}</h3>
            </div>
          )}
        </div>

        {/* Right Side: Top 10 Brawlers */}
        <div className="lg:w1/6">
          {submissionResult && (
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
                      <img
                        width={64}
                        height={64}
                        src={brawler.imageUrl}
                        alt={brawler.name}
                        className="w-16 h-16 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-cover rounded-full border-2 border-primary gap-1"
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

      {/* Brawlers Grid */}
      {submissionResult && (
        <div className={`grid grid-cols-[repeat(24,1fr)] ${tutorialHighlight === 'brawler-grid' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} id="brawler-grid">
        {filteredBrawlers.map((brawler: Brawler) => {
          const status = getBrawlerStatus(brawler);
          let statusClass = "border-2 border-transparent";

          if (status === "teamA") statusClass = "border-2 border-primary";
          else if (status === "teamB") statusClass = "border-2 border-secondary";
          else if (status === "banned") statusClass = "border-2 border-error opacity-60";

          return (
            <div
              key={brawler.id}
              className={`bg-base-100 hover:bg-base-200 cursor-pointer transition-all rounded shadow-sm w-fit mx-auto flex flex-col items-center ${statusClass}`}
              onClick={() => handleBrawlerClick(brawler, "A")}
              onContextMenu={(e) => {
                e.preventDefault();
                handleBrawlerClick(brawler, "B");
              }}
            >
              <img
                width={55}
                height={55} 
                src={brawler.imageUrl}
                alt={brawler.name}
                className="w-18 h-18"
              />
              <p className="text-sm font-medium w-full text-center overflow-hidden whitespace-nowrap text-ellipsis">{brawler.name}</p>
            </div>
          );
        })}
      </div>
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
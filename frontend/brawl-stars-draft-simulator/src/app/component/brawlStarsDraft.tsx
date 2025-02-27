"use client";
import React, { useEffect, useState } from "react";
import { fetchBrawlers, fetchMaps } from "../utils/api";
import brawlerMaps from "../data/brawlersMaps.json"; // Import the maps

// Define the Brawler type
interface Brawler {
  id: number;
  name: string;
  imageUrl: string;
}

// Define Submission Result type
interface SubmissionBrawler {
  name: string;
  score: number;
  imageUrl: string;
}

const safeToFixed = (value: any, decimals: number = 2) => {
  return typeof value === 'number' ? value.toFixed(decimals) : 'N/A';
};

const BrawlStarsDraft = () => {
  const [brawlers, setBrawlers] = useState<Brawler[]>([]);
  const [maps, setMaps] = useState<string[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>("");
  const [teamA, setTeamA] = useState<Brawler[]>([]);
  const [teamB, setTeamB] = useState<Brawler[]>([]);
  const [bannedBrawlers, setBannedBrawlers] = useState<Brawler[]>([]);
  const [submissionResult, setSubmissionResult] = useState<SubmissionBrawler[] | null>(null);
  const [isBanMode, setIsBanMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      const brawlersData = await fetchBrawlers();
      const mapsData = await fetchMaps();

      // Sort brawlers by name
      const sortedBrawlers = brawlersData.sort((a: any, b: any) => a.name.localeCompare(b.name));
      const sortedMaps = mapsData.sort((a: any, b: any) => a.localeCompare(b));

      setBrawlers(sortedBrawlers);
      setMaps(sortedMaps);
    };
    loadData();
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
    } else if (isInTeamB && team === "B") {
      // Remove from Team B if clicked again
      setTeamB(prev => prev.filter(b => b.id !== brawler.id));
    }
  };

  // Handle map selection
  const handleMapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMap(e.target.value);
  };

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
      map: selectedMap,
      excluded_brawlers: formattedBannedBrawlers,
      initial_team: formattedTeamA,  // Now only contains names
      initial_opponent: formattedTeamB,  // Now only contains names
    };

    console.log("Send draft data", JSON.stringify(draftData));

    try {
      const response = await fetch("http://127.0.0.1:5000/simulate_draft", {
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
      console.log("Result : ", result);

      // Transform the result into the expected format
      const formattedResult = result.map((item: any) => ({
        name: item[0][0],
        score: item[0][1],
        imageUrl: item[1],
      }));

      setSubmissionResult(formattedResult);
    } catch (error: any) {
      console.error("Error submitting draft:", error);
      setSubmissionResult(null);
    }
  };

  useEffect(() => {
    if (selectedMap) {
      handleSubmit();
    }
  }, [selectedMap, teamA, teamB, bannedBrawlers]); // Re-run handleSubmit when any of these change

  // Reset the draft
  const handleReset = () => {
    setSelectedMap("");
    setTeamA([]);
    setTeamB([]);
    setBannedBrawlers([]);
    setSubmissionResult(null);
    setIsBanMode(false);
  };

  // Get the current map's image URL
  const currentMapImage = brawlerMaps.maps.find((map) => map[0] === selectedMap)?.[1] || "";

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

  return (
    <div className="container mx-auto p-4 max-w-full px-12">
      <h1 className="text-5xl font-bold text-center mb-8">Brawl Stars Draft Simulator</h1>

      {/* Map Selection */}
      <div className="form-control mb-8">
        <label className="label">
          <span className="label-text">Select Map</span>
        </label>
        <select className="select text-1xl select-bordered w-full text-1xl" onChange={handleMapChange} value={selectedMap}>
          <option value="">Select a map</option>
          {maps.map((map, index) => (
            <option key={index} value={map}>
              {map}
            </option>
          ))}
        </select>
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
          <div className="form-control w-52 mb-1 group relative">
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
        <div className="lg:w-3/6 relative">
          {/* Current Map Image */}
          {selectedMap && (
            <div className="card bg-base-200 shadow-md p-4 text-center mb-8">
              <figure className="relative">
                <img
                  src={`/assets/maps/${currentMapImage}`} // Adjust the path as needed
                  alt={selectedMap}
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
              </figure>
              <h3 className="text-3xl font-semibold mt-2">{selectedMap}</h3>
            </div>
          )}
        </div>

        {/* Right Side: Top 10 Brawlers */}
        <div className="lg:w-/6">
          {submissionResult && (
            <div className="card bg-base-200 shadow-md p-4">
              <h2 className="text-xl font-bold mb-4 text-center">
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
                        src={brawler.imageUrl}
                        alt={brawler.name}
                        className="w-16 h-16 object-cover rounded-full border-2 border-primary"
                      />
                    </figure>
                    <div className="card-body items-center text-center p-4">
                      {/* Ranking Badge */}
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        #{index + 1}
                      </div>
                      <h3 className="card-title text-lg font-semibold mt-2">{brawler.name}</h3>
                      <p className="text-s font-bold text-primary">
                        Score: {safeToFixed(brawler.score * 1000, 3)}
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
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search brawlers..."
          className="input input-bordered w-full max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Brawlers Grid */}
      <div className="grid grid-cols-[repeat(24,1fr)] gap-1">
        {filteredBrawlers.map((brawler: any) => {
          const status = getBrawlerStatus(brawler);
          let statusClass = "";

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
                src={brawler.imageUrl}
                alt={brawler.name}
                className="w-18 h-18"
              />
              <p className="text-s font-medium truncate w-full text-center">{brawler.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrawlStarsDraft;

"use client";
import React, { useEffect, useState } from "react";
import { fetchBrawlers, fetchMaps } from "../utils/api";

// Define the Brawler type
interface Brawler {
  id: number;
  name: string;
  imageUrl: string;
}

const BrawlStarsDraft = () => {
  const [brawlers, setBrawlers] = useState<Brawler[]>([]);
  const [maps, setMaps] = useState<string[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>("");
  const [teamA, setTeamA] = useState<Brawler[]>([]);
  const [teamB, setTeamB] = useState<Brawler[]>([]);
  const [bannedBrawlers, setBannedBrawlers] = useState<Brawler[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      const brawlersData = await fetchBrawlers();
      const mapsData = await fetchMaps();
      setBrawlers(brawlersData);
      setMaps(mapsData);
    };
    loadData();
  }, []);

  // Handle brawler click
  const handleBrawlerClick = (brawler: Brawler, team: "A" | "B") => {
    if (team === "A") {
      setTeamA((prev) => [...prev, brawler]); // Add to Team A
    } else if (team === "B") {
      setTeamB((prev) => [...prev, brawler]); // Add to Team B
    }
  };

  // Handle map selection
  const handleMapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMap(e.target.value);
  };

  // Submit draft data
  const handleSubmit = async () => {
    const draftData = {
      map: selectedMap,
      bannedBrawlers,
      teamA,
      teamB,
    };

    const response = await fetch("http://127.0.0.1:5000/submit_draft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draftData),
    });

    if (response.ok) {
      alert("Draft submitted successfully!");
    } else {
      alert("Failed to submit draft.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Brawl Stars Draft Simulator</h1>

      {/* Map Selection */}
      <div className="form-control mb-8">
        <label className="label">
          <span className="label-text">Select Map</span>
        </label>
        <select className="select select-bordered w-full" onChange={handleMapChange} value={selectedMap}>
          <option value="">Select a map</option>
          {maps.map((map, index) => (
            <option key={index} value={map}>
              {map}
            </option>
          ))}
        </select>
      </div>

      {/* Brawlers Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {brawlers.map((brawler) => (
          <div
            key={brawler.id}
            className="card bg-base-200 shadow-xl cursor-pointer"
            onClick={() => handleBrawlerClick(brawler, "A")} // Left click for Team A
            onContextMenu={(e) => {
              e.preventDefault();
              handleBrawlerClick(brawler, "B"); // Right click for Team B
            }}
          >
            <figure>
              {/* Smaller image size */}
              <img
                src={brawler.imageUrl}
                alt={brawler.name}
                className="w-12 h-12 object-cover mx-auto mt-4" // Adjusted size
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title text-center">{brawler.name}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Teams Display */}
      <div className="flex justify-between mb-8">
        <div className="w-1/2">
          <h2 className="text-2xl font-bold mb-4">Team A</h2>
          <div className="space-y-2">
            {teamA.map((brawler, index) => (
              <div key={index} className="badge badge-primary">
                {brawler.name}
              </div>
            ))}
          </div>
        </div>
        <div className="w-1/2">
          <h2 className="text-2xl font-bold mb-4">Team B</h2>
          <div className="space-y-2">
            {teamB.map((brawler, index) => (
              <div key={index} className="badge badge-secondary">
                {brawler.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button className="btn btn-primary w-full" onClick={handleSubmit}>
        Submit Draft
      </button>
    </div>
  );
};

export default BrawlStarsDraft;
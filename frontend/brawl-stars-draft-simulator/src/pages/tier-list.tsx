"use client";
import React, { useState, useCallback } from "react";
import SelectMap from "@components/SelectMap";
import CoffeeWaiting from "@components/CoffeeWaiting";
import { useDataContext } from "@components/DataProviderContext";
import TierListComponent from "@components/TierListComponent";
import ImageProvider from "@components/ImageProvider";
import { useQuery } from "@tanstack/react-query";

const fetchTierList = async (baseUrl: string, map: string) => {
  const response = await fetch(`${baseUrl}/tier_list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ map }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch tier list");
  }
  return response.json();
};

const TierListPage: React.FC = () => {
  const { brawlers, maps, isLoading: contextLoading, baseUrl } = useDataContext();
  const [selectedMap, setSelectedMap] = useState<string>("");

  const { data: tierData, isLoading, error } = useQuery({
    queryKey: ["tierList", selectedMap],
    queryFn: () => fetchTierList(baseUrl, selectedMap),
    enabled: !!selectedMap, // Fetch only when a map is selected
    staleTime: 24 * 60 * 60 * 1000, // Cache for 1 day
    retry: 2, // Retry on failure
  });

  const handleMapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMap(e.target.value);
  };

  if (contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-300 text-base-content">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4 text-xl font-medium">Brewing your tier list...</p>
      </div>
    );
  }

  return (
    <ImageProvider>
      <main className="container mx-auto p-4">
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body p-4">
            <h1 className="card-title text-xl font-bold text-primary title-font">Brawl Stars Tier List</h1>
            <SelectMap mapsData={maps} selectedMap={selectedMap} handleMapChange={handleMapChange} />
          </div>
        </div>

        {isLoading && selectedMap ? (
          <div className="flex justify-center my-8">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">Error fetching tier list: {error.message}</p>
        ) : selectedMap && tierData?.length > 0 ? (
          <TierListComponent brawlers={brawlers} tierData={tierData} selectedMap={selectedMap} />
        ) : (
          <CoffeeWaiting
            name="tier list"
            description="The tier list will show brawlers ranked by their performance"
          />
        )}
      </main>
    </ImageProvider>
  );
};

export default TierListPage;
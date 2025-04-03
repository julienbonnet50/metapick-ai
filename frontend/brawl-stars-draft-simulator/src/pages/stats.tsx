import React, { useState, useCallback } from "react";
import SelectMap from "@components/SelectMap";
import CoffeeWaiting from "@components/CoffeeWaiting";
import { useDataContext } from "@components/DataProviderContext";
import StatsComponent from "@components/StatsComponent";
import ImageProvider from "@components/ImageProvider";
import { useQuery } from '@tanstack/react-query';


const StatsPage: React.FC = () => {
    const { brawlers, maps, isLoading: contextLoading, baseUrl } = useDataContext();
    
    const [selectedMap, setSelectedMap] = useState<string>("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
        key: 'brawler', 
        direction: 'asc' 
    });
    const [brawlerFilter, setBrawlerFilter] = useState("");
    const [minTotalMatches, setMinTotalMatches] = useState<number>(0);

    // Fetch stats data with React Query
    const fetchStats = useCallback(async (map: string) => {
        const response = await fetch(`${baseUrl}/stats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ map }),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }, [baseUrl]);

    const { 
        data: statsData, 
        isLoading: statsLoading, 
        error 
    } = useQuery({
        queryKey: ['stats', selectedMap],
        queryFn: () => fetchStats(selectedMap),
        staleTime: 24 * 60 * 60 * 1000, // 1 day
        enabled: !!selectedMap, // Only run when selectedMap exists
        retry: 2, // Retry failed requests twice
    });

    const handleMapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMap(e.target.value);
    };

    const handleSort = (key: string) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });
    };

    const sortedStats = () => {
        if (!statsData) return [];

        const sortedData = [...statsData];
        sortedData.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sortedData;
    };

    const handleBrawlerFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBrawlerFilter(e.target.value);
    };

    const filteredStats = sortedStats().filter((stat: any) => {
        const matchesBrawlerFilter = stat.brawler.toLowerCase().includes(brawlerFilter.toLowerCase());
        const matchesMinTotalMatches = stat.total_matches >= minTotalMatches;
        return matchesBrawlerFilter && matchesMinTotalMatches;
    });

    if (contextLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                <p className="mt-4 text-xl">Loading Stats</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <p className="text-xl text-red-500">Error loading stats: {error.message}</p>
            </div>
        );
    }

    return (
        <ImageProvider>
            <main className="container mx-auto p-4">
                <div className="flex items-center justify-between mb-4 space-x-4">
                    <div className="w-1/3">
                        <h1 className="card-title text-xl font-bold text-primary mb-2 title-font">Ranked maps statistics</h1>
                        <SelectMap
                            mapsData={maps}
                            selectedMap={selectedMap}
                            handleMapChange={handleMapChange}
                        />
                    </div>
                    <div className="w-1/3">
                        <input
                            type="text"
                            placeholder="Filter brawlers..."
                            className="input input-bordered w-full"
                            value={brawlerFilter}
                            onChange={handleBrawlerFilterChange}
                        />
                    </div>
                </div>

                {statsLoading && selectedMap ? (
                    <div className="flex justify-center my-8">
                        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                    </div>
                ) : selectedMap ? (
                    <StatsComponent
                        statsData={filteredStats}
                        sortConfig={sortConfig}
                        handleSort={handleSort}
                        brawlers={brawlers}
                    />
                ) : (
                    !contextLoading && (
                        <CoffeeWaiting 
                            name="ranked stats" 
                            description="The 'Stats' will show the raw data of brawlers winRate, useRate, wins and losses per map"
                        />
                    )
                )}
            </main>
        </ImageProvider>
    );
};

export default StatsPage;
"use client"
import ClientLayout from "@components/ClientLayout";
import React, { useState, useEffect } from "react";
import Image from 'next/image';
import SelectMap from "@components/SelectMap";
import { fetchBrawlers, fetchMaps } from "app/utils/api";
import CoffeeWaiting from "@components/CoffeeWaiting";
import { useDataContext } from "@components/DataProviderContext";

const StatsPage: React.FC = () => {
    const { brawlers, maps, isLoading, baseUrl } = useDataContext();
    
    const [statsData, setStatsData] = useState<any>(null);
    const [selectedMap, setSelectedMap] = useState<string>("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'brawler', direction: 'asc' });
    const [brawlerFilter, setBrawlerFilter] = useState("");
    const [minTotalMatches, setMinTotalMatches] = useState<number>(0); // New state for minimum total matches

    const handleMapChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedMapValue = e.target.value;
        setSelectedMap(selectedMapValue);

        if (selectedMapValue) {
            try {
                const response = await fetch(`${baseUrl}/stats`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ map: selectedMapValue }),
                });

                const data = await response.json();
                setStatsData(data);
            } catch (error) {
                console.error("Error fetching tier data:", error);
                setStatsData([]);
            }
        }
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

    const handleMinTotalMatchesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMinTotalMatches(Number(e.target.value));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                <p className="mt-4 text-xl">Loading Stats</p>
            </div>
        );
    }

    const filteredStats = sortedStats().filter((stat: any) => {
        const matchesBrawlerFilter = stat.brawler.toLowerCase().includes(brawlerFilter.toLowerCase());
        const matchesMinTotalMatches = stat.total_matches >= minTotalMatches;
        return matchesBrawlerFilter && matchesMinTotalMatches;
    });

    return (
        <ClientLayout>
            <main className="container mx-auto p-4">
                <div className="flex items-center justify-between mb-4 space-x-4">
                    <div className="w-1/3">
                        <h1 className="card-title text-xl font-bold text-primary mb-2">Ranked maps statistics</h1>
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

                {selectedMap ? (
                    <div className="card bg-base-100 shadow-xl mb-6">
                        <div className="card-body p-4">
                            <h2 className="text-xl font-bold">{selectedMap} Stats</h2>
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th
                                                onClick={() => handleSort('brawler')}
                                                className={`cursor-pointer ${sortConfig.key === 'brawler' ? (sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-red-500') : ''}`}
                                            >
                                                Brawler
                                                {sortConfig.key === 'brawler' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                            </th>
                                            <th
                                                onClick={() => handleSort('wins')}
                                                className={`cursor-pointer ${sortConfig.key === 'wins' ? (sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-red-500') : ''}`}
                                            >
                                                Wins
                                                {sortConfig.key === 'wins' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                            </th>
                                            <th
                                                onClick={() => handleSort('losses')}
                                                className={`cursor-pointer ${sortConfig.key === 'losses' ? (sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-red-500') : ''}`}
                                            >
                                                Losses
                                                {sortConfig.key === 'losses' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                            </th>
                                            <th
                                                onClick={() => handleSort('total_matches')}
                                                className={`cursor-pointer ${sortConfig.key === 'total_matches' ? (sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-red-500') : ''}`}
                                            >
                                                Total Matches
                                                {sortConfig.key === 'total_matches' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                            </th>
                                            <th
                                                onClick={() => handleSort('win_rate')}
                                                className={`cursor-pointer ${sortConfig.key === 'win_rate' ? (sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-red-500') : ''}`}
                                            >
                                                Win Rate
                                                {sortConfig.key === 'win_rate' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                            </th>
                                            <th
                                                onClick={() => handleSort('usage_rate')}
                                                className={`cursor-pointer ${sortConfig.key === 'usage_rate' ? (sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-red-500') : ''}`}
                                            >
                                                Usage Rate
                                                {sortConfig.key === 'usage_rate' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStats.map((stat: any, index: number) => (
                                            <tr key={index}>
                                                {/* Add Brawler Image before Name */}
                                                <td className="flex items-center">
                                                    <Image
                                                        width={20}
                                                        height={20}
                                                        src={brawlers.find((brawler) => brawler.name.toUpperCase() === stat.brawler)?.imageUrl || "/default-image.png"} // Default image fallback
                                                        alt={stat.brawler}
                                                        className="mr-2"
                                                    />
                                                    {stat.brawler}
                                                </td>
                                                <td>{stat.wins}</td>
                                                <td>{stat.losses}</td>
                                                <td>{stat.total_matches}</td>
                                                <td>{(stat.win_rate).toFixed(2)}%</td>
                                                <td>{(stat.usage_rate * 100).toFixed(2)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    !isLoading && (
                        <CoffeeWaiting name="ranked stats" description="The 'Stats' will show the raw data of brawlers winRate, useRate, wins and losses per map "></CoffeeWaiting>
                    )
                )}
            </main>
        </ClientLayout>
    );
};

export default StatsPage;

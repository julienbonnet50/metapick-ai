"use client"
import React, { useEffect, useState } from 'react';
import { useImageCache } from "./ImageProvider";
import CachedImage from "@components/CachedImage";

const StatsComponent: React.FC<StatsComponentProps> = ({ statsData, sortConfig, handleSort, brawlers }) => {

    const { imagesReady, preloadImages } = useImageCache(); // Use the context hook
    const [imagesLoading, setImagesLoading] = useState<boolean>(true);

    // Load from cache on mount
    useEffect(() => {
        const loadInitialData = async () => {
            // Preload brawler images
            const brawlerImages = brawlers.map(brawler => brawler.imageUrl);
        
            // Combine all image sources
            const allImages = [...brawlerImages];
            
            setImagesLoading(true);
            await preloadImages(allImages);
            setImagesLoading(false);
        };
        
        loadInitialData();
    }, [brawlers, preloadImages]);
        
    return (
        <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body p-4">
                <h2 className="text-xl font-bold">{statsData[0]?.mapName} Stats</h2>
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
                            
                            {statsData.map((stat: any, index: number) => (
                                <tr key={index}>
                                    {/* Add Brawler Image before Name */}
                                    <td className="flex items-center">
                                    <CachedImage
                                        key={`${stat.brawler}-${index}`}
                                        width={20}
                                        height={20}
                                        src={
                                            brawlers.find((brawler: any) =>
                                                (brawler.name.toUpperCase() === stat.brawler.toUpperCase() ||
                                                    (stat.brawler === "LARRY & LAWRIE" && brawler.name.toUpperCase() === "LARRY")
                                                ))?.imageUrl || "/default-image.png"
                                        }
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
    );
};

export default StatsComponent;

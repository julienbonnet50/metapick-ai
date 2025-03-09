import React from "react";
import ClientLayout from "@components/ClientLayout";

const Home: React.FC = () => {
  return (
    <main className="container mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold text-primary mb-4">Welcome to Brawl Stars Ranked Stats</h1>
      <p className="text-lg text-gray-700">
        This tool helps you analyze ranked maps statistics, including win rates, usage rates, and more for each brawler.
      </p>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-2">How to Use:</h2>
        <ul className="list-disc text-left text-gray-800 pl-6 space-y-2">
          <li>Navigate to the <strong>Stats</strong> page to see ranked brawler performance.</li>
          <li>Use the <strong>Map Selector</strong> to filter stats based on different maps.</li>
          <li>Sort the table by clicking on column headers (Win Rate, Usage Rate, etc.).</li>
          <li>Filter brawlers using the search bar for quick access.</li>
          <li>Ensure your internet connection is stable for accurate real-time data fetching.</li>
        </ul>
      </div>

      <p className="mt-6 text-gray-600">
        Stay updated with the latest meta and improve your ranked performance!
      </p>
    </main>
  );
};

export default Home;

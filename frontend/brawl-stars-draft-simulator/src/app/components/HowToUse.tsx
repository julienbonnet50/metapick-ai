import React from "react";

const HowToUse: React.FC = () => {
  return (
    <div className="bg-amber-100 p-4 border-b border-amber-200">
      <div className="container mx-auto">
        <h2 className="text-lg font-semibold mb-2 text-amber-900">
          How to Use the <strong>Brawl Stars Draft Tool</strong>
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-amber-800">
          <li>Select the map and game mode you want to play.</li>
          <li>Toggle the "Ban Mode" to choose which brawlers you want to ban. When "Ban Mode" is enabled, you can <strong>left-click</strong> on any brawler to ban them.</li>
          <li>When "Ban Mode" is disabled, <strong>left-click</strong> to add brawlersto your team and <strong>right-click</strong> to add brawlers to the enemy team.</li>
          <li>The tool will suggest optimal picks based on the current meta.</li>
          <li>View team compositions and counter strategies once the drafting is complete.</li>
        </ul>
        <p className="mt-3 text-sm text-amber-700">Your draft score will be evaluated and updated as you modify the picks maps and bans.</p>
      </div>
    </div>
  );
};

export default HowToUse;

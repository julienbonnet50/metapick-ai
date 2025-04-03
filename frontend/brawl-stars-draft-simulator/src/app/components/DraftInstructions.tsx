import React from "react";

interface DraftInstructionsProps {
  title?: string;
  subtitle?: string;
}

const DraftInstructions: React.FC<DraftInstructionsProps> = ({
  title = "Draft Tool Instructions",
  subtitle = "Select a draft to begin"
}) => {
  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body items-center text-center p-8">
        <div className="text-5xl mb-4">🎮</div>
        <h2 className="card-title text-5xl font-bold mb-2 title-font">{title}</h2>
        <p className="text-xl mb-6 title-font">{subtitle}</p>
        
        <div className="divider my-4">How to Use</div>
        
        <div className="flex flex-row gap-12 justify-center w-full">
          {/* Left Click Instruction */}
          <div className="flex flex-col items-center">
            <div className="mb-4">
            <svg className="w-24 h-24" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="30" y="15" width="60" height="90" rx="30" fill="#F0F8FF" stroke="#3B82F6" strokeWidth="4"/>
                <path d="M30 45C30 30 40 15 60 15C50 15 30 20 30 45Z" fill="#3B82F6"/>
                <path d="M30 45V75C30 90 40 105 60 105C80 105 90 90 90 75V45C90 30 80 15 60 15C40 15 30 30 30 45Z" stroke="#3B82F6" strokeWidth="4"/>
                <path d="M60 15V105" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 4"/>
                <rect x="55" y="30" width="10" height="20" rx="5" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2"/>
                <path d="M60 105L60 115" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="40" cy="40" r="8" fill="#3B82F6" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <div className="bg-primary text-primary-content font-bold text-lg px-4 py-2 rounded-lg mb-2">
              Left Click
            </div>
            <p className="text-base">Add a brawler to your team</p>
          </div>
          
          {/* Right Click Instruction */}
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <svg className="w-24 h-24" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="30" y="15" width="60" height="90" rx="30" fill="#F0F8FF" stroke="#EF4444" strokeWidth="4"/>
                <path d="M90 45C90 30 80 15 60 15C70 15 90 20 90 45Z" fill="#EF4444"/>
                <path d="M30 45V75C30 90 40 105 60 105C80 105 90 90 90 75V45C90 30 80 15 60 15C40 15 30 30 30 45Z" stroke="#EF4444" strokeWidth="4"/>
                <path d="M60 15V105" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 4"/>
                <rect x="55" y="30" width="10" height="20" rx="5" fill="#DBEAFE" stroke="#EF4444" strokeWidth="2"/>
                <path d="M60 105L60 115" stroke="#EF4444" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="80" cy="40" r="8" fill="#EF4444" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <div className="bg-error text-error-content font-bold text-lg px-4 py-2 rounded-lg mb-2">
              Right Click
            </div>
            <p className="text-base">Add a brawler to enemy team</p>
          </div>
          
          {/* Toggle Ban Instruction */}
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <svg className="w-24 h-24" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Toggle switch */}
                <rect x="25" y="45" width="70" height="30" rx="15" fill="#E5E7EB" stroke="#4B5563" strokeWidth="4"/>
                <circle cx="85" cy="60" r="18" fill="#4B5563" stroke="#4B5563" strokeWidth="4"/>
                {/* Ban symbol */}
                <circle cx="85" cy="60" r="12" fill="white"/>
                <path d="M78 53L92 67" stroke="#4B5563" strokeWidth="4" strokeLinecap="round"/>
                <path d="M92 53L78 67" stroke="#4B5563" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="bg-neutral text-neutral-content font-bold text-lg px-4 py-2 rounded-lg mb-2">
              Toggle Ban Mode
            </div>
            <p className="text-base">Switch to ban mode to add brawlers to bans</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftInstructions;
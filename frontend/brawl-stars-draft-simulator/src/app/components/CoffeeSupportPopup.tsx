import { useEffect, useState } from "react";

const CoffeeSupportPopup = () => {
  const [isOpen, setIsOpen] = useState(false); // Popup state

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 5000); // Show after 5 sec
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null; // Hide popup if closed

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
      <div className="modal modal-open">
        <div className="modal-box bg-base-200 border border-base-content/20 shadow-lg">
          <h2 className="text-xl font-bold text-center text-base-content">☕ Support Brawl Stars Companion!</h2>
          <p className="py-4 text-center text-base-content/80">
            Love the tools? Help keep this project alive by buying me a coffee!  
            Every contribution fuels updates, new features, and better data insights.  
          </p>
          <div className="modal-action justify-center">
            <a 
              href="https://www.buymeacoffee.com/metapickai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary bg-yellow-600 hover:bg-yellow-700 border-none text-white"
            >
              Buy Me a Coffee ☕
            </a>
            <button 
              className="btn" 
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoffeeSupportPopup;

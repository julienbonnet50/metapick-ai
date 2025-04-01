// components/BottomNavbar.tsx
import Link from "next/link";
import { Home, Info, Coffee } from "lucide-react";

const BottomNavbar = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-100 shadow-lg border-t border-base-300 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-center items-center">
          <div className="flex gap-8 md:gap-16">
            <Link 
              href="/" 
              className="flex flex-col items-center text-primary hover:text-primary-focus transition-colors duration-200"
            >
              <Home size={22} strokeWidth={1.5} />
              <span className="text-xs mt-1 font-medium">Home</span>
            </Link>
            
            <div className="flex items-center mx-2 md:mx-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Coffee size={20} className="text-primary" />
              </div>
            </div>
            
            <Link 
              href="/about" 
              className="flex flex-col items-center text-primary hover:text-primary-focus transition-colors duration-200"
            >
              <Info size={22} strokeWidth={1.5} />
              <span className="text-xs mt-1 font-medium">About</span>
            </Link>
          </div>
        </div>
        
        <div className="text-center mt-2">
          <p className="text-xs text-base-content/60">
            Not affiliated with Supercell
          </p>
        </div>
      </div>
    </div>
  );
};

export default BottomNavbar;
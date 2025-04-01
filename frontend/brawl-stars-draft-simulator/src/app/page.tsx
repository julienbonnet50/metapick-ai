import React from "react";
import { 
  ArrowRight, 
  Trophy, 
  BarChart,  // Changed from ChartBar
  Map, 
  Search, 
  Filter, 
  List, 
  TrendingUp, 
  Wrench,    // Changed from Tool
  Gift, 
  Info 
} from "lucide-react";
import Link from "next/link";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-100">
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Brawl Stars Companion
          </h1>
          <p className="text-lg md:text-xl text-base-content/80 max-w-2xl">
            Your complete toolkit for mastering Brawl Stars - stats, tier lists, draft tools, and more to dominate every match.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link 
              href="/stats" 
              className="btn btn-primary btn-lg"
            >
              Explore Tools <ArrowRight size={18} className="ml-2" />
            </Link>
            <Link 
              href="/about" 
              className="btn btn-outline btn-lg"
            >
              Learn More <Info size={18} className="ml-2" />
            </Link>
          </div>
        </div>

        {/* Feature Cards - now representing all nav links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* Draft Tool */}
          <Link href="/draft-tool" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow hover:border-primary hover:border">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Wrench size={24} className="text-primary" />
                </div>
                <h2 className="card-title ml-3">Draft Tool</h2>
              </div>
              <p className="text-base-content/70">
                Plan your perfect team composition and counter your opponents with our advanced drafting tool.
              </p>
            </div>
          </Link>
          
          {/* Stats */}
          <Link href="/stats" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow hover:border-primary hover:border">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BarChart size={24} className="text-primary" />
                </div>
                <h2 className="card-title ml-3">Stats</h2>
              </div>
              <p className="text-base-content/70">
                Comprehensive win rates, pick rates, and performance metrics for all brawlers.
              </p>
            </div>
          </Link>
          
          {/* Tier List */}
          <Link href="/tier-list" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow hover:border-primary hover:border">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <List size={24} className="text-primary" />
                </div>
                <h2 className="card-title ml-3">Tier List</h2>
              </div>
              <p className="text-base-content/70">
                Updated tier rankings based on current meta and competitive play.
              </p>
            </div>
          </Link>
          
          {/* Upgrade Helper */}
          <Link href="/upgrade-helper" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow hover:border-primary hover:border">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <TrendingUp size={24} className="text-primary" />
                </div>
                <h2 className="card-title ml-3">Upgrade Helper</h2>
              </div>
              <p className="text-base-content/70">
                Optimize your resource spending with smart upgrade recommendations.
              </p>
            </div>
          </Link>
          
          {/* About */}
          <Link href="/about" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow hover:border-primary hover:border">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Info size={24} className="text-primary" />
                </div>
                <h2 className="card-title ml-3">About</h2>
              </div>
              <p className="text-base-content/70">
                Learn more about our project, data sources, and how to contribute.
              </p>
            </div>
          </Link>
        </div>
        
        {/* How to Use Section */}
        <div className="card bg-base-100 shadow-lg mb-16">
          <div className="card-body">
            <h2 className="text-2xl font-bold text-center mb-6">Why Use Our Tools?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  <Trophy size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Competitive Advantage</h3>
                  <p className="text-base-content/70">
                    Gain insights that give you an edge in ranked matches and tournaments.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  <Map size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Map-Specific Strategies</h3>
                  <p className="text-base-content/70">
                    Tailor your brawler picks and strategies to each map's unique characteristics.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  <Wrench size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Draft Optimization</h3>
                  <p className="text-base-content/70">
                    Make informed decisions during the draft phase to counter enemy picks.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  <TrendingUp size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Resource Management</h3>
                  <p className="text-base-content/70">
                    Spend your coins, power points, and gems most effectively with our upgrade helper.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center bg-base-200 rounded-xl p-8 shadow-inner">
          <h2 className="text-2xl font-bold mb-4">Start Improving Today</h2>
          <p className="text-base-content/70 max-w-lg mx-auto mb-6">
            Whether you're a casual player or competitive enthusiast, our tools will help you reach the next level.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/draft-tool" className="btn btn-primary">
              Try Draft Tool
            </Link>
            <Link href="/tier-list" className="btn btn-outline">
              View Tier List
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
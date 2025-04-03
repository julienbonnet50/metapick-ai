"use client";

import React from "react";
import { BarChart, User, Mail, Heart, DatabaseZap } from "lucide-react";
import Link from "next/link";
import CoffeeSupportPopup from "@components/CoffeeSupportPopup";

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-100">
      <CoffeeSupportPopup />
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 title-font">
            About Brawl Stars Companion
          </h1>
          <p className="text-lg md:text-xl max-w-2xl">
            The one-player passion project bringing data insights to the Brawl Stars community
          </p>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Creator Card */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <User size={24} className="text-primary" />
                </div>
                <h2 className="card-title ml-3 title-font">The Creator</h2>
              </div>
              <p className="">
                Hi! I'm a passionate Brawl Stars player and data engineer who loves building tools that combine
                gaming with data analytics. What started as a personal project to improve my own gameplay
                evolved into this full suite of tools for the entire community.
              </p>
            </div>
          </div>

          {/* Data Approach Card */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <DatabaseZap size={24} className="text-primary" />
                </div>
                <h2 className="card-title ml-3 title-font">Data-Driven Design</h2>
              </div>
              <p className="">
                Leveraging my professional data engineering skills, I've built systems that analyze thousands
                of matches to surface meaningful insights. All tools are designed to help players make
                better decisions based on actual game data rather than just intuition.
              </p>
            </div>
          </div>

          {/* How It Works Card */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BarChart size={24} className="text-primary" />
                </div>
                <h2 className="card-title ml-3 title-font">How It Works</h2>
              </div>
              <p className="">
                The tools process statistical data from Mythic+ ranked games to calculate win rates,
                synergies, and counter-picks. Regular updates ensure the information stays current with
                the latest meta changes and balance updates.
              </p>
            </div>
          </div>

          {/* Contact Card */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Mail size={24} className="text-primary" />
                </div>
                <h2 className="card-title ml-3 title-font">Get In Touch</h2>
              </div>
              <p className=" mb-4">
                Have suggestions, found a bug, or want to collaborate? I'd love to hear from you!
              </p>
              <Link
                href="mailto:samamelif50@gmail.com"
                className="btn btn-outline btn-sm"
              >
                Email Me <Mail size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* Credits Section */}
        <div className="card bg-base-100 shadow-lg mb-16">
          <div className="card-body">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Heart size={24} className="text-primary" />
              </div>
              <h2 className="card-title ml-3 title-font">About This Project</h2>
            </div>
            <p className="">
              This is a passion project built to help the Brawl Stars community. While I work on this alone,
              I'm incredibly grateful for all the players who provide feedback and help test new features.
            </p>
            <div className="divider"></div>
            <p className="text-sm /70">
              Brawl Stars is a trademark of Supercell. This site is not affiliated with Supercell.
              All game data is collected through public APIs and community contributions.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-base-200 rounded-xl p-8 shadow-inner">
          <h2 className="text-2xl font-bold mb-4 title-font">Try the Tools Yourself</h2>
          <p className=" max-w-lg mx-auto mb-6">
            All tools are completely free to use - my gift to the Brawl Stars community.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/draft-tool" className="btn btn-primary">
              Start Drafting
            </Link>
            <Link href="/stats" className="btn btn-outline">
              Explore Stats
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
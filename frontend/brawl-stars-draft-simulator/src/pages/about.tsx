"use client";
import ClientLayout from "@components/ClientLayout";
import React from "react";

const AboutPage: React.FC = () => {
  return (
    <ClientLayout>
      <main className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-4xl font-extrabold text-center mb-8">About Brawl Stars Draft Tool</h1>

        <div className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 p-8 rounded-2xl shadow-xl space-y-8">
          <section className="space-y-4">
            <h2 className="text-3xl font-semibold text-indigo-900">Our Mission</h2>
            <p className="text-lg text-gray-800 leading-relaxed">
              The Brawl Stars Draft Tool was created to help players make better decisions during the draft phase
              of competitive matches. By analyzing thousands of high-level matches, we provide data-driven
              recommendations for bans, picks, and counter-picks.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-semibold text-indigo-900">How It Works</h2>
            <p className="text-lg text-gray-800 leading-relaxed">
              Our tool uses machine learning algorithms trained on Mythic+ ranked games to calculate win rates,
              synergies, and counter-picks. We update our data regularly to keep up with the latest meta changes
              and game updates.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-semibold text-indigo-900">Contact</h2>
            <p className="text-lg text-gray-800 leading-relaxed">
              Have suggestions or feedback? We'd love to hear from you! Reach out to us at:
            </p>
            <a
              href="mailto:notconfigured@gmail.com"
              className="text-xl text-blue-500 hover:text-blue-700 transition duration-300"
            >
              notconfigured@gmail.com
            </a>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-semibold text-indigo-900">Credits</h2>
            <p className="text-lg text-gray-800 leading-relaxed">
              This tool was created by passionate Brawl Stars players for the community. Special thanks to all the
              contributors and testers who helped make this tool possible.
            </p>
            <p className="mt-2 text-gray-500 text-sm">
              Brawl Stars is a trademark of Supercell. This site is not affiliated with Supercell.
            </p>
          </section>
        </div>
      </main>
    </ClientLayout>
  );
};

export default AboutPage;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.brawlify.com",
        pathname: "/brawlers/borders/*", // Allow images from this external domain
      },
    ],
  },
  experimental: {
    turbo: false, // Disable Turbopack to avoid Webpack conflict
  },
  webpack: (config) => {
    config.resolve.alias["react-server-dom-webpack/server.edge"] = require.resolve(
      "react-server-dom-webpack/server.edge"
    );
    return config;
  },
};

module.exports = nextConfig;

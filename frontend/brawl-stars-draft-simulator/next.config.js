// next.config.js
module.exports = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'cdn.brawlify.com', // External domain
          pathname: '/brawlers/borders/*', // Optional, specify path pattern if needed
        },
      ],
    },
  };
  
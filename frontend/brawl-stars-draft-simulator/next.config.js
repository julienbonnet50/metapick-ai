/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.brawlify.com", // Allow all images from this domain
      },
    ],
  },
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.discordapp.com', 'media.discordapp.net'],
  },
  // Add this:
  output: undefined,
  distDir: '.next',
}

module.exports = nextConfig
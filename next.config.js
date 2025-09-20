/** @type {import('next').NextConfig} */
const { version } = require('./package.json');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  publicRuntimeConfig: {
   version,
 },
 // Disable telemetry
 telemetry: false,
};

module.exports = nextConfig;

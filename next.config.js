/** @type {import('next').NextConfig} */
const { version } = require('./package.json');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  output: 'standalone',
  publicRuntimeConfig: {
   version,
 },
};

module.exports = nextConfig;

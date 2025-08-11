/** @type {import('next').NextConfig} */
const { version } = require('./package.json');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  publicRuntimeConfig: {
   version
 }
};

module.exports = nextConfig;

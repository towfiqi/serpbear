// Built with webpack (`next build --webpack` in package.json), not Turbopack.
// Turbopack always compiles class fields with define semantics: on the
// sequelize-typescript models they shadow the attribute accessors Sequelize
// installs, so reads come back undefined and assignments never reach the
// database. Webpack follows useDefineForClassFields: false from tsconfig.
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
};

module.exports = nextConfig;

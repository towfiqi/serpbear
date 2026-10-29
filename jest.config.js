const nextJest = require('next/jest');
require('dotenv').config({ path: './.env.local' });

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  // jsdom resolves the "browser" export condition, which points msw at its
  // untranspiled TypeScript sources. Clearing the condition selects the
  // published CommonJS build instead.
  testEnvironmentOptions: { customExportConditions: [''] },
};

// msw and several of its dependencies ship ESM only. next/jest prepends a blunt
// `/node_modules/` rule, and a file skipped by ANY pattern stays untransformed —
// so the list has to be replaced after next/jest has built the config, not merged
// into customJestConfig.
const ESM_DEPENDENCIES = [
  'rettime',
  '@open-draft',
  'msw',
  '@mswjs',
  'until-async',
  '@bundled-es-modules',
  'strict-event-emitter',
  'outvariant',
  'is-node-process',
  'headers-polyfill',
  'graphql',
  'tough-cookie',
  'universal-cookie',
];

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async

module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  config.transformIgnorePatterns = [
    `/node_modules/(?!(${ESM_DEPENDENCIES.join('|')})/)`,
    '^.+\\.module\\.(css|sass|scss)$',
  ];
  return config;
};

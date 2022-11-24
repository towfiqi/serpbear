// eslint-disable-next-line no-unused-vars
import 'isomorphic-fetch';
import './styles/globals.css';
// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

global.ResizeObserver = require('resize-observer-polyfill');

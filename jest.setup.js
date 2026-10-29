// eslint-disable-next-line no-unused-vars
import { TextDecoder, TextEncoder } from 'util';
import { BroadcastChannel, MessageChannel, MessagePort } from 'worker_threads';
import { ReadableStream, TransformStream, WritableStream } from 'stream/web';

// jsdom provides none of these Web APIs, yet msw reaches for them at import
// time, and undici (pulled in by cheerio) needs MessagePort. Without them the
// suites that import the request mocks or the scraper die before a single test
// runs.
const webGlobals = { TextEncoder, TextDecoder, BroadcastChannel, MessageChannel, MessagePort, ReadableStream, TransformStream, WritableStream };
Object.entries(webGlobals).forEach(([name, value]) => {
   if (typeof global[name] === 'undefined') { global[name] = value; }
});

// eslint-disable-next-line no-unused-vars
import 'isomorphic-fetch';
import './styles/globals.css';
import '@testing-library/jest-dom';
import { enableFetchMocks } from 'jest-fetch-mock';
// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom

window.matchMedia = (query) => ({
   matches: false,
   media: query,
   onchange: null,
   addListener: jest.fn(), // deprecated
   removeListener: jest.fn(), // deprecated
   addEventListener: jest.fn(),
   removeEventListener: jest.fn(),
   dispatchEvent: jest.fn(),
});

global.ResizeObserver = require('resize-observer-polyfill');

// Enable Fetch Mocking
enableFetchMocks();

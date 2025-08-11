// eslint-disable-next-line no-unused-vars
import 'isomorphic-fetch';
import './styles/globals.css';
import '@testing-library/jest-dom';
import { enableFetchMocks } from 'jest-fetch-mock';
import { TextEncoder, TextDecoder } from 'util';
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

// polyfill TextEncoder/TextDecoder for msw
if (typeof global.TextEncoder === 'undefined') {
   global.TextEncoder = TextEncoder;
   global.TextDecoder = TextDecoder;
}

// polyfill BroadcastChannel for msw
if (typeof global.BroadcastChannel === 'undefined') {
   class BroadcastChannelMock {
      constructor(name) {
         this.name = name;
         this.messages = [];
      }

      postMessage(message) {
         this.messages.push(message);
      }

      close() {
         this.messages = [];
      }

      addEventListener() {
         return this;
      }

      removeEventListener() {
         return this;
      }
   }
   global.BroadcastChannel = BroadcastChannelMock;
}

// Enable Fetch Mocking
enableFetchMocks();

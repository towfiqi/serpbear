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
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

class BroadcastChannel {
    constructor(name) {
        this.name = name;
        this.listeners = {};
    }

    addEventListener(name, callback) {
        if (!this.listeners[name]) {
            this.listeners[name] = [];
        }
        this.listeners[name].push(callback);
    }

    removeEventListener(name, callback) {
        if (this.listeners[name]) {
            this.listeners[name] = this.listeners[name].filter(cb => cb !== callback);
        }
    }

    postMessage(message) {
        if (this.listeners.message) {
            this.listeners.message.forEach(callback => {
                callback({ data: message });
            });
        }
    }

    close() {
        this.listeners = {};
    }
}

global.BroadcastChannel = BroadcastChannel;

// Enable Fetch Mocking
enableFetchMocks();

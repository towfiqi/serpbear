import './styles/globals.css';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { ReadableStream, WritableStream, TransformStream } = require('stream/web');

if (!global.ReadableStream) {
   global.ReadableStream = ReadableStream;
}
if (!global.WritableStream) {
   global.WritableStream = WritableStream;
}
if (!global.TransformStream) {
   global.TransformStream = TransformStream;
}

const { fetch: undiciFetch, Headers, Request, Response } = require('undici');
// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom

if (typeof window !== 'undefined') {
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

   const locationMock = {
      hash: '',
      host: 'localhost',
      hostname: 'localhost',
      href: 'http://localhost/',
      origin: 'http://localhost',
      pathname: '/',
      port: '',
      protocol: 'http:',
      search: '',
      assign: jest.fn((value) => { locationMock.href = value; }),
      replace: jest.fn((value) => { locationMock.href = value; }),
      reload: jest.fn(),
      toString: () => locationMock.href,
   };

   Object.defineProperty(window, 'location', {
      configurable: true,
      value: locationMock,
   });
}

global.ResizeObserver = require('resize-observer-polyfill');

if (!global.fetch) {
   global.fetch = undiciFetch;
}
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

// polyfill BroadcastChannel for msw
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

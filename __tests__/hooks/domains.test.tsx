import { renderHook, waitFor } from '@testing-library/react';
import mockRouter from 'next-router-mock';

import { useFetchDomains } from '../../services/domains';
import { createWrapper } from '../../__mocks__/utils';
import { dummyDomain } from '../../__mocks__/data';

const originalFetch = global.fetch;
const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit | undefined]>();

const asUrlString = (input: RequestInfo | URL): string => {
   if (typeof input === 'string') return input;
   if (input instanceof URL) return input.toString();
   if (typeof (input as Request).url === 'string') return (input as Request).url;
   return String(input);
};

function createJsonResponse<T>(payload: T, status = 200): Response {
   return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
   } as unknown as Response;
}

jest.mock('next/router', () => jest.requireActual('next-router-mock'));

beforeAll(() => {
   global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
   global.fetch = originalFetch;
});

beforeEach(() => {
   fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = asUrlString(input);
      if (url.startsWith(`${window.location.origin}/api/domains`)) {
         return createJsonResponse({ domains: [dummyDomain] });
      }
      throw new Error(`Unhandled fetch request: ${url}`);
   });
});

afterEach(() => {
   fetchMock.mockReset();
});

describe('DomainHooks', () => {
   it('useFetchDomains should fetch the Domains', async () => {
      const { result } = renderHook(() => useFetchDomains(mockRouter, false), { wrapper: createWrapper() });
      // const result = { current: { isSuccess: false, data: '' } };
      await waitFor(() => {
         return expect(result.current.isLoading).toBe(false);
      });
   });
});

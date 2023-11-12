import { renderHook, waitFor } from '@testing-library/react';
import mockRouter from 'next-router-mock';

import { useFetchDomains } from '../../services/domains';
import { createWrapper } from '../../__mocks__/utils';
import { dummyDomain } from '../../__mocks__/data';

jest.mock('next/router', () => jest.requireActual('next-router-mock'));

fetchMock.mockIf(`${window.location.origin}/api/domains`, async () => {
   return new Promise((resolve) => {
      resolve({
         body: JSON.stringify({ domains: [dummyDomain] }),
         status: 200,
      });
   });
});

describe('DomainHooks', () => {
   it('useFetchDomains should fetch the Domains', async () => {
      const { result } = renderHook(() => useFetchDomains(mockRouter), { wrapper: createWrapper() });
      // const result = { current: { isSuccess: false, data: '' } };
      await waitFor(() => {
         return expect(result.current.isLoading).toBe(false);
      });
   });
});

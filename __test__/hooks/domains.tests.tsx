import { waitFor } from '@testing-library/react';
// import { useFetchDomains } from '../../services/domains';
// import { createWrapper } from '../utils';

jest.mock('next/router', () => ({
   useRouter: () => ({
     query: { slug: 'compressimage-io' },
     push: (link:string) => { console.log('Pushed', link); },
   }),
}));

describe('DomainHooks', () => {
   it('useFetchDomains should fetch the Domains', async () => {
      // const { result } = renderHook(() => useFetchDomains(), { wrapper: createWrapper() });
      const result = { current: { isSuccess: false, data: '' } };
      await waitFor(() => {
         console.log('result.current: ', result.current.data);
         return expect(result.current.isSuccess).toBe(true);
      });
   });
});

import * as ReactQuery from 'react-query';
import { useFetchKeywordIdeas } from '../../services/adwords';

jest.mock('react-query', () => {
   const actual = jest.requireActual('react-query');
   return {
      ...actual,
      useQuery: jest.fn(),
   };
});

describe('useFetchKeywordIdeas', () => {
   const useQueryMock = ReactQuery.useQuery as jest.Mock;

   beforeEach(() => {
      fetchMock.resetMocks();
      useQueryMock.mockReset();
   });

   it('uses decoded domain in /api/ideas request from route slug', async () => {
      useQueryMock.mockImplementation((queryKey, queryFn, options) => ({ queryKey, queryFn, options }));

      const router = {
         pathname: '/domain/ideas/[slug]',
         query: { slug: 'x_y-com' },
         push: jest.fn(),
      } as any;

      const queryResult = useFetchKeywordIdeas(router, true) as { queryFn: () => Promise<any> };

      expect(useQueryMock).toHaveBeenCalledWith(
         'keywordIdeas-x-y.com',
         expect.any(Function),
         expect.objectContaining({ enabled: true, retry: false }),
      );

      fetchMock.mockResponseOnce(JSON.stringify({ data: { keywords: [] } }), { status: 200 });
      await queryResult.queryFn();

      expect(fetchMock).toHaveBeenCalledWith(
         `${window.location.origin}/api/ideas?domain=x-y.com`,
         { method: 'GET' },
      );
   });
});

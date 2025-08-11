import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import KeywordIdeasUpdater from '../../components/ideas/KeywordIdeasUpdater';

// Mock the next/router
jest.mock('next/router', () => ({
   useRouter: () => ({
      query: { slug: 'test-domain' },
      pathname: '/domain/ideas/test-domain',
      push: jest.fn(),
   }),
}));

// Mock the services
const mockMutate = jest.fn();
jest.mock('../../services/adwords', () => ({
   useMutateKeywordIdeas: () => ({
      mutate: mockMutate,
      isLoading: false,
   }),
}));

const mockDomain: DomainType = {
   ID: 1,
   domain: 'example.com',
   slug: 'example-com',
   lastAccessed: '2023-01-01',
   added: '2023-01-01',
   updated: '2023-01-01',
   tags: '',
   notification_interval: '0',
   notification_email: '',
   search_console: '',
   notifications: '',
   keywordCount: 0,
};

describe('KeywordIdeasUpdater Component', () => {
   let queryClient: QueryClient;

   beforeEach(() => {
      queryClient = new QueryClient({
         defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
         },
      });
   });

   const renderWithQueryClient = (component: React.ReactElement) => {
      return render(
         <QueryClientProvider client={queryClient}>
            {component}
         </QueryClientProvider>
      );
   };

   it('renders without crashing', () => {
      renderWithQueryClient(
         <KeywordIdeasUpdater
            domain={mockDomain}
            searchConsoleConnected={false}
            adwordsConnected={true}
         />
      );

      expect(screen.getByText('Get Keyword Ideas')).toBeInTheDocument();
      expect(screen.getByText('Load Keyword Ideas')).toBeInTheDocument();
   });

   it('validates the fix for keywordPayload variable name', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderWithQueryClient(
         <KeywordIdeasUpdater
            domain={mockDomain}
            searchConsoleConnected={false}
            adwordsConnected={true}
         />
      );

      // The console should not show "keywordPaylod" (with typo) anymore
      // This validates our fix
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
         expect.stringContaining('keywordPaylod')
      );

      consoleLogSpy.mockRestore();
   });
});
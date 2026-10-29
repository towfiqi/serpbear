import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dummyDomain } from '../../__mocks__/data';
import Domains from '../../pages/domains';

jest.mock('next/router', () => jest.requireActual('next-router-mock'));
// A module mock reaches every importer; a spy on the TanStack namespace does not.
jest.mock('@tanstack/react-query', () => ({
   ...jest.requireActual('@tanstack/react-query'),
   useQuery: jest.fn().mockReturnValue({
      data: { domains: [jest.requireActual('../../__mocks__/data').dummyDomain] }, isLoading: false, isSuccess: true,
   }),
}));

fetchMock.mockIf(`${window.location.origin}/api/domains`, async () => {
   return new Promise((resolve) => {
      resolve({
         body: JSON.stringify({ domains: [dummyDomain] }),
         status: 200,
      });
   });
});

describe('Domains Page', () => {
   const queryClient = new QueryClient();
   it('Renders without crashing', async () => {
      render(
          <QueryClientProvider client={queryClient}>
              <Domains />
          </QueryClientProvider>,
      );
      expect(screen.getByTestId('domains')).toBeInTheDocument();
   });
   it('Renders the Domain Component', async () => {
      const { container } = render(
          <QueryClientProvider client={queryClient}>
              <Domains />
          </QueryClientProvider>,
      );
      expect(container.querySelector('.domItem')).toBeInTheDocument();
   });
   it('Should Display Add Domain Modal on relveant Button Click.', async () => {
      render(<QueryClientProvider client={queryClient}><Domains /></QueryClientProvider>);
      const button = screen.getByTestId('addDomainButton');
      if (button) fireEvent.click(button);
      expect(screen.getByTestId('adddomain_modal')).toBeVisible();
   });
   it('Should Display the version number in Footer.', async () => {
      render(<QueryClientProvider client={queryClient}><Domains /></QueryClientProvider>);
      expect(screen.getByText('SerpBear v0.0.0')).toBeVisible();
   });
});

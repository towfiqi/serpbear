import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import * as ReactQuery from 'react-query';
import { dummyDomain } from '../../__mocks__/data';
import Domains from '../../pages/domains';

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
jest.spyOn(ReactQuery, 'useQuery').mockImplementation(jest.fn().mockReturnValue(
   { data: { domains: [dummyDomain] }, isLoading: false, isSuccess: true },
));

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

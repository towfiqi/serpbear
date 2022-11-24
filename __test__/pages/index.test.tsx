import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import Home from '../../pages/index';

describe('Home Page', () => {
   const queryClient = new QueryClient();
   it('Renders without crashing', async () => {
      // const dummyDomain = {
      //    ID: 1,
      //    domain: 'compressimage.io',
      //    slug: 'compressimage-io',
      //    keywordCount: 0,
      //    lastUpdated: '2022-11-11T10:00:32.243',
      //    added: '2022-11-11T10:00:32.244',
      //    tags: [],
      //    notification: true,
      //    notification_interval: 'daily',
      //    notification_emails: '',
      // };
      render(
          <QueryClientProvider client={queryClient}>
              <Home />
          </QueryClientProvider>,
      );
      // console.log(prettyDOM(renderer.container.firstChild));
      expect(await screen.findByRole('main')).toBeInTheDocument();
      expect(screen.queryByText('Add Domain')).not.toBeInTheDocument();
   });
   it('Should Display the Add Domain Modal when there are no Domains.', async () => {
       render(
           <QueryClientProvider client={queryClient}>
               <Home />
           </QueryClientProvider>,
       );
       expect(await screen.findByText('Add Domain')).toBeInTheDocument();
   });
});

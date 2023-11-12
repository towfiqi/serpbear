import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import Home from '../../pages/index';

const routerPush = jest.fn();
jest.mock('next/router', () => ({
   useRouter: () => ({
      push: routerPush,
   }),
}));

describe('Home Page', () => {
   const queryClient = new QueryClient();
   it('Renders without crashing', async () => {
      render(
          <QueryClientProvider client={queryClient}>
              <Home />
          </QueryClientProvider>,
      );
      // console.log(prettyDOM(renderer.container.firstChild));
      expect(await screen.findByRole('main')).toBeInTheDocument();
      expect(screen.queryByText('Add Domain')).not.toBeInTheDocument();
   });
   it('Should redirect to /domains route.', async () => {
       render(
           <QueryClientProvider client={queryClient}>
               <Home />
           </QueryClientProvider>,
       );
       expect(routerPush).toHaveBeenCalledWith('/domains');
   });
});

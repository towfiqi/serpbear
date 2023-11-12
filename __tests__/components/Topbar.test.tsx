import { render, screen } from '@testing-library/react';
import TopBar from '../../components/common/TopBar';

jest.mock('next/router', () => ({
   useRouter: () => ({
      pathname: '/',
   }),
}));

describe('TopBar Component', () => {
   it('renders without crashing', async () => {
       render(<TopBar showSettings={jest.fn} showAddModal={jest.fn} />);
       expect(
           await screen.findByText('SerpBear'),
       ).toBeInTheDocument();
   });
});

import { render, screen } from '@testing-library/react';
import TopBar from '../../components/common/TopBar';

describe('TopBar Component', () => {
   it('renders without crashing', async () => {
       render(<TopBar showSettings={() => console.log() } />);
       expect(
           await screen.findByText('SerpBear'),
       ).toBeInTheDocument();
   });
});

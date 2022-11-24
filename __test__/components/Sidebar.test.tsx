import { render, screen } from '@testing-library/react';
import Sidebar from '../../components/common/Sidebar';

describe('Sidebar Component', () => {
   it('renders without crashing', async () => {
       render(<Sidebar domains={[]} showAddModal={() => console.log() } />);
       expect(
           await screen.findByText('SerpBear'),
       ).toBeInTheDocument();
   });
});

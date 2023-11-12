import { fireEvent, render, screen } from '@testing-library/react';
import Sidebar from '../../components/common/Sidebar';
import { dummyDomain } from '../../__mocks__/data';

const addDomainMock = jest.fn();
jest.mock('next/router', () => jest.requireActual('next-router-mock'));

describe('Sidebar Component', () => {
   it('renders without crashing', async () => {
       render(<Sidebar domains={[dummyDomain]} showAddModal={addDomainMock} />);
       expect(screen.getByText('SerpBear')).toBeInTheDocument();
   });
   it('renders domain list', async () => {
      render(<Sidebar domains={[dummyDomain]} showAddModal={addDomainMock} />);
      expect(screen.getByText('compressimage.io')).toBeInTheDocument();
   });
   it('calls showAddModal on Add Domain button click', async () => {
      render(<Sidebar domains={[dummyDomain]} showAddModal={addDomainMock} />);
      const addDomainBtn = screen.getByTestId('add_domain');
      fireEvent.click(addDomainBtn);
      expect(addDomainMock).toHaveBeenCalledWith(true);
   });
});

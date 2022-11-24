import { render, screen } from '@testing-library/react';
import React from 'react';
import Modal from '../../components/common/Modal';

// jest.mock('React', () => ({
//    ...jest.requireActual('React'),
//    useEffect: jest.fn(),
// }));
// const mockedUseEffect = useEffect as jest.Mock<any>;

// jest.mock('../../components/common/Icon', () => () => <div data-testid="icon"/>);

describe('Modal Component', () => {
   it('Renders without crashing', async () => {
       render(<Modal closeModal={() => console.log() }><div></div></Modal>);
      //  mockedUseEffect.mock.calls[0]();
       expect(document.querySelector('.modal')).toBeInTheDocument();
   });
//    it('Sets up the escapae key shortcut', async () => {
//       render(<Modal closeModal={() => console.log() }><div></div></Modal>);
//       expect(mockedUseEffect).toBeCalled();
//   });
   it('Displays the Given Content', async () => {
      render(<Modal closeModal={() => console.log() }>
        <div>
           <h1>Hello Modal!!</h1>
        </div>
      </Modal>);
      expect(await screen.findByText('Hello Modal!!')).toBeInTheDocument();
   });
   it('Renders Modal Title', async () => {
      render(<Modal closeModal={() => console.log() } title="Sample Modal Title"><p>Some Modal Content</p></Modal>);
      expect(await screen.findByText('Sample Modal Title')).toBeInTheDocument();
   });
});

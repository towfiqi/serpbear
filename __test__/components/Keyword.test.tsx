import { fireEvent, render, screen } from '@testing-library/react';
import Keyword from '../../components/keywords/Keyword';
import { dummyKeywords } from '../data';

const keywordFunctions = {
   refreshkeyword: jest.fn(),
   favoriteKeyword: jest.fn(),
   removeKeyword: jest.fn(),
   selectKeyword: jest.fn(),
   manageTags: jest.fn(),
   showKeywordDetails: jest.fn(),
};

describe('Keyword Component', () => {
   it('renders without crashing', async () => {
       render(<Keyword keywordData={dummyKeywords[0]} {...keywordFunctions} selected={false} />);
       expect(await screen.findByText('compress image')).toBeInTheDocument();
   });
   it('Should Render Position Correctly', async () => {
      render(<Keyword keywordData={dummyKeywords[0]} {...keywordFunctions} selected={false} />);
      const positionElement = document.querySelector('.keyword_position');
      expect(positionElement?.childNodes[0].nodeValue).toBe('19');
   });
   it('Should Display Position Change arrow', async () => {
      render(<Keyword keywordData={dummyKeywords[0]} {...keywordFunctions} selected={false} />);
      const positionElement = document.querySelector('.keyword_position i');
      expect(positionElement?.textContent).toBe('▲ 1');
   });
   it('Should Display the SERP Page URL', async () => {
      render(<Keyword keywordData={dummyKeywords[0]} {...keywordFunctions} selected={false} />);
      const positionElement = document.querySelector('.keyword_url');
      expect(positionElement?.textContent).toBe('/');
   });
   it('Should Display the Keyword Options on dots Click', async () => {
      render(<Keyword keywordData={dummyKeywords[0]} {...keywordFunctions} selected={false} />);
      const button = document.querySelector('.keyword .keyword_dots');
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
      expect(document.querySelector('.keyword_options')).toBeVisible();
   });
   // it('Should favorite Keywords', async () => {
   //    render(<Keyword keywordData={dummyKeywords[0]} {...keywordFunctions} selected={false} />);
   //    const button = document.querySelector('.keyword .keyword_dots');
   //    if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
   //    const option = document.querySelector('.keyword .keyword_options li:nth-child(1) a');
   //    if (option) fireEvent(option, new MouseEvent('click', { bubbles: true }));
   //    const { favoriteKeyword } = keywordFunctions;
   //    expect(favoriteKeyword).toHaveBeenCalled();
   // });
});

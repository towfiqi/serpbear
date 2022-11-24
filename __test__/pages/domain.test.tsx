import { fireEvent, render, screen } from '@testing-library/react';
import SingleDomain from '../../pages/domain/[slug]';
import { useAddDomain, useDeleteDomain, useFetchDomains, useUpdateDomain } from '../../services/domains';
import { useAddKeywords, useDeleteKeywords, useFavKeywords, useFetchKeywords, useRefreshKeywords } from '../../services/keywords';
import { dummyDomain, dummyKeywords } from '../data';

jest.mock('../../services/domains');
jest.mock('../../services/keywords');
jest.mock('next/router', () => ({
   useRouter: () => ({
     query: { slug: dummyDomain.slug },
   }),
}));

const useFetchDomainsFunc = useFetchDomains as jest.Mock<any>;
const useFetchKeywordsFunc = useFetchKeywords as jest.Mock<any>;
const useDeleteKeywordsFunc = useDeleteKeywords as jest.Mock<any>;
const useFavKeywordsFunc = useFavKeywords as jest.Mock<any>;
const useRefreshKeywordsFunc = useRefreshKeywords as jest.Mock<any>;
const useAddDomainFunc = useAddDomain as jest.Mock<any>;
const useAddKeywordsFunc = useAddKeywords as jest.Mock<any>;
const useUpdateDomainFunc = useUpdateDomain as jest.Mock<any>;
const useDeleteDomainFunc = useDeleteDomain as jest.Mock<any>;

describe('SingleDomain Page', () => {
   beforeEach(() => {
      useFetchDomainsFunc.mockImplementation(() => ({ data: { domains: [dummyDomain] }, isLoading: false }));
      useFetchKeywordsFunc.mockImplementation(() => ({ keywordsData: { keywords: dummyKeywords }, keywordsLoading: false }));
      useDeleteKeywordsFunc.mockImplementation(() => ({ mutate: () => { } }));
      useFavKeywordsFunc.mockImplementation(() => ({ mutate: () => { } }));
      useRefreshKeywordsFunc.mockImplementation(() => ({ mutate: () => { } }));
      useAddDomainFunc.mockImplementation(() => ({ mutate: () => { } }));
      useAddKeywordsFunc.mockImplementation(() => ({ mutate: () => { } }));
      useUpdateDomainFunc.mockImplementation(() => ({ mutate: () => { } }));
      useDeleteDomainFunc.mockImplementation(() => ({ mutate: () => { } }));
   });
   afterEach(() => {
      jest.clearAllMocks();
   });
   it('Render without crashing.', async () => {
      const { getByTestId } = render(<SingleDomain />);
      // screen.debug(undefined, Infinity);
      expect(getByTestId('domain-header')).toBeInTheDocument();
      // expect(await result.findByText(/compressimage/i)).toBeInTheDocument();
   });
   it('Should Call the useFetchDomains hook on render.', async () => {
      render(<SingleDomain />);
      // screen.debug(undefined, Infinity);
      expect(useFetchDomains).toHaveBeenCalled();
      // expect(await result.findByText(/compressimage/i)).toBeInTheDocument();
   });
   it('Should Render the Keywords', async () => {
      render(<SingleDomain />);
      const keywordsCount = document.querySelectorAll('.keyword').length;
      expect(keywordsCount).toBe(2);
   });
   it('Should Display the Keywords Details Sidebar on Keyword Click.', async () => {
      render(<SingleDomain />);
      const keywords = document.querySelectorAll('.keyword');
      const firstKeyword = keywords && keywords[0].querySelector('a');
      if (firstKeyword) fireEvent(firstKeyword, new MouseEvent('click', { bubbles: true }));
      expect(screen.getByTestId('keywordDetails')).toBeVisible();
   });
   it('Should Display the AddDomain Modal on Add Domain Button Click.', async () => {
      render(<SingleDomain />);
      const button = document.querySelector('[data-testid=add_domain]');
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
      expect(screen.getByTestId('adddomain_modal')).toBeVisible();
   });
   it('Should Display the AddKeywords Modal on Add Keyword Button Click.', async () => {
      render(<SingleDomain />);
      const button = document.querySelector('[data-testid=add_keyword]');
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
      expect(screen.getByTestId('addkeywords_modal')).toBeVisible();
   });

   it('Should display the Domain Settings on Settings Button click.', async () => {
      render(<SingleDomain />);
      const button = document.querySelector('[data-testid=show_domain_settings]');
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
      expect(screen.getByTestId('domain_settings')).toBeVisible();
   });

   it('Device Tab change should be functioning.', async () => {
      render(<SingleDomain />);
      const button = document.querySelector('[data-testid=mobile_tab]');
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
      const keywordsCount = document.querySelectorAll('.keyword').length;
      expect(keywordsCount).toBe(0);
   });

   it('Search Filter should function properly', async () => {
      render(<SingleDomain />);
      const inputNode = screen.getByTestId('filter_input');
      fireEvent.change(inputNode, { target: { value: 'compressor' } }); // triggers onChange event
      expect(inputNode.getAttribute('value')).toBe('compressor');
      const keywordsCount = document.querySelectorAll('.keyword').length;
      expect(keywordsCount).toBe(1);
   });

   it('Country Filter should function properly', async () => {
      render(<SingleDomain />);
      const button = document.querySelector('[data-testid=filter_button]');
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
      expect(document.querySelector('.country_filter')).toBeVisible();

      const countrySelect = document.querySelector('.country_filter .selected');
      if (countrySelect) fireEvent(countrySelect, new MouseEvent('click', { bubbles: true }));
      expect(document.querySelector('.country_filter .select_list')).toBeVisible();
      const firstCountry = document.querySelector('.country_filter .select_list ul li:nth-child(1)');
      if (firstCountry) fireEvent(firstCountry, new MouseEvent('click', { bubbles: true }));
      const keywordsCount = document.querySelectorAll('.keyword').length;
      expect(keywordsCount).toBe(0);
   });

   // Tags Filter should function properly
   it('Tags Filter should Render & Function properly', async () => {
      render(<SingleDomain />);
      const button = document.querySelector('[data-testid=filter_button]');
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
      expect(document.querySelector('.tags_filter')).toBeVisible();

      const countrySelect = document.querySelector('.tags_filter .selected');
      if (countrySelect) fireEvent(countrySelect, new MouseEvent('click', { bubbles: true }));
      expect(document.querySelector('.tags_filter .select_list')).toBeVisible();
      expect(document.querySelectorAll('.tags_filter .select_list ul li').length).toBe(1);

      const firstTag = document.querySelector('.tags_filter .select_list ul li:nth-child(1)');
      if (firstTag) fireEvent(firstTag, new MouseEvent('click', { bubbles: true }));
      expect(document.querySelectorAll('.keyword').length).toBe(1);
   });

   it('Sort Options Should be visible Sort Button on Click.', async () => {
      render(<SingleDomain />);
      const button = document.querySelector('[data-testid=sort_button]');
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
      expect(document.querySelector('.sort_options')).toBeVisible();
   });

   it('Sort: Position should sort keywords accordingly', async () => {
      render(<SingleDomain />);
      const button = document.querySelector('[data-testid=sort_button]');
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));

      // Test Top Position Sort
      const topPosSortOption = document.querySelector('ul.sort_options li:nth-child(1)');
      if (topPosSortOption) fireEvent(topPosSortOption, new MouseEvent('click', { bubbles: true }));
      const firstKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(firstKeywordTitle).toBe('compress image');

      // Test Lowest Position Sort
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
      const lowestPosSortOption = document.querySelector('ul.sort_options li:nth-child(2)');
      if (lowestPosSortOption) fireEvent(lowestPosSortOption, new MouseEvent('click', { bubbles: true }));
      const secondKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(secondKeywordTitle).toBe('image compressor');
   });

   it('Sort: Date Added should sort keywords accordingly', async () => {
      render(<SingleDomain />);
      const button = document.querySelector('[data-testid=sort_button]');
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));

      // Test Top Position Sort
      const topPosSortOption = document.querySelector('ul.sort_options li:nth-child(3)');
      if (topPosSortOption) fireEvent(topPosSortOption, new MouseEvent('click', { bubbles: true }));
      const firstKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(firstKeywordTitle).toBe('compress image');

      // Test Lowest Position Sort
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
      const lowestPosSortOption = document.querySelector('ul.sort_options li:nth-child(4)');
      if (lowestPosSortOption) fireEvent(lowestPosSortOption, new MouseEvent('click', { bubbles: true }));
      const secondKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(secondKeywordTitle).toBe('image compressor');
   });

   it('Sort: Alphabetical should sort keywords accordingly', async () => {
      render(<SingleDomain />);
      const button = document.querySelector('[data-testid=sort_button]');
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));

      // Test Top Position Sort
      const topPosSortOption = document.querySelector('ul.sort_options li:nth-child(5)');
      if (topPosSortOption) fireEvent(topPosSortOption, new MouseEvent('click', { bubbles: true }));
      const firstKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(firstKeywordTitle).toBe('compress image');

      // Test Lowest Position Sort
      if (button) fireEvent(button, new MouseEvent('click', { bubbles: true }));
      const lowestPosSortOption = document.querySelector('ul.sort_options li:nth-child(6)');
      if (lowestPosSortOption) fireEvent(lowestPosSortOption, new MouseEvent('click', { bubbles: true }));
      const secondKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(secondKeywordTitle).toBe('image compressor');
   });
});

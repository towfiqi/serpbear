import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import SingleDomain from '../../pages/domain/[slug]';
import { useAddDomain, useDeleteDomain, useFetchDomains, useUpdateDomain } from '../../services/domains';
import { useAddKeywords, useDeleteKeywords,
   useFavKeywords, useFetchKeywords, useRefreshKeywords, useFetchSingleKeyword } from '../../services/keywords';
import { dummyDomain, dummyKeywords, dummySettings } from '../../__mocks__/data';
import { useFetchSettings } from '../../services/settings';

jest.mock('../../services/domains');
jest.mock('../../services/keywords');
jest.mock('../../services/settings');

jest.mock('next/router', () => ({
   useRouter: () => ({
     query: { slug: dummyDomain.slug },
   }),
}));

jest.mock('react-chartjs-2', () => ({
   Line: () => null,
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
const useFetchSettingsFunc = useFetchSettings as jest.Mock<any>;
const useFetchSingleKeywordFunc = useFetchSingleKeyword as jest.Mock<any>;

describe('SingleDomain Page', () => {
   const queryClient = new QueryClient();
   beforeEach(() => {
      useFetchSettingsFunc.mockImplementation(() => ({ data: { settings: dummySettings }, isLoading: false }));
      useFetchDomainsFunc.mockImplementation(() => ({ data: { domains: [dummyDomain] }, isLoading: false }));
      useFetchKeywordsFunc.mockImplementation(() => ({ keywordsData: { keywords: dummyKeywords }, keywordsLoading: false }));
      const fetchPayload = { history: dummyKeywords[0].history || [], searchResult: dummyKeywords[0].lastResult || [] };
      useFetchSingleKeywordFunc.mockImplementation(() => ({ data: fetchPayload, isLoading: false }));
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
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      expect(screen.getByTestId('domain-header')).toBeInTheDocument();
   });
   it('Should Call the useFetchDomains hook on render.', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      expect(useFetchDomains).toHaveBeenCalled();
   });
   it('Should Render the Keywords', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const keywordsCount = document.querySelectorAll('.keyword').length;
      expect(keywordsCount).toBe(2);
   });
   it('Should Display the Keywords Details Sidebar on Keyword Click.', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const keywords = document.querySelectorAll('.keyword');
      const firstKeyword = keywords && keywords[0].querySelector('a');
      if (firstKeyword) fireEvent.click(firstKeyword);
      expect(useFetchSingleKeyword).toHaveBeenCalled();
      expect(screen.getByTestId('keywordDetails')).toBeVisible();
   });
   it('Should Display the AddDomain Modal on Add Domain Button Click.', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const button = screen.getByTestId('add_domain');
      if (button) fireEvent.click(button);
      expect(screen.getByTestId('adddomain_modal')).toBeVisible();
   });
   it('Should Display the AddKeywords Modal on Add Keyword Button Click.', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const button = screen.getByTestId('add_keyword');
      if (button) fireEvent.click(button);
      expect(screen.getByTestId('addkeywords_modal')).toBeVisible();
   });

   it('Should display the Domain Settings on Settings Button click.', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const button = screen.getByTestId('show_domain_settings');
      if (button) fireEvent.click(button);
      expect(screen.getByTestId('domain_settings')).toBeVisible();
   });

   it('Device Tab change should be functioning.', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const button = screen.getByTestId('mobile_tab');
      if (button) fireEvent.click(button);
      const keywordsCount = document.querySelectorAll('.keyword').length;
      expect(keywordsCount).toBe(0);
   });

   it('Search Filter should function properly', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const inputNode = screen.getByTestId('filter_input');
      if (inputNode) fireEvent.change(inputNode, { target: { value: 'compressor' } }); // triggers onChange event
      expect(inputNode.getAttribute('value')).toBe('compressor');
      const keywordsCount = document.querySelectorAll('.keyword').length;
      expect(keywordsCount).toBe(1);
   });

   it('Country Filter should function properly', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const button = screen.getByTestId('filter_button');
      if (button) fireEvent.click(button);
      expect(document.querySelector('.country_filter')).toBeVisible();

      const countrySelect = document.querySelector('.country_filter .selected');
      if (countrySelect) fireEvent.click(countrySelect);
      expect(document.querySelector('.country_filter .select_list')).toBeVisible();
      const firstCountry = document.querySelector('.country_filter .select_list ul li:nth-child(1)');
      if (firstCountry) fireEvent.click(firstCountry);
      const keywordsCount = document.querySelectorAll('.keyword').length;
      expect(keywordsCount).toBe(0);
   });

   // Tags Filter should function properly
   it('Tags Filter should Render & Function properly', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const button = screen.getByTestId('filter_button');
      if (button) fireEvent.click(button);
      expect(document.querySelector('.tags_filter')).toBeVisible();

      const countrySelect = document.querySelector('.tags_filter .selected');
      if (countrySelect) fireEvent.click(countrySelect);
      expect(document.querySelector('.tags_filter .select_list')).toBeVisible();
      expect(document.querySelectorAll('.tags_filter .select_list ul li').length).toBe(1);

      const firstTag = document.querySelector('.tags_filter .select_list ul li:nth-child(1)');
      if (firstTag) fireEvent.click(firstTag);
      expect(document.querySelectorAll('.keyword').length).toBe(1);
   });

   it('Sort Options Should be visible Sort Button on Click.', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const button = screen.getByTestId('sort_button');
      if (button) fireEvent.click(button);
      expect(document.querySelector('.sort_options')).toBeVisible();
   });

   it('Sort: Position should sort keywords accordingly', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const button = screen.getByTestId('sort_button');
      if (button) fireEvent.click(button);
      // Test Top Position Sort
      const topPosSortOption = document.querySelector('ul.sort_options li:nth-child(1)');
      if (topPosSortOption) fireEvent.click(topPosSortOption);
      const firstKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(firstKeywordTitle).toBe('compress image');

      // Test Lowest Position Sort
      if (button) fireEvent.click(button);
      const lowestPosSortOption = document.querySelector('ul.sort_options li:nth-child(2)');
      if (lowestPosSortOption) fireEvent.click(lowestPosSortOption);
      const secondKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(secondKeywordTitle).toBe('image compressor');
   });

   it('Sort: Date Added should sort keywords accordingly', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const button = screen.getByTestId('sort_button');
      if (button) fireEvent.click(button);

      // Test Top Position Sort
      const topPosSortOption = document.querySelector('ul.sort_options li:nth-child(3)');
      if (topPosSortOption) fireEvent.click(topPosSortOption);
      const firstKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(firstKeywordTitle).toBe('compress image');

      // Test Lowest Position Sort
      if (button) fireEvent.click(button);
      const lowestPosSortOption = document.querySelector('ul.sort_options li:nth-child(4)');
      if (lowestPosSortOption) fireEvent.click(lowestPosSortOption);
      const secondKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(secondKeywordTitle).toBe('image compressor');
   });

   it('Sort: Alphabetical should sort keywords accordingly', async () => {
      render(<QueryClientProvider client={queryClient}><SingleDomain /></QueryClientProvider>);
      const button = screen.getByTestId('sort_button');
      if (button) fireEvent.click(button);

      // Test Top Position Sort
      const topPosSortOption = document.querySelector('ul.sort_options li:nth-child(5)');
      if (topPosSortOption) fireEvent.click(topPosSortOption);
      const firstKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(firstKeywordTitle).toBe('compress image');

      // Test Lowest Position Sort
      if (button) fireEvent.click(button);
      const lowestPosSortOption = document.querySelector('ul.sort_options li:nth-child(6)');
      if (lowestPosSortOption) fireEvent.click(lowestPosSortOption);
      const secondKeywordTitle = document.querySelector('.domKeywords_keywords .keyword:nth-child(1) a')?.textContent;
      expect(secondKeywordTitle).toBe('image compressor');
   });
});

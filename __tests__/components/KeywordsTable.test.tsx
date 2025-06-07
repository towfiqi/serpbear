import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import KeywordsTable from '../../components/keywords/KeywordsTable';
import { KeywordType } from '../../types/keyword'; // Assuming types are here
import { SettingsType } from '../../types/settings'; // Assuming types are here
import { DomainType } from '../../types/domain'; // Assuming types are here

// Mock child components and hooks to isolate KeywordsTable logic
jest.mock('../../components/common/Icon', () => (props: any) => <span data-testid={`icon-${props.type}`} />);
jest.mock('../../components/keywords/Keyword', () => (props: any) => (
  <div data-testid={`keyword-row-${props.keywordData.ID}`} className={props.selected ? 'keyword--selected' : ''}>
    <button
      data-testid={`keyword-checkbox-${props.keywordData.ID}`}
      onClick={(e) => act(() => props.selectKeyword(props.keywordData.ID, e))}
    >
      {props.keywordData.keyword}
    </button>
    <span onClick={() => act(() => props.showKeywordDetails())} data-testid={`keyword-details-link-${props.keywordData.ID}`}>details</span>
  </div>
));
jest.mock('../../components/keywords/KeywordDetails', () => () => <div data-testid="keyword-details">Keyword Details</div>);
jest.mock('../../components/keywords/KeywordFilter', () => () => <div data-testid="keyword-filters">Keyword Filters</div>);
jest.mock('../../components/common/Modal', () => ({ children }: { children: React.ReactNode}) => <div data-testid="modal">{children}</div>);
jest.mock('../../services/keywords', () => ({
  useDeleteKeywords: () => ({ mutate: jest.fn() }),
  useFavKeywords: () => ({ mutate: jest.fn() }),
  useRefreshKeywords: () => ({ mutate: jest.fn() }),
}));
jest.mock('../../hooks/useWindowResize', () => jest.fn());
jest.mock('../../hooks/useIsMobile', () => jest.fn(() => [false]));
jest.mock('../../services/settings', () => ({
  useUpdateSettings: () => ({ mutate: jest.fn(), isLoading: false }),
}));
jest.mock('react-hot-toast', () => ({ Toaster: () => <div data-testid="toaster" />}));
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, ...rest }: any) => (
    <div data-testid="fixed-size-list" {...rest}>
      {Array.from({ length: rest.itemCount }).map((_, index) =>
        children({ data: rest.itemData, index, style: {} })
      )}
    </div>
  ),
}));


const mockKeywords: KeywordType[] = [
  { ID: 1, keyword: 'Keyword A', device: 'desktop', position: 1, country: 'US', tags: [], history: {}, lastUpdated: new Date().toISOString(), domain: 'test.com', volume: 100, url: 'test.com/a' },
  { ID: 2, keyword: 'Keyword B', device: 'desktop', position: 2, country: 'US', tags: [], history: {}, lastUpdated: new Date().toISOString(), domain: 'test.com', volume: 200, url: 'test.com/b' },
  { ID: 3, keyword: 'Keyword C', device: 'desktop', position: 3, country: 'US', tags: [], history: {}, lastUpdated: new Date().toISOString(), domain: 'test.com', volume: 300, url: 'test.com/c' },
  { ID: 4, keyword: 'Keyword D', device: 'desktop', position: 4, country: 'US', tags: [], history: {}, lastUpdated: new Date().toISOString(), domain: 'test.com', volume: 400, url: 'test.com/d' },
  { ID: 5, keyword: 'Keyword E', device: 'desktop', position: 5, country: 'US', tags: [], history: {}, lastUpdated: new Date().toISOString(), domain: 'test.com', volume: 500, url: 'test.com/e' },
];

const mockDomain: DomainType = {
  ID: 1,
  domain: 'test.com',
  tld: 'com',
  tags: [],
  added: new Date().toISOString(),
  totalPages: 10,
  CMS: 'WordPress',
  server: 'Apache',
  DA: 10,
  DR: 10,
  keywords: { desktop: 10, mobile: 5 },
  traffic: { desktop: 100, mobile: 50 },
  cost: { desktop: 100, mobile: 50 },
  user_id: 1,
  favicon: '',
  hasGSC: false,
};

const mockSettings: SettingsType = {
  ID: 1, user_id: 1, createdAt: '', updatedAt: '',
  generalNotifications: true,
  summaryEmails: true,
  alertEmails: true,
  autoRefresh: true,
  defaultChartPeriod: '7',
  theme: 'light',
  timeZone: 'UTC',
  dateFormat: 'MM/dd/yyyy',
  keywordsColumns: ['Best', 'History', 'Volume', 'Search Console'],
};

describe('KeywordsTable Shift-Click Functionality', () => {
  beforeEach(() => {
    // Reset mocks if needed, e.g., jest.clearAllMocks();
    // Mock window.innerHeight for react-window
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
  });

  test('1. Basic Shift-click selection (selects from first to third)', async () => {
    render(
      <KeywordsTable
        domain={mockDomain}
        keywords={mockKeywords}
        isLoading={false}
        showAddModal={false}
        setShowAddModal={jest.fn()}
        isConsoleIntegrated={false}
        settings={mockSettings}
      />
    );

    const keyword1Checkbox = screen.getByTestId('keyword-checkbox-1');
    const keyword3Checkbox = screen.getByTestId('keyword-checkbox-3');

    // Simulate a click on the first keyword
    fireEvent.click(keyword1Checkbox);

    // Simulate a Shift-click on the third keyword
    fireEvent.click(keyword3Checkbox, { shiftKey: true });

    // Assert that keywords at indices 0, 1, and 2 (IDs 1, 2, 3) are selected
    // Need to wait for state updates if selection is async
    // await screen.findByText('Keyword A'); // Example wait, adjust as needed

    expect(screen.getByTestId('keyword-row-1')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-2')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-3')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-4')).not.toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-5')).not.toHaveClass('keyword--selected');
  });

  test('2. Shift-click selection in reverse order (selects from third to first)', async () => {
    render(
      <KeywordsTable
        domain={mockDomain}
        keywords={mockKeywords}
        isLoading={false}
        showAddModal={false}
        setShowAddModal={jest.fn()}
        isConsoleIntegrated={false}
        settings={mockSettings}
      />
    );

    const keyword1Checkbox = screen.getByTestId('keyword-checkbox-1');
    const keyword3Checkbox = screen.getByTestId('keyword-checkbox-3');

    // Simulate a click on the third keyword
    fireEvent.click(keyword3Checkbox);

    // Simulate a Shift-click on the first keyword
    fireEvent.click(keyword1Checkbox, { shiftKey: true });

    expect(screen.getByTestId('keyword-row-1')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-2')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-3')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-4')).not.toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-5')).not.toHaveClass('keyword--selected');
  });

  test('3. Shift-click with an existing disjointed selection', async () => {
    render(
      <KeywordsTable
        domain={mockDomain}
        keywords={mockKeywords}
        isLoading={false}
        showAddModal={false}
        setShowAddModal={jest.fn()}
        isConsoleIntegrated={false}
        settings={mockSettings}
      />
    );

    const keyword1Checkbox = screen.getByTestId('keyword-checkbox-1'); // A
    const keyword3Checkbox = screen.getByTestId('keyword-checkbox-3'); // C
    const keyword5Checkbox = screen.getByTestId('keyword-checkbox-5'); // B

    // Simulate a click on the first keyword (A)
    fireEvent.click(keyword1Checkbox);
    // Simulate a click on the fifth keyword (B)
    fireEvent.click(keyword5Checkbox);

    // Now A (ID 1) and B (ID 5) are selected.
    // Last selected was B (ID 5).
    // Shift-click on the third keyword (C, ID 3).
    // Range should be between B (index 4) and C (index 2). So, IDs 3, 4, 5.
    // Keyword A (ID 1) should also remain selected.
    fireEvent.click(keyword3Checkbox, { shiftKey: true });

    expect(screen.getByTestId('keyword-row-1')).toHaveClass('keyword--selected'); // A
    expect(screen.getByTestId('keyword-row-2')).not.toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-3')).toHaveClass('keyword--selected'); // C and in range B-C
    expect(screen.getByTestId('keyword-row-4')).toHaveClass('keyword--selected'); // In range B-C
    expect(screen.getByTestId('keyword-row-5')).toHaveClass('keyword--selected'); // B
  });

  test('4. Normal click after Shift-click (clears previous shift selection)', async () => {
    render(
      <KeywordsTable
        domain={mockDomain}
        keywords={mockKeywords}
        isLoading={false}
        showAddModal={false}
        setShowAddModal={jest.fn()}
        isConsoleIntegrated={false}
        settings={mockSettings}
      />
    );

    const keyword1Checkbox = screen.getByTestId('keyword-checkbox-1');
    const keyword3Checkbox = screen.getByTestId('keyword-checkbox-3');
    const keyword4Checkbox = screen.getByTestId('keyword-checkbox-4');

    // Simulate a click on the first keyword
    fireEvent.click(keyword1Checkbox);
    // Simulate a Shift-click on the third keyword (selects 1, 2, 3)
    fireEvent.click(keyword3Checkbox, { shiftKey: true });

    // Simulate a normal click on keyword 4
    fireEvent.click(keyword4Checkbox);

    expect(screen.getByTestId('keyword-row-1')).not.toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-2')).not.toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-3')).not.toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-4')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-5')).not.toHaveClass('keyword--selected');
  });

  test('5. Shift-click when no prior keyword was selected (acts as normal click)', () => {
    render(
      <KeywordsTable
        domain={mockDomain}
        keywords={mockKeywords}
        isLoading={false}
        showAddModal={false}
        setShowAddModal={jest.fn()}
        isConsoleIntegrated={false}
        settings={mockSettings}
      />
    );

    const keyword2Checkbox = screen.getByTestId('keyword-checkbox-2');
    fireEvent.click(keyword2Checkbox, { shiftKey: true });

    expect(screen.getByTestId('keyword-row-1')).not.toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-2')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-3')).not.toHaveClass('keyword--selected');
  });

  test('6. Shift-click on an already selected keyword within a potential new range', () => {
    render(
      <KeywordsTable
        domain={mockDomain}
        keywords={mockKeywords}
        isLoading={false}
        showAddModal={false}
        setShowAddModal={jest.fn()}
        isConsoleIntegrated={false}
        settings={mockSettings}
      />
    );

    const keyword1Checkbox = screen.getByTestId('keyword-checkbox-1');
    const keyword2Checkbox = screen.getByTestId('keyword-checkbox-2');
    const keyword3Checkbox = screen.getByTestId('keyword-checkbox-3');

    // 1. Select keyword 1
    fireEvent.click(keyword1Checkbox); // Selected: [1]
    // 2. Select keyword 2 (normally, without shift)
    fireEvent.click(keyword2Checkbox); // Selected: [1, 2] (assuming non-shift adds to selection if not present)
                                     // Based on original logic: if (selectedKeywords.includes(keywordID)) updatedSelectd = selectedKeywords.filter...
                                     // This means a normal click on K2 would make selected: [1,2] if K2 was not selected.
                                     // And if K2 *was* selected, it would be removed. Let's assume fresh clicks for now.
                                     // The provided selectKeyword logic:
                                     // else { // Original logic for single select/deselect
                                     //   let updatedSelected = [...selectedKeywords, keywordID];
                                     //   if (selectedKeywords.includes(keywordID)) { // <-- This is the part
                                     //     updatedSelected = selectedKeywords.filter((keyID) => keyID !== keywordID);
                                     //   }
                                     //   setSelectedKeywords(updatedSelected);
                                     // }
                                     // So, clicking K1 makes [1]. Clicking K2 makes [1,2].

    expect(screen.getByTestId('keyword-row-1')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-2')).toHaveClass('keyword--selected');

    // 3. Shift-click keyword 3. Last selected was keyword 2.
    // Expected: range from 2 to 3 (i.e., keywords 2, 3). Keyword 1 should remain selected.
    // Result: [1, 2, 3]
    fireEvent.click(keyword3Checkbox, { shiftKey: true });

    expect(screen.getByTestId('keyword-row-1')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-2')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-3')).toHaveClass('keyword--selected');
  });

  test('7. Shift-click that spans across already selected items (should select all in range)', () => {
    render(
      <KeywordsTable
        domain={mockDomain}
        keywords={mockKeywords}
        isLoading={false}
        showAddModal={false}
        setShowAddModal={jest.fn()}
        isConsoleIntegrated={false}
        settings={mockSettings}
      />
    );

    const keyword1Checkbox = screen.getByTestId('keyword-checkbox-1');
    const keyword3Checkbox = screen.getByTestId('keyword-checkbox-3');
    const keyword5Checkbox = screen.getByTestId('keyword-checkbox-5');

    // 1. Select keyword 3
    fireEvent.click(keyword3Checkbox); // Selected: [3]
    expect(screen.getByTestId('keyword-row-3')).toHaveClass('keyword--selected');


    // 2. Shift-click keyword 1. Last selected was keyword 3.
    // Range is from 1 to 3. Expected: [1, 2, 3]
    fireEvent.click(keyword1Checkbox, { shiftKey: true });
    expect(screen.getByTestId('keyword-row-1')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-2')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-3')).toHaveClass('keyword--selected');

    // 3. Shift-click keyword 5. Last selected is now keyword 1 (from the previous shift-click action, which adds to selection).
    // Actually, the last *clicked* keyword for non-shift selection determines the anchor for subsequent shift clicks.
    // The problem description for shift click says: "If there was a previously selected keyword (i.e., `selectedKeywords` is not empty), find its index as well."
    // And "const lastSelectedKeywordId = selectedKeywords[selectedKeywords.length - 1];"
    // So after step 2, selectedKeywords is [3,1,2] (order due to Set conversion then spread). lastSelectedKeywordId = 2.
    // Shift clicking K5 (ID 5). Range between ID 2 and ID 5. So IDs 2,3,4,5.
    // Current selected: [3,1,2]. New to add: [2,3,4,5]. Resulting Set: [1,2,3,4,5]
    fireEvent.click(keyword5Checkbox, { shiftKey: true });

    expect(screen.getByTestId('keyword-row-1')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-2')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-3')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-4')).toHaveClass('keyword--selected');
    expect(screen.getByTestId('keyword-row-5')).toHaveClass('keyword--selected');
  });
});

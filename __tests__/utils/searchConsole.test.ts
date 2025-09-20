import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { generateGoogleConsoleStats } from '../../utils/generateEmail';
import {
  fetchDomainSCData,
  getSearchConsoleApiInfo,
  isSearchConsoleDataFreshForToday,
  readLocalSCData,
} from '../../utils/searchConsole';

dayjs.extend(utc);
dayjs.extend(timezone);

jest.mock('../../utils/insight', () => ({
  getKeywordsInsight: jest.fn(() => [
    { keyword: 'test keyword', clicks: 5, impressions: 10, position: 2 },
  ]),
  getPagesInsight: jest.fn(() => [
    { page: '/test', clicks: 3, impressions: 6, position: 4 },
  ]),
}));

jest.mock('../../utils/searchConsole', () => {
  const actualModule = jest.requireActual('../../utils/searchConsole');
  return {
    ...actualModule,
    readLocalSCData: jest.fn(),
    fetchDomainSCData: jest.fn(),
    getSearchConsoleApiInfo: jest.fn(),
  };
});

const mockReadLocalSCData = readLocalSCData as jest.Mock;
const mockFetchDomainSCData = fetchDomainSCData as jest.Mock;
const mockGetSearchConsoleApiInfo = getSearchConsoleApiInfo as jest.Mock;

describe('Search Console caching helpers', () => {
  const originalCronTimezone = process.env.CRON_TIMEZONE;
  const timezoneSetting = 'America/New_York';

  beforeEach(() => {
    process.env.CRON_TIMEZONE = timezoneSetting;
    jest.clearAllMocks();
    mockReadLocalSCData.mockReset();
    mockFetchDomainSCData.mockReset();
    mockGetSearchConsoleApiInfo.mockReset();
    mockGetSearchConsoleApiInfo.mockResolvedValue({ client_email: '', private_key: '' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.CRON_TIMEZONE = originalCronTimezone;
  });

  it('detects that lastFetched occurred today in the cron timezone', () => {
    const now = dayjs.tz('2023-12-10 10:00', timezoneSetting);
    jest.spyOn(Date, 'now').mockReturnValue(now.valueOf());
    const sameDayIso = now.startOf('day').add(1, 'hour').toDate().toISOString();

    expect(isSearchConsoleDataFreshForToday(sameDayIso, timezoneSetting)).toBe(true);
  });

  it('refetches data when cache is from a previous day', async () => {
    const now = dayjs.tz('2023-12-10 10:00', timezoneSetting);
    jest.spyOn(Date, 'now').mockReturnValue(now.valueOf());
    const staleIso = now.subtract(1, 'day').add(2, 'hour').toDate().toISOString();

    mockReadLocalSCData.mockResolvedValue({
      lastFetched: staleIso,
      stats: [
        { date: '2023-12-09', clicks: 5, impressions: 9, ctr: 1.2, position: 3 },
      ],
    });
    mockGetSearchConsoleApiInfo
      .mockResolvedValueOnce({ client_email: 'domain@example.com', private_key: 'domain-key' })
      .mockResolvedValueOnce({ client_email: '', private_key: '' });
    mockFetchDomainSCData.mockResolvedValue({
      lastFetched: now.toDate().toISOString(),
      stats: [
        { date: '2023-12-10', clicks: 7, impressions: 13, ctr: 1.4, position: 2 },
      ],
    });

    await generateGoogleConsoleStats({ domain: 'example.com' } as any);

    expect(mockFetchDomainSCData).toHaveBeenCalledTimes(1);
  });

  it('does not refetch when cache was updated today', async () => {
    const now = dayjs.tz('2023-12-10 10:00', timezoneSetting);
    jest.spyOn(Date, 'now').mockReturnValue(now.valueOf());
    const sameDayIso = now.startOf('day').add(1, 'hour').toDate().toISOString();

    mockReadLocalSCData.mockResolvedValue({
      lastFetched: sameDayIso,
      stats: [
        { date: '2023-12-10', clicks: 7, impressions: 14, ctr: 1.4, position: 2 },
      ],
    });

    const html = await generateGoogleConsoleStats({ domain: 'example.com' } as any);

    expect(mockFetchDomainSCData).not.toHaveBeenCalled();
    expect(html).toContain('Google Search Console Stats');
  });
});

import getdomainStats from '../../utils/domains';
import Keyword from '../../database/models/keyword';
import parseKeywords from '../../utils/parseKeywords';
import { readLocalSCData } from '../../utils/searchConsole';

jest.mock('../../database/models/keyword', () => ({
  __esModule: true,
  default: { findAll: jest.fn() },
}));

jest.mock('../../utils/parseKeywords', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('../../utils/searchConsole', () => ({
  __esModule: true,
  readLocalSCData: jest.fn(),
}));

const mockFindAll = (Keyword as any).findAll as jest.Mock;
const mockParseKeywords = parseKeywords as jest.Mock;
const mockReadLocalSCData = readLocalSCData as jest.Mock;

describe('getdomainStats', () => {
  it('returns avgPosition 0 when domain has no keywords', async () => {
    mockFindAll.mockResolvedValue([]);
    mockParseKeywords.mockReturnValue([]);
    mockReadLocalSCData.mockResolvedValue(null);

    const domain = {
      ID: 1,
      domain: 'example.com',
      slug: 'example-com',
      notification: false,
      notification_interval: '',
      notification_emails: '',
      lastUpdated: new Date().toISOString(),
      added: new Date().toISOString(),
    } as any;

    const result = await getdomainStats([domain]);
    expect(result[0].avgPosition).toBe(0);
    expect(result[0].keywordCount).toBe(0);
  });
});

import Keyword from '../../database/models/keyword';
import * as scUtils from '../../utils/searchConsole';
import * as adwordsUtils from '../../utils/adwords';

jest.mock('../../utils/searchConsole', () => ({
  readLocalSCData: jest.fn(),
}));

describe('getAdwordsKeywordIdeas', () => {
  const creds = {
    client_id: '',
    client_secret: '',
    developer_token: '',
    account_id: '123-456-7890',
    refresh_token: '',
  } as any;

  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ access_token: 'test-token' }),
      status: 200,
    }) as any;
    jest.spyOn(Keyword, 'findAll').mockResolvedValue([] as any);
    jest.spyOn(scUtils, 'readLocalSCData').mockResolvedValue(null as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('throws error when no tracked keywords found', async () => {
    await expect(
      adwordsUtils.getAdwordsKeywordIdeas(
        creds,
        { country: 'US', language: '1000', domainUrl: 'example.com', seedType: 'tracking' },
        true,
      ),
    ).rejects.toThrow('No tracked keywords found for this domain');
  });

  it('throws error when no search console keywords found', async () => {
    (scUtils.readLocalSCData as jest.Mock).mockResolvedValue({ thirtyDays: [] });
    await expect(
      adwordsUtils.getAdwordsKeywordIdeas(
        creds,
        { country: 'US', language: '1000', domainUrl: 'example.com', seedType: 'searchconsole' },
        true,
      ),
    ).rejects.toThrow('No search console keywords found for this domain');
  });
});

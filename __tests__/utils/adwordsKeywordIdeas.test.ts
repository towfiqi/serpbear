import Keyword from '../../database/models/keyword';
import Domain from '../../database/models/domain';

jest.mock('../../utils/searchConsole', () => ({
  readLocalSCData: jest.fn(),
}));
import * as scUtils from '../../utils/searchConsole';
import * as adwordsUtils from '../../utils/adwords';

describe('getAdwordsKeywordIdeas', () => {
  const creds = {
    client_id: '',
    client_secret: '',
    developer_token: '',
    account_id: '123-456-7890',
    refresh_token: '',
  } as any;

  const originalFetch = global.fetch;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ access_token: 'test-token' }),
      status: 200,
    }) as any;
    jest.spyOn(Keyword, 'findAll').mockResolvedValue([] as any);
    jest.spyOn(Domain, 'findOne').mockResolvedValue(null as any);
    jest.spyOn(scUtils, 'readLocalSCData').mockResolvedValue(null as any);
    console.log = jest.fn(); // Mock console.log to avoid cluttering test output
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.log = originalConsoleLog;
    jest.restoreAllMocks();
  });

  it('throws error when domain does not exist for tracking', async () => {
    await expect(
      adwordsUtils.getAdwordsKeywordIdeas(
        creds,
        { country: 'US', language: '1000', domainSlug: 'nonexistent-domain', seedType: 'tracking' },
        true,
      ),
    ).rejects.toThrow("Domain 'nonexistent-domain' not found. Please ensure the domain is added to the system.");
  });

  it('throws error when domain does not exist for searchconsole', async () => {
    await expect(
      adwordsUtils.getAdwordsKeywordIdeas(
        creds,
        { country: 'US', language: '1000', domainSlug: 'nonexistent-domain', seedType: 'searchconsole' },
        true,
      ),
    ).rejects.toThrow("Domain 'nonexistent-domain' not found. Please ensure the domain is added to the system.");
  });

  it('throws error when domain exists but no tracked keywords found', async () => {
    jest.spyOn(Domain, 'findOne').mockResolvedValue({ slug: 'example-domain' } as any);
    
    await expect(
      adwordsUtils.getAdwordsKeywordIdeas(
        creds,
        { country: 'US', language: '1000', domainSlug: 'example-domain', seedType: 'tracking' },
        true,
      ),
    ).rejects.toThrow("No tracked keywords found for domain 'example-domain'. Please add some keywords to track first.");
  });

  it('throws error when domain exists but no search console keywords found', async () => {
    jest.spyOn(Domain, 'findOne').mockResolvedValue({ slug: 'example-domain' } as any);
    (scUtils.readLocalSCData as jest.Mock).mockResolvedValue({ thirtyDays: [] });
    
    await expect(
      adwordsUtils.getAdwordsKeywordIdeas(
        creds,
        { country: 'US', language: '1000', domainSlug: 'example-domain', seedType: 'searchconsole' },
        true,
      ),
    ).rejects.toThrow("No search console keywords found for domain 'example-domain'. Please ensure Search Console is properly integrated and has data.");
  });

  it('works when tracking keywords are found', async () => {
    jest.spyOn(Domain, 'findOne').mockResolvedValue({ slug: 'example-domain' } as any);
    jest.spyOn(Keyword, 'findAll').mockResolvedValue([
      { get: () => ({ 
        keyword: 'test keyword', 
        domain: 'example-domain',
        history: '[]',
        tags: '[]',
        lastResult: '{}',
        lastUpdateError: 'false'
      }) }
    ] as any);
    
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: async () => ({ access_token: 'test-token' }),
        status: 200,
      })
      .mockResolvedValueOnce({
        json: async () => ({ results: [] }),
        status: 200,
      });

    const result = await adwordsUtils.getAdwordsKeywordIdeas(
      creds,
      { country: 'US', language: '1000', domainSlug: 'example-domain', seedType: 'tracking' },
      true,
    );
    
    expect(result).toEqual([]);
  });

  it('works when search console keywords are found', async () => {
    jest.spyOn(Domain, 'findOne').mockResolvedValue({ slug: 'example-domain' } as any);
    (scUtils.readLocalSCData as jest.Mock).mockResolvedValue({
      thirtyDays: [{ keyword: 'sc keyword', impressions: 100 }]
    });
    
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: async () => ({ access_token: 'test-token' }),
        status: 200,
      })
      .mockResolvedValueOnce({
        json: async () => ({ results: [] }),
        status: 200,
      });

    const result = await adwordsUtils.getAdwordsKeywordIdeas(
      creds,
      { country: 'US', language: '1000', domainSlug: 'example-domain', seedType: 'searchconsole' },
      true,
    );
    
    expect(result).toEqual([]);
  });
});

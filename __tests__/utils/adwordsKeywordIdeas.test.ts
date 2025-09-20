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

describe('updateKeywordsVolumeData', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('awaits all keyword updates before resolving', async () => {
    const completionOrder: number[] = [];
    jest.spyOn(Keyword, 'update').mockImplementation((_, options: any) =>
      new Promise((resolve) => {
        setTimeout(() => {
          completionOrder.push(options?.where?.ID);
          resolve([1] as any);
        }, 0);
      }),
    );

    const promise = adwordsUtils.updateKeywordsVolumeData({ 1: 100, 2: 200 });
    await expect(promise).resolves.toBe(true);
    expect(completionOrder).toHaveLength(2);
    expect(completionOrder).toEqual(expect.arrayContaining([1, 2]));
  });

  it('propagates update errors', async () => {
    const failure = new Error('db failure');
    jest.spyOn(Keyword, 'update').mockRejectedValue(failure);

    await expect(adwordsUtils.updateKeywordsVolumeData({ 3: 500 })).rejects.toThrow('db failure');
  });
});

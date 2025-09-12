import { readFile } from 'fs/promises';
import generateEmail from '../../utils/generateEmail';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

const mockReadFile = readFile as jest.Mock;

describe('generateEmail', () => {
  it('includes city and state in keyword table when provided', async () => {
    mockReadFile.mockResolvedValue('<html>{{keywordsTable}}</html>');

    const keywords = [
      {
        ID: 1,
        keyword: 'test keyword',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
        lastUpdated: new Date().toISOString(),
        added: new Date().toISOString(),
        position: 5,
        volume: 0,
        sticky: false,
        history: {},
        lastResult: [],
        url: '',
        tags: [],
        updating: false,
        lastUpdateError: false,
        city: 'Berlin',
        state: 'Berlin State',
      },
    ] as any;

    const settings = { search_console_client_email: '', search_console_private_key: '', keywordsColumns: [] } as any;

    const html = await generateEmail({ domain: 'example.com' } as any, keywords, settings);
    expect(html).toContain('(Berlin, Berlin State)');
  });
});

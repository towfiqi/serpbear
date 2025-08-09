import path from 'path';
import fs from 'fs';
import generateEmail from '../../utils/generateEmail';
import { readFile } from 'fs/promises';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

describe('generateEmail', () => {
  it('includes city in keyword table when keyword.city is provided', async () => {
    const template = fs.readFileSync(path.join(process.cwd(), 'email', 'email.html'), 'utf-8');
    (readFile as jest.Mock).mockResolvedValue(template);

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
      },
    ] as any;

    const settings = { search_console_client_email: '', search_console_private_key: '', keywordsColumns: [] } as any;

    const html = await generateEmail('example.com', keywords, settings);
    expect(html).toContain('(Berlin)');
  });
});

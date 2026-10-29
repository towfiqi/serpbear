import refreshAndUpdateKeywords from '../../utils/refresh';

jest.mock('fs/promises', () => ({
   readFile: jest.fn().mockResolvedValue('[]'),
   writeFile: jest.fn().mockResolvedValue(undefined),
}));

it('records a parsing exception as a failed keyword and continues the batch', async () => {
   (fetch as any).resetMocks();
   (fetch as any).mockResponses(
      [JSON.stringify({ organic: [{ title: 'Bad provider URL', link: 'https://Plus de 170 abonnés' }] }), { status: 200 }],
      [JSON.stringify({ organic: [{ title: 'Hallucine', link: 'https://hallucinecran.fr/' }] }), { status: 200 }],
   );
   const keywords = [1, 2].map((ID) => {
      const raw = {
         ID, keyword: `keyword ${ID}`, country: 'FR', domain: 'hallucinecran.fr', position: 7,
         url: 'https://hallucinecran.fr/previous', device: 'desktop', lastResult: '[]', history: '{}', tags: '[]',
         lastUpdateError: 'false', lastUpdated: '2026-09-13T00:00:00Z',
      };
      return { ...raw, get: () => raw, update: jest.fn().mockResolvedValue(undefined) };
   });
   const results = await refreshAndUpdateKeywords(keywords as any, {
      scraper_type: 'brightdata', scaping_api: 'dummy', scrape_strategy: 'basic', scrape_delay: '0',
   } as any, []);
   expect(results).toHaveLength(2);
   expect(keywords[0].update).toHaveBeenCalledWith(expect.objectContaining({
      updating: false, position: 7, url: 'https://hallucinecran.fr/previous',
      lastUpdated: '2026-09-13T00:00:00Z', lastUpdateError: expect.stringContaining('Invalid URL'),
   }));
   expect(keywords[1].update).toHaveBeenCalledWith(expect.objectContaining({
      updating: false, position: 1, lastUpdateError: 'false',
   }));
   expect(fetch).toHaveBeenCalledTimes(2);
});

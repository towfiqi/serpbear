import type { NextApiRequest, NextApiResponse } from 'next';
import * as adwords from '../../utils/adwords';
import handler from '../../pages/api/ideas';

jest.mock('../../database/database', () => ({
   __esModule: true,
   default: { sync: jest.fn() },
}));
jest.mock('../../utils/verifyUser', () => ({
   __esModule: true,
   default: jest.fn(() => 'authorized'),
}));
jest.mock('../../utils/adwords', () => ({
   getAdwordsCredentials: jest.fn(),
   getAdwordsKeywordIdeas: jest.fn(),
   getLocalKeywordIdeas: jest.fn(),
   updateLocalKeywordIdeas: jest.fn(),
}));

const credentials = {
   client_id: 'client',
   client_secret: 'secret',
   developer_token: 'developer',
   account_id: '1234567890',
   refresh_token: 'refresh',
};

const idea = {
   uid: 'us:niche-keyword',
   keyword: 'niche keyword',
   competition: 'LOW',
   country: 'US',
   domain: 'research',
   competitionIndex: 1,
   monthlySearchVolumes: {},
   avgMonthlySearches: 10,
   added: 1,
   updated: 1,
   position: 999,
} as IdeaKeyword;

const makeResponse = () => {
   const json = jest.fn();
   const status = jest.fn(() => ({ json }));
   return { response: { status } as unknown as NextApiResponse, status, json };
};

describe('POST /api/ideas', () => {
   beforeEach(() => {
      jest.clearAllMocks();
      jest.mocked(adwords.getAdwordsCredentials).mockResolvedValue(credentials);
   });

   it('returns success when Google Ads provides one valid idea', async () => {
      jest.mocked(adwords.getAdwordsKeywordIdeas).mockResolvedValue([idea]);
      const { response, status, json } = makeResponse();
      const request = {
         method: 'POST',
         body: {
            keywords: ['niche keyword'],
            country: 'US',
            language: '1000',
            domain: 'research',
            seedType: 'custom',
         },
      } as NextApiRequest;

      await handler(request, response);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ keywords: [idea] });
   });

   it('returns an error when Google Ads provides no usable ideas', async () => {
      jest.mocked(adwords.getAdwordsKeywordIdeas).mockResolvedValue([]);
      const { response, status, json } = makeResponse();
      const request = {
         method: 'POST',
         body: {
            keywords: ['unknown keyword'],
            country: 'US',
            language: '1000',
            domain: 'research',
            seedType: 'custom',
         },
      } as NextApiRequest;

      await handler(request, response);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ keywords: [], error: 'Error Fetching Keywords. Please try again!' });
   });
});

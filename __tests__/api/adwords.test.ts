import type { NextApiRequest, NextApiResponse } from 'next';
import { readFile } from 'fs/promises';
import { OAuth2Client } from 'google-auth-library';
import handler from '../../pages/api/adwords';
import db from '../../database/database';
import verifyUser from '../../utils/verifyUser';

type MutableEnv = NodeJS.ProcessEnv & {
   SECRET?: string;
};

jest.mock('../../database/database', () => ({
   __esModule: true,
   default: { sync: jest.fn() },
}));

jest.mock('../../utils/verifyUser', () => ({
   __esModule: true,
   default: jest.fn(),
}));

jest.mock('fs/promises', () => ({
   readFile: jest.fn(),
   writeFile: jest.fn(),
}));

const decryptMock = jest.fn();
const encryptMock = jest.fn();

jest.mock('cryptr', () => ({
   __esModule: true,
   default: jest.fn().mockImplementation(() => ({
      decrypt: decryptMock,
      encrypt: encryptMock,
   })),
}));

const getTokenMock = jest.fn();

jest.mock('google-auth-library', () => ({
   OAuth2Client: jest.fn().mockImplementation(() => ({
      getToken: getTokenMock,
   })),
}));

jest.mock('@googleapis/searchconsole', () => ({
   auth: { GoogleAuth: jest.fn() },
   searchconsole_v1: {
      Searchconsole: jest.fn().mockImplementation(() => ({
         searchanalytics: { query: jest.fn() },
      })),
   },
}));

describe('GET /api/adwords - refresh token retrieval', () => {
   const originalEnv = process.env;

   beforeEach(() => {
      (process.env as MutableEnv) = { ...originalEnv, SECRET: 'secret' };
      (db.sync as jest.Mock).mockResolvedValue(undefined);
      (verifyUser as jest.Mock).mockReturnValue('authorized');
      (readFile as jest.Mock).mockResolvedValue('{}');
      decryptMock.mockReturnValue('client-value');
      encryptMock.mockImplementation((value: string) => value);
      getTokenMock.mockRejectedValue({ response: { data: {} } });
   });

   afterEach(() => {
      jest.resetAllMocks();
      process.env = originalEnv;
   });

   it('logs a default error message when the Google API response lacks an error string', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const req = {
         method: 'GET',
         query: { code: 'auth-code' },
         headers: { host: 'localhost:3000' },
      } as unknown as NextApiRequest;

      const res = {
         status: jest.fn().mockReturnThis(),
         json: jest.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(db.sync).toHaveBeenCalled();
      expect(verifyUser).toHaveBeenCalledWith(req, res);
      expect(readFile).toHaveBeenCalled();
      expect(OAuth2Client).toHaveBeenCalled();
      expect(getTokenMock).toHaveBeenCalledWith('auth-code');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error Saving the Google Ads Refresh Token. Please Try Again!' });
      expect(logSpy).toHaveBeenCalledWith('[Error] Getting Google Ads Refresh Token! Reason: ', 'Unknown error retrieving Google Ads refresh token.');

      logSpy.mockRestore();
   });
});

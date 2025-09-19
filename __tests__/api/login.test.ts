import type { NextApiRequest, NextApiResponse } from 'next';
import loginHandler from '../../pages/api/login';
import logoutHandler from '../../pages/api/logout';
import verifyUser from '../../utils/verifyUser';

type MutableEnv = NodeJS.ProcessEnv & {
   USER?: string;
   USER_NAME?: string;
   PASSWORD?: string;
   SECRET?: string;
   SESSION_DURATION?: string;
};

const setCookieMock = jest.fn();

jest.mock('cookies', () => ({
   __esModule: true,
   default: jest.fn(() => ({ set: setCookieMock })),
}));

jest.mock('../../utils/verifyUser', () => ({
   __esModule: true,
   default: jest.fn(),
}));

describe('Authentication cookie handling', () => {
   const originalEnv = process.env;

   const createResponse = () => {
      const res = {
         status: jest.fn().mockReturnThis(),
         json: jest.fn(),
      } as unknown as NextApiResponse;
      return res;
   };

   beforeEach(() => {
      (process.env as MutableEnv) = { ...originalEnv };
      (process.env as MutableEnv).USER = 'admin';
      (process.env as MutableEnv).PASSWORD = 'password';
      (process.env as MutableEnv).SECRET = 'shhh';
      (verifyUser as jest.Mock).mockReturnValue('authorized');
      setCookieMock.mockClear();
   });

   afterEach(() => {
      jest.useRealTimers();
      process.env = originalEnv;
   });

   it('sets the cookie maxAge and expires based on the configured session duration', async () => {
      (process.env as MutableEnv).SESSION_DURATION = '12';
      const baseTime = new Date('2024-01-01T00:00:00.000Z');
      jest.useFakeTimers().setSystemTime(baseTime);

      const req = {
         method: 'POST',
         body: { username: 'admin', password: 'password' },
      } as Partial<NextApiRequest>;

      const res = createResponse();

      await loginHandler(req as NextApiRequest, res);

      expect(setCookieMock).toHaveBeenCalledTimes(1);
      const [, , options] = setCookieMock.mock.calls[0];
      expect(options).toMatchObject({
         httpOnly: true,
         sameSite: 'lax',
         maxAge: 12 * 60 * 60 * 1000,
      });
      expect(options.expires).toEqual(new Date(baseTime.getTime() + (12 * 60 * 60 * 1000)));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, error: null });
   });

   it('defaults to a 24 hour session when SESSION_DURATION is missing or invalid', async () => {
      (process.env as MutableEnv).SESSION_DURATION = 'not-a-number';
      const baseTime = new Date('2024-01-01T00:00:00.000Z');
      jest.useFakeTimers().setSystemTime(baseTime);

      const req = {
         method: 'POST',
         body: { username: 'admin', password: 'password' },
      } as Partial<NextApiRequest>;

      const res = createResponse();

      await loginHandler(req as NextApiRequest, res);

      expect(setCookieMock).toHaveBeenCalledTimes(1);
      const [, , options] = setCookieMock.mock.calls[0];
      expect(options.maxAge).toBe(24 * 60 * 60 * 1000);
      expect(options.expires).toEqual(new Date(baseTime.getTime() + (24 * 60 * 60 * 1000)));
   });

   it('clears the authentication cookie on logout', async () => {
      const req = {
         method: 'POST',
         headers: {},
      } as Partial<NextApiRequest>;

      const res = createResponse();

      await logoutHandler(req as NextApiRequest, res);

      expect(verifyUser).toHaveBeenCalledWith(req, res);
      expect(setCookieMock).toHaveBeenCalledWith('token', null, expect.objectContaining({
         httpOnly: true,
         sameSite: 'lax',
         maxAge: 0,
         expires: new Date(0),
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, error: null });
   });
});

import { writeFile } from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/settings';
import verifyUser from '../../utils/verifyUser';

jest.mock('../../utils/verifyUser', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../scrapers/index', () => ({
  __esModule: true,
  default: [],
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

const encryptMock = jest.fn((value: string) => value);

jest.mock('cryptr', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    encrypt: encryptMock,
  })),
}));

describe('PUT /api/settings validation and errors', () => {
  const verifyUserMock = verifyUser as unknown as jest.Mock;
  const writeFileMock = writeFile as unknown as jest.Mock;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, SECRET: 'secret' };
    verifyUserMock.mockReturnValue('authorized');
    encryptMock.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 400 when settings payload is missing', async () => {
    const req = {
      method: 'PUT',
      body: {},
      headers: {},
    } as unknown as NextApiRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(verifyUserMock).toHaveBeenCalledWith(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Settings Data not Provided!' });
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it('returns 500 when persisting encrypted settings fails', async () => {
    writeFileMock.mockRejectedValue(new Error('disk full'));

    const req = {
      method: 'PUT',
      body: { settings: { scaping_api: 'value', smtp_password: 'password' } },
      headers: {},
    } as unknown as NextApiRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(writeFileMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error Updating Settings!', details: 'disk full' });
  });
});

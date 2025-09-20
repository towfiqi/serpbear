import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import handler from '../../pages/api/keywords';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import verifyUser from '../../utils/verifyUser';

jest.mock('../../database/database', () => ({
  __esModule: true,
  default: { sync: jest.fn() },
}));

jest.mock('../../database/models/keyword', () => ({
  __esModule: true,
  default: {
    update: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../../utils/verifyUser', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../utils/refresh', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../scrapers/index', () => ({
  __esModule: true,
  default: [],
}));

describe('PUT /api/keywords error handling', () => {
  const dbMock = db as unknown as { sync: jest.Mock };
  const keywordMock = Keyword as unknown as {
    update: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
  };
  const verifyUserMock = verifyUser as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    dbMock.sync.mockResolvedValue(undefined);
    verifyUserMock.mockReturnValue('authorized');
  });

  it('returns 500 when keyword update fails', async () => {
    const failure = new Error('update failed');
    keywordMock.update.mockRejectedValueOnce(failure);

    const req = {
      method: 'PUT',
      query: { id: '1' },
      body: { sticky: true },
      headers: {},
    } as unknown as NextApiRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(dbMock.sync).toHaveBeenCalled();
    expect(verifyUserMock).toHaveBeenCalledWith(req, res);
    expect(keywordMock.update).toHaveBeenCalledWith({ sticky: true }, { where: { ID: { [Op.in]: [1] } } });
    expect(keywordMock.findAll).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error Updating keywords!', details: 'update failed' });
  });
});

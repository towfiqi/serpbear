import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import handler from '../../pages/api/keywords';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import verifyUser from '../../utils/verifyUser';
import { getAppSettings } from '../../pages/api/settings';
import { getKeywordsVolume, updateKeywordsVolumeData } from '../../utils/adwords';

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
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
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

jest.mock('../../pages/api/settings', () => ({
  __esModule: true,
  getAppSettings: jest.fn(),
}));

jest.mock('../../utils/adwords', () => ({
  __esModule: true,
  getKeywordsVolume: jest.fn(),
  updateKeywordsVolumeData: jest.fn(),
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
    bulkCreate: jest.Mock;
    destroy: jest.Mock;
  };
  const verifyUserMock = verifyUser as unknown as jest.Mock;
  const getAppSettingsMock = getAppSettings as unknown as jest.Mock;
  const getKeywordsVolumeMock = getKeywordsVolume as unknown as jest.Mock;
  const updateKeywordsVolumeDataMock = updateKeywordsVolumeData as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    dbMock.sync.mockResolvedValue(undefined);
    verifyUserMock.mockReturnValue('authorized');
    getAppSettingsMock.mockResolvedValue({
      adwords_account_id: 'acct',
      adwords_client_id: 'client',
      adwords_client_secret: 'secret',
      adwords_developer_token: 'token',
    });
    getKeywordsVolumeMock.mockResolvedValue({ volumes: false });
    updateKeywordsVolumeDataMock.mockResolvedValue(true);
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
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update keywords.', details: 'update failed' });
  });

  it('returns 500 when keyword volume update fails after creation', async () => {
    const newKeywordRecord = {
      get: () => ({
        ID: 1,
        keyword: 'alpha',
        history: '{}',
        tags: '[]',
        lastResult: '[]',
        lastUpdateError: 'false',
        device: 'desktop',
        domain: 'example.com',
        country: 'US',
      }),
    };
    keywordMock.bulkCreate.mockResolvedValue([newKeywordRecord]);
    keywordMock.findAll.mockResolvedValue([]);
    getKeywordsVolumeMock.mockResolvedValue({ volumes: { 1: 100 } });
    const volumeFailure = new Error('volume failure');
    updateKeywordsVolumeDataMock.mockRejectedValue(volumeFailure);

    const req = {
      method: 'POST',
      body: { keywords: [{ keyword: 'alpha', device: 'desktop', country: 'US', domain: 'example.com' }] },
      headers: {},
    } as unknown as NextApiRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(keywordMock.bulkCreate).toHaveBeenCalled();
    expect(getAppSettingsMock).toHaveBeenCalled();
    expect(getKeywordsVolumeMock).toHaveBeenCalled();
    expect(updateKeywordsVolumeDataMock).toHaveBeenCalledWith({ 1: 100 });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to add keywords.', details: 'volume failure' });
  });

  it('returns 400 when keyword payload is missing', async () => {
    const req = {
      method: 'POST',
      body: {},
      headers: {},
    } as unknown as NextApiRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Keyword payload is required.' });
    expect(keywordMock.bulkCreate).not.toHaveBeenCalled();
  });
});

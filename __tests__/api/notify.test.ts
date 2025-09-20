import { NextApiRequest, NextApiResponse } from 'next';
import nodeMailer from 'nodemailer';
import handler from '../../pages/api/notify';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import Keyword from '../../database/models/keyword';
import verifyUser from '../../utils/verifyUser';
import parseKeywords from '../../utils/parseKeywords';
import generateEmail from '../../utils/generateEmail';
import { getAppSettings } from '../../pages/api/settings';

jest.mock('../../database/database', () => ({
  __esModule: true,
  default: { sync: jest.fn() },
}));

jest.mock('../../database/models/domain', () => ({
  __esModule: true,
  default: { findAll: jest.fn(), findOne: jest.fn() },
}));

jest.mock('../../database/models/keyword', () => ({
  __esModule: true,
  default: { findAll: jest.fn() },
}));

jest.mock('../../utils/verifyUser');
jest.mock('../../utils/parseKeywords');
jest.mock('../../utils/generateEmail');
jest.mock('../../utils/emailThrottle', () => ({
  canSendEmail: jest.fn(() => Promise.resolve({ canSend: true })),
  recordEmailSent: jest.fn(() => Promise.resolve()),
}));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

jest.mock('../../pages/api/settings', () => ({
  __esModule: true,
  getAppSettings: jest.fn(),
}));

type MockedResponse = Partial<NextApiResponse> & {
  status: jest.Mock;
  json: jest.Mock;
};

describe('/api/notify - authentication', () => {
  let req: Partial<NextApiRequest>;
  let res: MockedResponse;
  let sendMailMock: jest.Mock;

  beforeEach(() => {
    req = {
      method: 'POST',
      query: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as MockedResponse;

    jest.clearAllMocks();

    sendMailMock = jest.fn().mockResolvedValue(undefined);
    (nodeMailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });
    (db.sync as jest.Mock).mockResolvedValue(undefined);
    (parseKeywords as jest.Mock).mockImplementation((keywords) => keywords);
    (generateEmail as jest.Mock).mockResolvedValue('<html></html>');
    (getAppSettings as jest.Mock).mockResolvedValue({
      smtp_server: 'smtp.test',
      smtp_port: '587',
      smtp_username: '',
      smtp_password: '',
      notification_email: 'notify@example.com',
      notification_email_from: '',
      notification_email_from_name: 'SerpBear',
    });
  });

  it('returns 401 when verification fails', async () => {
    (verifyUser as jest.Mock).mockReturnValue('Not authorized');

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(verifyUser).toHaveBeenCalledWith(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Not authorized' });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('sends notifications when authorized via API key header', async () => {
    req.headers = {
      authorization: 'Bearer valid-key',
    };

    (verifyUser as jest.Mock).mockImplementation((incomingReq: NextApiRequest) => (
      incomingReq.headers?.authorization === 'Bearer valid-key'
        ? 'authorized'
        : 'Invalid API Key Provided.'
    ));

    const domainRecord = {
      get: () => ({
        domain: 'example.com',
        notification: true,
        notification_emails: 'custom@example.com',
      }),
    };

    const keywordRecord = {
      get: () => ({
        keyword: 'rank tracker',
        history: '{}',
        tags: '[]',
        lastResult: '[]',
        lastUpdateError: 'false',
        position: 5,
        country: 'US',
        device: 'desktop',
        city: '',
        state: '',
        lastUpdated: new Date().toISOString(),
      }),
    };

    (Domain.findAll as jest.Mock).mockResolvedValue([domainRecord]);
    (Keyword.findAll as jest.Mock).mockResolvedValue([keywordRecord]);
    (parseKeywords as jest.Mock).mockReturnValue([
      {
        keyword: 'rank tracker',
        history: {},
        tags: [],
        lastResult: [],
        lastUpdateError: false,
        position: 5,
        country: 'US',
        device: 'desktop',
        city: '',
        state: '',
        lastUpdated: new Date().toISOString(),
      },
    ]);

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(verifyUser).toHaveBeenCalledWith(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, error: null });
    expect(Domain.findAll).toHaveBeenCalledTimes(1);
    expect(Keyword.findAll).toHaveBeenCalledWith({ where: { domain: 'example.com' } });
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: 'custom@example.com',
    }));
  });
});

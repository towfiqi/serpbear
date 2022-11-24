import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import verifyUser from '../../utils/verifyUser';

type logoutResponse = {
   success?: boolean
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method === 'POST') {
      return logout(req, res);
   }
   return res.status(401).json({ success: false, error: 'Invalid Method' });
}

const logout = async (req: NextApiRequest, res: NextApiResponse<logoutResponse>) => {
   const cookies = new Cookies(req, res);
   cookies.set('token', null, { maxAge: new Date().getTime() });
   return res.status(200).json({ success: true, error: null });
};

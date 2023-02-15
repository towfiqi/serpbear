import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import Cookies from 'cookies';

type loginResponse = {
   success?: boolean
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method === 'POST') {
      return loginUser(req, res);
   }
   return res.status(401).json({ success: false, error: 'Invalid Method' });
}

const loginUser = async (req: NextApiRequest, res: NextApiResponse<loginResponse>) => {
   if (!req.body.username || !req.body.password) {
      return res.status(401).json({ error: 'Username Password Missing' });
   }
   const userName = process.env.USER_NAME ? process.env.USER_NAME : process.env.USER;

   if (req.body.username === userName
      && req.body.password === process.env.PASSWORD && process.env.SECRET) {
      const token = jwt.sign({ user: userName }, process.env.SECRET);
      const cookies = new Cookies(req, res);
      const expireDate = new Date();
      const sessDuration = process.env.SESSION_DURATION;
      expireDate.setHours((sessDuration && parseInt(sessDuration, 10)) || 24);
      cookies.set('token', token, { httpOnly: true, sameSite: 'lax', maxAge: expireDate.getTime() });
      return res.status(200).json({ success: true, error: null });
   }

   const error = req.body.username !== userName ? 'Incorrect Username' : 'Incorrect Password';

   return res.status(401).json({ success: false, error });
};

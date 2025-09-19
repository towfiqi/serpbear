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
      const parsedDuration = Number.parseInt(process.env.SESSION_DURATION ?? '', 10);
      const sessionDurationHours = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 24;
      const sessionDurationMs = sessionDurationHours * 60 * 60 * 1000;
      const expiryDate = new Date(Date.now() + sessionDurationMs);
      cookies.set('token', token, {
         httpOnly: true,
         sameSite: 'lax',
         maxAge: sessionDurationMs,
         expires: expiryDate,
      });
      return res.status(200).json({ success: true, error: null });
   }

   const error = req.body.username !== userName ? 'Incorrect Username' : 'Incorrect Password';

   return res.status(401).json({ success: false, error });
};

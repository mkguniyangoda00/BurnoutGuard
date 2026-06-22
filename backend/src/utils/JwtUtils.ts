import jwt from 'jsonwebtoken';
import { Env } from '../config/Env';

interface JwtPayload {
  userId: string;
  role: string;
}

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, Env.JWT_SECRET, {
    expiresIn: Env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, Env.JWT_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }
  return decoded as JwtPayload;
};

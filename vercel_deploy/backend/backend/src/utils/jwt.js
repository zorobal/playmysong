import jwt from 'jsonwebtoken';

export function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' });
}

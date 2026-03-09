import express from 'express';
import bcryptjs from 'bcryptjs';
import { sign } from '../utils/jwt.js';

const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcryptjs.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = sign({
      userId: user.id,
      establishmentId: user.establishmentId,
      role: user.role,
    });

    res.json({
      token,
      role: user.role,
      establishmentId: user.establishmentId,
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;


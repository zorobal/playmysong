const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is alive' });
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

app.get('/api/establishments', async (req, res) => {
  try {
    const establishments = await prisma.establishment.findMany();
    res.json(establishments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/seed', async (req, res) => {
  try {
    const email = "SuperAdmin@playmysong.local";
    const password = "Vito";
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.json({ message: "SuperAdmin already exists", email });
    }
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Super Admin",
        role: "SUPER_ADMIN",
        isActive: true
      }
    });
    
    res.json({ message: "SuperAdmin created", email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;

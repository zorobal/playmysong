const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');

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
    const establishments = await prisma.establishment.findMany({
      where: { isActive: true }
    });
    res.json(establishments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;

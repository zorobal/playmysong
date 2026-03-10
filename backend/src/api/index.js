const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

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

app.post('/api/establishments', async (req, res) => {
  try {
    const { name, city, district, phoneNumber, additionalInfo, ownerId } = req.body;
    const establishment = await prisma.establishment.create({
      data: {
        name,
        city,
        district,
        phoneNumber,
        additionalInfo,
        ownerId
      }
    });
    res.json(establishment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/establishments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const establishment = await prisma.establishment.findUnique({
      where: { id },
      include: { users: true }
    });
    if (!establishment) {
      return res.status(404).json({ error: "Établissement non trouvé" });
    }
    res.json(establishment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/establishments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.establishment.delete({ where: { id } });
    res.json({ message: "Établissement supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/establishments/:id/admins', async (req, res) => {
  try {
    const { id } = req.params;
    const { admins } = req.body;
    
    const createdAdmins = [];
    for (const admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.password || 'password123', 12);
      const user = await prisma.user.create({
        data: {
          email: admin.email,
          password: hashedPassword,
          name: admin.name,
          role: 'ADMIN',
          establishmentId: id,
          isActive: true
        }
      });
      createdAdmins.push(user);
    }
    
    res.json(createdAdmins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, password, name, role, establishmentId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'USER',
        establishmentId
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/playlists', async (req, res) => {
  try {
    const { establishmentId } = req.query;
    const where = establishmentId ? { establishmentId } : {};
    const playlists = await prisma.playlist.findMany({
      where,
      include: { songs: true }
    });
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/playlists', async (req, res) => {
  try {
    const { name, establishmentId, createdBy } = req.body;
    const playlist = await prisma.playlist.create({
      data: {
        name,
        establishmentId,
        createdBy
      }
    });
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/playlists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.playlist.delete({ where: { id } });
    res.json({ message: "Playlist supprimée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/playlists/:id/songs', async (req, res) => {
  try {
    const { id } = req.params;
    const songs = await prisma.song.findMany({
      where: { playlistId: id }
    });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/playlists/:id/musics', async (req, res) => {
  try {
    const { id } = req.params;
    const songs = await prisma.song.findMany({
      where: { playlistId: id }
    });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/playlists/:id/songs', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, youtubeId, filePath, duration } = req.body;
    const song = await prisma.song.create({
      data: {
        title,
        artist,
        youtubeId,
        filePath,
        duration: duration || 0,
        playlistId: id
      }
    });
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/playlists/:id/musics', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, youtubeId, filePath, duration } = req.body;
    const song = await prisma.song.create({
      data: {
        title,
        artist,
        youtubeId,
        filePath,
        duration: duration || 0,
        playlistId: id
      }
    });
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/songs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.song.delete({ where: { id } });
    res.json({ message: "Song supprimée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/playlists/:playlistId/musics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.song.delete({ where: { id } });
    res.json({ message: "Musique supprimée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/requests', async (req, res) => {
  try {
    const { establishmentId, status } = req.query;
    const where = {};
    if (establishmentId) where.establishmentId = establishmentId;
    if (status) where.status = status;
    
    const requests = await prisma.songRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const { establishmentId, youtubeId, title, artist, message, selfieUrl, filePath, createdByUserId } = req.body;
    const request = await prisma.songRequest.create({
      data: {
        establishmentId,
        youtubeId,
        title,
        artist,
        message,
        selfieUrl,
        filePath,
        createdByUserId,
        status: 'PENDING'
      }
    });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, handledByUserId } = req.body;
    const request = await prisma.songRequest.update({
      where: { id },
      data: {
        status,
        rejectionReason,
        handledByUserId
      }
    });
    res.json(request);
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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;

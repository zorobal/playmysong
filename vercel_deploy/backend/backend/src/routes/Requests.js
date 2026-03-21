import express from 'express';
import crypto from 'crypto'; // Import correct de crypto
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { PrismaClient } from "@prisma/client";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const router = express.Router();

const SELFIE_DIR = path.join(__dirname, "../../selfies");
if (!fs.existsSync(SELFIE_DIR)) {
  fs.mkdirSync(SELFIE_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, SELFIE_DIR),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error("Only images allowed"));
  }
});

router.post('/', upload.single('selfie'), async (req, res) => {
  const { establishmentId, youtubeId, title, artist, durationSec, message, filePath, consent } = req.body;
  
  console.log("Request received:", { establishmentId, title, youtubeId, artist });
  
  if (!establishmentId || !title) {
    console.log("Missing fields:", { establishmentId, title });
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const pendingCount = await prisma.songRequest.count({
      where: { establishmentId, status: 'PENDING' }
    });
    const position = pendingCount + 1;
    
    const selfieUrl = req.file ? `/selfies/${req.file.filename}` : null;
    
    const newRequest = await prisma.songRequest.create({
      data: {
        establishmentId,
        youtubeId,
        title,
        artist,
        durationSec: durationSec ? parseInt(durationSec) : 0,
        message,
        selfieUrl,
        filePath,
        position,
        status: 'PENDING'
      }
    });

    const io = req.app.locals.io;
    io.to(`est_${establishmentId}`).emit('new_request', { 
      request: { 
        id: newRequest.id, 
        youtubeId, 
        title, 
        artist, 
        message, 
        selfieUrl,
        filePath,
        position, 
        status: 'PENDING',
        createdAt: new Date()
      } 
    });

    res.json({ requestId: newRequest.id, position });
  } catch (err) {
    console.error("Error in POST /request:", err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

router.get('/pending', authenticateToken, authorizeRoles('ADMIN', 'OPERATOR', 'USER'), async (req, res) => {
  try {
    const userId = req.user.id;
    const usersArray = await prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${userId}`;
    const currentUser = usersArray[0];
    const establishmentId = currentUser.establishmentId;
    
    if (!establishmentId) {
      return res.status(400).json({ error: "Aucun établissement associé" });
    }
    
    const pending = await prisma.$queryRaw`
      SELECT * FROM "SongRequest" WHERE "establishmentId" = ${establishmentId} AND status = 'PENDING' ORDER BY "createdAt" ASC
    `;
    
    res.json(pending || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/validate', authenticateToken, authorizeRoles('ADMIN', 'OPERATOR', 'USER'), async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  
  try {
    // Vérifier si une chanson est déjà en cours de lecture
    const currentlyPlaying = await prisma.$queryRaw`
      SELECT * FROM "SongRequest" WHERE "establishmentId" = ${req.user.establishmentId} AND status = 'PLAYING' LIMIT 1
    `;
    
    const newStatus = currentlyPlaying && currentlyPlaying.length > 0 ? 'VALIDATED' : 'PLAYING';
    
    const updatedRequest = await prisma.songRequest.update({
      where: { id: id },
      data: {
        status: newStatus,
        handledByUserId: userId,
        updatedAt: new Date(),
      },
      include: { establishment: true }
    });
    
    const io = req.app.locals.io;
    const establishmentId = updatedRequest.establishmentId;
    
    if (newStatus === 'PLAYING') {
      // Émettre l'événement pour démarrer la lecture
      io.to(`est_${establishmentId}`).emit('now_playing_updated', { 
        song: updatedRequest,
        action: 'start'
      });
    }
    
    io.to(`est_${establishmentId}`).emit('request_validated', { request: updatedRequest });
    io.to(`est_${establishmentId}`).emit('playlist_updated', { updatedRequest });

    res.json({ ok: true, status: newStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Marquer la chanson en cours comme terminée et passer à la suivante
router.post('/:id/complete', authenticateToken, authorizeRoles('ADMIN', 'OPERATOR', 'USER'), async (req, res) => {
  const id = req.params.id;
  
  try {
    // Marquer la chanson actuelle comme terminée
    await prisma.$queryRaw`
      UPDATE "SongRequest" SET status = 'COMPLETED', "updatedAt" = NOW() WHERE id = ${id}
    `;
    
    // Trouver la prochaine chanson validée
    const nextSong = await prisma.$queryRaw`
      SELECT * FROM "SongRequest" 
      WHERE "establishmentId" = ${req.user.establishmentId} 
      AND status = 'VALIDATED' 
      ORDER BY "createdAt" ASC 
      LIMIT 1
    `;
    
    const io = req.app.locals.io;
    const establishmentId = req.user.establishmentId;
    
    if (nextSong && nextSong.length > 0) {
      // Mettre à jour le statut de la prochaine chanson
      await prisma.$queryRaw`
        UPDATE "SongRequest" SET status = 'PLAYING', "updatedAt" = NOW() WHERE id = ${nextSong[0].id}
      `;
      
      // Recharger la chanson avec le nouveau statut
      const updatedNextSong = await prisma.$queryRaw`
        SELECT * FROM "SongRequest" WHERE id = ${nextSong[0].id}
      `;
      
      // Émettre l'événement pour lire la prochaine chanson
      io.to(`est_${establishmentId}`).emit('now_playing_updated', { 
        song: updatedNextSong[0],
        action: 'next'
      });
    } else {
      // Aucune chanson suivante
      io.to(`est_${establishmentId}`).emit('now_playing_updated', { 
        song: null,
        action: 'stop'
      });
    }
    
    io.to(`est_${establishmentId}`).emit('playlist_updated', {});
    
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/reject', authenticateToken, authorizeRoles('ADMIN', 'OPERATOR', 'USER'), async (req, res) => {
  const id = req.params.id;
  const { reason } = req.body;
  const userId = req.user.id;
  try {
    await prisma.$queryRaw`UPDATE "SongRequest" SET status = 'REJECTED', "rejectionReason" = ${reason}, "handledByUserId" = ${userId}, "updatedAt" = NOW() WHERE id = ${id}`;

    const io = req.app.locals.io;
    io.to(`est_${req.user.establishmentId}`).emit('request_rejected', { requestId: id, reason });
    // No playlist_updated here, just rejection notification

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/playlist/current', async (req, res) => {
  const establishmentId = req.query.establishmentId;
  if (!establishmentId) return res.status(400).json({ error: 'Missing establishmentId' });

  try {
    const queue = await prisma.$queryRaw`
      SELECT * FROM "SongRequest" WHERE "establishmentId" = ${establishmentId} AND status = 'VALIDATED' ORDER BY "createdAt" ASC
    `;

    res.json({ nowPlaying: queue && queue.length > 0 ? queue[0] : null, queue: queue || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route pour obtenir les statistiques des demandes
router.get('/stats', authenticateToken, authorizeRoles('ADMIN', 'OPERATOR', 'USER'), async (req, res) => {
  try {
    const userId = req.user.id;
    const usersArray = await prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${userId}`;
    const currentUser = usersArray[0];
    const establishmentId = currentUser.establishmentId;
    
    if (!establishmentId) {
      return res.status(400).json({ error: "Aucun établissement associé" });
    }
    
    const totalResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "SongRequest" WHERE "establishmentId" = ${establishmentId}
    `;
    const pendingResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "SongRequest" WHERE "establishmentId" = ${establishmentId} AND status = 'PENDING'
    `;
    const validatedResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "SongRequest" WHERE "establishmentId" = ${establishmentId} AND status = 'VALIDATED'
    `;
    const rejectedResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "SongRequest" WHERE "establishmentId" = ${establishmentId} AND status = 'REJECTED'
    `;
    
    res.json({
      total: parseInt(totalResult[0]?.count || 0),
      pending: parseInt(pendingResult[0]?.count || 0),
      validated: parseInt(validatedResult[0]?.count || 0),
      rejected: parseInt(rejectedResult[0]?.count || 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

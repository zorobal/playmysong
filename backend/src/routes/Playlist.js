import express from 'express';
import crypto from 'crypto';
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { PrismaClient } from "@prisma/client";
import * as mm from "music-metadata";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|flac|wav|ogg|m4a|aac/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('audio/');
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error("Type de fichier non supporte"));
  }
});

router.get("/", authenticateToken, authorizeRoles("ADMIN", "OPERATOR", "USER"), async (req, res) => {
  try {
    const userId = req.user.id;
    const usersArray = await prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${userId}`;

    if (!usersArray || usersArray.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouve" });
    }

    const currentUser = usersArray[0];
    const establishmentId = currentUser.establishmentId;

    if (!establishmentId) {
      return res.status(400).json({ error: "Aucun etablissement associe" });
    }

    const playlists = await prisma.$queryRaw`
      SELECT * FROM "Playlist" WHERE "establishmentId" = ${establishmentId}
    `;

    const playlistsWithSongs = await Promise.all(
      (playlists || []).map(async (pl) => {
        const songs = await prisma.$queryRaw`SELECT * FROM "Song" WHERE "playlistId" = ${pl.id}`;
        return { ...pl, songs: songs || [] };
      })
    );

    res.json(playlistsWithSongs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des playlists" });
  }
});

router.get("/public", async (req, res) => {
  try {
    const { establishmentId } = req.query;

    if (!establishmentId) {
      return res.status(400).json({ error: "establishmentId requis" });
    }

    const playlists = await prisma.$queryRaw`
      SELECT * FROM "Playlist" WHERE "establishmentId" = ${establishmentId}
    `;

    const playlistsWithSongs = await Promise.all(
      (playlists || []).map(async (pl) => {
        const songs = await prisma.$queryRaw`SELECT * FROM "Song" WHERE "playlistId" = ${pl.id}`;
        return { ...pl, songs: songs || [] };
      })
    );

    res.json(playlistsWithSongs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des playlists" });
  }
});

router.get("/:id/songs", async (req, res) => {
  try {
    const playlistId = req.params.id;
    const songs = await prisma.$queryRaw`SELECT * FROM "Song" WHERE "playlistId" = ${playlistId}`;
    res.json(songs || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des chansons" });
  }
});

router.post("/", authenticateToken, authorizeRoles("ADMIN", "USER"), async (req, res) => {
  try {
    const userId = req.user.id;
    const usersArray = await prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${userId}`;
    const currentUser = usersArray[0];
    const establishmentId = currentUser.establishmentId;

    if (!establishmentId) {
      return res.status(400).json({ error: "Aucun etablissement associe" });
    }

    const { name, isEstablishmentPlaylist } = req.body;
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName) {
      return res.status(400).json({ error: "Le nom de la playlist est requis" });
    }

    const playlistId = crypto.randomUUID();
    const creatorName = currentUser.name || currentUser.email;
    const establishmentPlaylistFlag = Boolean(isEstablishmentPlaylist);

    if (establishmentPlaylistFlag) {
      await prisma.$queryRaw`
        UPDATE "Playlist"
        SET "isEstablishmentPlaylist" = false
        WHERE "establishmentId" = ${establishmentId} AND "isEstablishmentPlaylist" = true
      `;
    }

    await prisma.$queryRaw`
      INSERT INTO "Playlist" (id, name, "establishmentId", "createdBy", "createdAt", "isEstablishmentPlaylist")
      VALUES (${playlistId}, ${trimmedName}, ${establishmentId}, ${creatorName}, NOW(), ${establishmentPlaylistFlag})
    `;

    res.json({
      id: playlistId,
      name: trimmedName,
      establishmentId,
      isEstablishmentPlaylist: establishmentPlaylistFlag,
      songs: []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la creation de la playlist" });
  }
});

router.post("/:id/set-establishment", authenticateToken, authorizeRoles("ADMIN", "USER"), async (req, res) => {
  try {
    const playlistId = req.params.id;

    const playlists = await prisma.$queryRaw`
      SELECT * FROM "Playlist" WHERE id = ${playlistId}
    `;

    if (!playlists || playlists.length === 0) {
      return res.status(404).json({ error: "Playlist introuvable" });
    }

    const playlist = playlists[0];

    await prisma.$queryRaw`
      UPDATE "Playlist"
      SET "isEstablishmentPlaylist" = false
      WHERE "establishmentId" = ${playlist.establishmentId} AND "isEstablishmentPlaylist" = true
    `;

    await prisma.$queryRaw`
      UPDATE "Playlist"
      SET "isEstablishmentPlaylist" = true
      WHERE id = ${playlistId}
    `;

    res.json({ ok: true, playlistId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise a jour de la playlist etablissement" });
  }
});

router.post("/:id/musics", authenticateToken, authorizeRoles("ADMIN", "USER"), async (req, res) => {
  try {
    const playlistId = req.params.id;
    const { title, artist } = req.body;
    const songId = crypto.randomUUID();

    await prisma.$queryRaw`
      INSERT INTO "Song" (id, title, artist, "playlistId", "createdAt")
      VALUES (${songId}, ${title}, ${artist}, ${playlistId}, NOW())
    `;

    res.json({ id: songId, title, artist, playlistId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout de la musique" });
  }
});

router.post("/:id/upload", authenticateToken, authorizeRoles("ADMIN", "USER"), upload.single("audio"), async (req, res) => {
  try {
    const playlistId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier fourni" });
    }

    const filePath = req.file.path;
    const metadata = await mm.parseFile(filePath);
    const songId = crypto.randomUUID();

    const title = metadata.common.title || path.basename(req.file.originalname, path.extname(req.file.originalname));
    const artist = metadata.common.artist || "Artiste Inconnu";
    const duration = Math.round(metadata.format.duration || 0);

    await prisma.$queryRaw`
      INSERT INTO "Song" (id, title, artist, "filePath", duration, "playlistId", "createdAt")
      VALUES (${songId}, ${title}, ${artist}, ${filePath}, ${duration}, ${playlistId}, NOW())
    `;

    res.json({
      id: songId,
      title,
      artist,
      filePath,
      duration,
      playlistId,
      originalName: req.file.originalname
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'upload: " + err.message });
  }
});

router.post("/:id/local-file", authenticateToken, authorizeRoles("ADMIN", "USER"), async (req, res) => {
  try {
    const playlistId = req.params.id;
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: "Chemin du fichier requis" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: "Fichier introuvable" });
    }

    const metadata = await mm.parseFile(filePath);
    const songId = crypto.randomUUID();

    const title = metadata.common.title || path.basename(filePath, path.extname(filePath));
    const artist = metadata.common.artist || "Artiste Inconnu";
    const duration = Math.round(metadata.format.duration || 0);

    await prisma.$queryRaw`
      INSERT INTO "Song" (id, title, artist, "filePath", duration, "playlistId", "createdAt")
      VALUES (${songId}, ${title}, ${artist}, ${filePath}, ${duration}, ${playlistId}, NOW())
    `;

    res.json({
      id: songId,
      title,
      artist,
      filePath,
      duration,
      playlistId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout du fichier: " + err.message });
  }
});

router.delete("/:id", authenticateToken, authorizeRoles("ADMIN", "USER"), async (req, res) => {
  try {
    const playlistId = req.params.id;
    await prisma.$queryRaw`DELETE FROM "Song" WHERE "playlistId" = ${playlistId}`;
    await prisma.$queryRaw`DELETE FROM "Playlist" WHERE id = ${playlistId}`;
    res.json({ message: "Playlist supprimee avec succes" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

router.delete("/:playlistId/musics/:musicId", authenticateToken, authorizeRoles("ADMIN", "USER"), async (req, res) => {
  try {
    const { musicId } = req.params;
    await prisma.$queryRaw`DELETE FROM "Song" WHERE id = ${musicId}`;
    res.json({ message: "Musique supprimee avec succes" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

export default router;

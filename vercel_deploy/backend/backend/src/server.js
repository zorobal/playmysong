import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
import authRoutes from "./routes/authRoutes.js";
import youtubeRoutes from "./routes/Youtube.js";
import requestRoutes from "./routes/Requests.js";
import playlistRoutes from "./routes/Playlist.js";
import establishmentsRouter from "./routes/Establishments.js";
import adminsRoutes from "./routes/Admins.js";
import usersRoutes from "./routes/Users.js";
import statsRoutes from "./routes/Stats.js";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true
  },
  transports: ["polling", "websocket"]
});

const prisma = new PrismaClient();

app.locals.io = io;

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join_establishment", (establishmentId) => {
    socket.join(`est_${establishmentId}`);
  });

  socket.on("leave_establishment", (establishmentId) => {
    socket.leave(`est_${establishmentId}`);
  });
});

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "*",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const uploadsDir = path.join(__dirname, "../uploads");
const selfiesDir = path.join(__dirname, "../selfies");
const qrcodesDir = path.join(__dirname, "../qrcodes");

if (existsSync(uploadsDir)) app.use("/uploads", express.static(uploadsDir));
if (existsSync(selfiesDir)) app.use("/selfies", express.static(selfiesDir));
if (existsSync(qrcodesDir)) app.use("/qrcodes", express.static(qrcodesDir));

app.get("/", (req, res) => {
  res.send("Backend is alive");
});

app.locals.prisma = prisma;

app.use("/auth", authRoutes);
app.use("/youtube", youtubeRoutes);
app.use("/request", requestRoutes);
app.use("/playlists", playlistRoutes);
app.use("/establishments", establishmentsRouter);
app.use("/admins", adminsRoutes);
app.use("/users", usersRoutes);
app.use("/stats", statsRoutes);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

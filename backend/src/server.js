import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
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
  }
});

const prisma = new PrismaClient();

// Store io in app.locals for use in routes
app.locals.io = io;

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join establishment room
  socket.on("join_establishment", (establishmentId) => {
    socket.join(`est_${establishmentId}`);
    console.log(`Socket ${socket.id} joined room est_${establishmentId}`);
  });

  // Leave establishment room
  socket.on("leave_establishment", (establishmentId) => {
    socket.leave(`est_${establishmentId}`);
    console.log(`Socket ${socket.id} left room est_${establishmentId}`);
  });

  // Add more socket handlers here as needed
});

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/selfies", express.static(path.join(__dirname, "../selfies")));
app.use("/qrcodes", express.static(path.join(__dirname, "../qrcodes")));

app.get("/", (req, res) => {
  res.send("Backend is alive");
});

// attach prisma to app.locals
app.locals.prisma = prisma;

// routes
app.use("/auth", authRoutes);
app.use("/youtube", youtubeRoutes);
app.use("/request", requestRoutes);
app.use("/playlists", playlistRoutes);
app.use("/establishments", establishmentsRouter);
app.use("/admins", adminsRoutes);
app.use("/users", usersRoutes);
app.use("/stats", statsRoutes);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

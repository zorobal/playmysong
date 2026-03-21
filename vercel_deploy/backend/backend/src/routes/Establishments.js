import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
  try {
    const establishments = await prisma.$queryRaw`SELECT * FROM "Establishment" ORDER BY "createdAt" DESC`;
    
    // Fetch users and playlists for each establishment
    const establishmentsWithUsers = await Promise.all(
      establishments.map(async (est) => {
        const users = await prisma.$queryRaw`SELECT id, email, name, "phoneNumber", role, "establishmentId", "createdBy", "isActive", "createdAt", "updatedAt" FROM "User" WHERE "establishmentId" = ${est.id}`;
        const playlists = await prisma.$queryRaw`SELECT * FROM "Playlist" WHERE "establishmentId" = ${est.id}`;
        return { ...est, users: users || [], playlists: playlists || [] };
      })
    );
    
    res.json(establishmentsWithUsers);
  } catch (err) {
    console.error("Error fetching establishments:", err);
    res.status(500).json({ error: "Failed to fetch establishments" });
  }
});

router.get("/public/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const establishments = await prisma.$queryRaw`SELECT * FROM "Establishment" WHERE id = ${id}`;
    if (!establishments || establishments.length === 0) {
      return res.status(404).json({ error: "Establishment not found" });
    }
    res.json(establishments[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch establishment" });
  }
});

router.get("/:id", authenticateToken, authorizeRoles("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const establishments = await prisma.$queryRaw`SELECT * FROM "Establishment" WHERE id = ${id}`;
    if (!establishments || establishments.length === 0) {
      return res.status(404).json({ error: "Establishment not found" });
    }
    const users = await prisma.$queryRaw`SELECT * FROM "User" WHERE "establishmentId" = ${id}`;
    res.json({ ...establishments[0], users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch establishment" });
  }
});

router.post("/", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
  const { name, city, district, phoneNumber, additionalInfo } = req.body;
  try {
    const id = crypto.randomUUID();
    const createdAt = new Date();
    await prisma.$queryRaw`
      INSERT INTO "Establishment" (id, name, city, district, "phoneNumber", "additionalInfo", "createdAt", "updatedAt")
      VALUES (${id}, ${name}, ${city}, ${district}, ${phoneNumber}, ${additionalInfo}, ${createdAt}, ${createdAt})
    `;
    res.json({ id, name, city, district, phoneNumber, additionalInfo, createdAt, users: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create establishment" });
  }
});

router.put("/:id", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
  const { id } = req.params;
  const { name, city, district, phoneNumber, additionalInfo } = req.body;
  try {
    await prisma.$queryRaw`
      UPDATE "Establishment" 
      SET name = ${name}, city = ${city}, district = ${district}, 
          "phoneNumber" = ${phoneNumber}, "additionalInfo" = ${additionalInfo}, "updatedAt" = NOW()
      WHERE id = ${id}
    `;
    res.json({ id, name, city, district, phoneNumber, additionalInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update establishment" });
  }
});

router.delete("/:id", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$queryRaw`DELETE FROM "Establishment" WHERE id = ${id}`;
    res.json({ message: "Establishment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete establishment" });
  }
});

router.post("/:id/admins", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
  const { id } = req.params;
  const { admins } = req.body;

  try {
    const createdAdmins = [];
    for (const admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      const user = await prisma.user.create({
        data: {
          email: admin.email,
          password: hashedPassword,
          name: admin.name,
          phoneNumber: admin.phoneNumber,
          role: 'ADMIN',
          establishmentId: id,
          createdBy: 'SuperAdmin',
          isActive: true
        }
      });
      createdAdmins.push({ id: user.id, email: user.email, name: user.name, role: 'ADMIN' });
    }
    res.json({ message: "Admins created", admins: createdAdmins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create admins: " + err.message });
  }
});

export default router;

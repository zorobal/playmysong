import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("ADMIN", "OPERATOR"), async (req, res) => {
  try {
    console.log("GET /users - user:", req.user);
    const userId = req.user.id;
    console.log("User ID:", userId);
    
    const usersArray = await prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${userId}`;
    console.log("Users found:", usersArray);
    
    if (!usersArray || usersArray.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    
    const currentUser = usersArray[0];
    console.log("Current user:", currentUser);
    console.log("Establishment ID:", currentUser.establishmentId);
    
    const establishmentId = currentUser.establishmentId;
    
    if (!establishmentId) {
      return res.status(400).json({ error: "Aucun établissement associé à cet admin" });
    }
    
    const users = await prisma.$queryRaw`
      SELECT id, email, name, "phoneNumber", role, "establishmentId", "isActive", "createdAt", "updatedAt", "createdBy" 
      FROM "User" 
      WHERE "establishmentId" = ${establishmentId} AND role = 'USER'
    `;
    
    console.log("Found users:", users);
    res.json(users || []);
  } catch (err) {
    console.error("Error in GET /users:", err);
    res.status(500).json({ error: "Erreur lors du chargement des utilisateurs" });
  }
});

router.post("/", authenticateToken, authorizeRoles("ADMIN", "OPERATOR"), async (req, res) => {
  try {
    console.log("POST /users - user:", req.user);
    const userId = req.user.id;
    const usersArray = await prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${userId}`;
    const currentUser = usersArray[0];
    const establishmentId = currentUser.establishmentId;
    
    console.log("Creating user for establishment:", establishmentId);
    
    if (!establishmentId) {
      return res.status(400).json({ error: "Aucun établissement associé à cet admin" });
    }
    
    const { name, email, password, phoneNumber } = req.body;
    console.log("User data:", { name, email, phoneNumber });
    
    const hashedPassword = await bcrypt.hash(password || "password123", 12);
    const newUserId = crypto.randomUUID();
    const creatorName = currentUser.name || currentUser.email;
    
    await prisma.$queryRaw`
      INSERT INTO "User" (id, email, password, name, "phoneNumber", role, "establishmentId", "createdBy", "isActive", "createdAt", "updatedAt")
      VALUES (${newUserId}, ${email}, ${hashedPassword}, ${name}, ${phoneNumber}, 'USER', ${establishmentId}, ${creatorName}, true, NOW(), NOW())
    `;
    
    console.log("User created successfully");
    res.json({ id: newUserId, name, email, phoneNumber, role: 'USER' });
  } catch (err) {
    console.error("Error in POST /users:", err);
    res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
  }
});

router.delete("/:id", authenticateToken, authorizeRoles("ADMIN", "OPERATOR"), async (req, res) => {
  try {
    const userId = req.params.id;
    await prisma.$queryRaw`DELETE FROM "User" WHERE id = ${userId}`;
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

export default router;

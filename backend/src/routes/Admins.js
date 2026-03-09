import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

router.delete("/:id", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
  try {
    const adminId = req.params.id;
    await prisma.$queryRaw`DELETE FROM "User" WHERE id = ${adminId}`;
    res.json({ message: "Administrateur supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression de l'administrateur" });
  }
});

router.get("/me", authenticateToken, authorizeRoles("ADMIN", "OPERATOR", "SUPER_ADMIN", "USER"), async (req, res) => {
  try {
    const userId = req.user.id;
    const users = await prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${userId}`;
    
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    
    const user = users[0];
    
    // Get establishment if user has one
    let establishment = null;
    if (user.establishmentId) {
      const establishments = await prisma.$queryRaw`SELECT * FROM "Establishment" WHERE id = ${user.establishmentId}`;
      if (establishments && establishments.length > 0) {
        establishment = establishments[0];
      }
    }
    
    res.json({ ...user, establishment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des infos" });
  }
});

export default router;

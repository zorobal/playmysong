import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import prisma from "../prismaClient.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("SUPER_ADMIN"), async (req, res) => {
  try {
    const [establishmentsCount, usersCount, totalRequests] = await Promise.all([
      prisma.establishment.count(),
      prisma.user.count(),
      prisma.songRequest.count()
    ]);

    const requestsByStatus = await prisma.songRequest.groupBy({
      by: ['status'],
      _count: true
    });

    const requestsByType = await prisma.establishment.findMany({
      include: {
        _count: { select: { songRequests: true } }
      }
    });

    res.json({
      establishmentsCount,
      usersCount,
      totalRequests,
      requestsByStatus: requestsByStatus.reduce((acc, r) => {
        acc[r.status] = r._count;
        return acc;
      }, {}),
      requestsByEstablishment: requestsByType.map(e => ({
        name: e.name,
        count: e._count.songRequests
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch global stats" });
  }
});

export default router;

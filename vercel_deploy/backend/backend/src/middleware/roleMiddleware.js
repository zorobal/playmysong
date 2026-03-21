// src/middleware/roleMiddleware.js
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }

    next();
  };
}

// ✅ alias pour compatibilité
export const requireRole = authorizeRoles;

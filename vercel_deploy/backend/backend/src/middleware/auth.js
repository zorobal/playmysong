import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    decoded.role = decoded.role ? String(decoded.role).toUpperCase() : null;
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles.map(r => String(r).toUpperCase()) : [String(roles).toUpperCase()];
  return (req, res, next) => {
    if (!req.user || !req.user.role) return res.status(403).json({ error: "Access denied" });
    if (allowed.includes(String(req.user.role).toUpperCase()) || String(req.user.role).toUpperCase() === "SUPER_ADMIN") return next();
    return res.status(403).json({ error: "Access denied" });
  };
}

export function requireEstablishmentMatch(paramName = "establishmentId") {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (String(req.user.role).toUpperCase() === "SUPER_ADMIN") return next();
    const target = req.params[paramName] || req.body[paramName] || req.query[paramName];
    if (!target) return res.status(400).json({ error: "Missing target establishment" });
    if (String(req.user.establishmentId) === String(target)) return next();
    return res.status(403).json({ error: "Forbidden" });
  };
}

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";   // version JS, plus simple sous Windows
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Helpers
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

// Controllers
export async function login(req, res) {
  console.log("Login route hit", req.body);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    console.log("User found:", user);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", valid);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function refreshToken(req, res) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ error: "Invalid refresh token" });

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const accessToken = generateAccessToken(user);
      res.json({ accessToken });
    });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function logout(req, res) {
  try {
    res.clearCookie("refreshToken");
    res.json({ ok: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function registerWithInvite(req, res) {
  console.log("Register route hit", req.body);
  try {
    const { inviteToken, email, password, name } = req.body;
    if (!inviteToken || !email || !password || !name) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Vérifie le token d’invitation (à adapter selon ta logique)
    const invite = await prisma.invite.findUnique({ where: { token: inviteToken } });
    if (!invite || invite.used) {
      return res.status(400).json({ error: "Invalid or expired invite token" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: "USER",
        establishmentId: invite.establishmentId,
      },
    });

    // Marque l’invitation comme utilisée
    await prisma.invite.update({
      where: { token: inviteToken },
      data: { used: true },
    });

    res.json({ ok: true, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

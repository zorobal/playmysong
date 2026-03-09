// backend/prisma/seed.js
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "SuperAdmin@playmysong.local";
  const password = "Vito";
  const name = "Super Admin";

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Vérifier si déjà présent
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("SuperAdmin already exists:", email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: "SUPER_ADMIN",
      isActive: true
    }
  });

  console.log("Created SuperAdmin:", user.email);
  console.log("Password: Vito");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

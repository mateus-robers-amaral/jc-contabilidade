import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Garantir que o usuario admin existe
  const hashedPassword = await bcrypt.hash("5308231440Jc", 12);

  await prisma.user.upsert({
    where: { email: "jeancramaral@gmail.com" },
    update: {},
    create: {
      email: "jeancramaral@gmail.com",
      password: hashedPassword,
      name: "Jean Claude",
      role: "admin",
    },
  });

  console.log("Seed OK");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { config } from "dotenv";
config(); // Load .env file first

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
console.log("Using connection string starting with:", connectionString?.substring(0, 30) + "...");

// Use standard pg Pool for Node.js seed script
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@jccontabilidade.com.br" },
    update: { name: "Jean Claude" },
    create: {
      email: "admin@jccontabilidade.com.br",
      password: hashedPassword,
      name: "Jean Claude",
      role: "admin",
    },
  });

  console.log("Created user:", user.email);

  // Create sample clients
  const clientes = await Promise.all([
    prisma.cliente.upsert({
      where: { cnpj: "12345678000190" },
      update: {},
      create: {
        nome: "Empresa Alpha Ltda",
        cnpj: "12345678000190",
        email: "contato@empresaalpha.com.br",
        responsavel: "Maria Silva",
      },
    }),
    prisma.cliente.upsert({
      where: { cnpj: "98765432000110" },
      update: {},
      create: {
        nome: "Tech Solutions SA",
        cnpj: "98765432000110",
        email: "financeiro@techsolutions.com.br",
        responsavel: "Carlos Santos",
      },
    }),
    prisma.cliente.upsert({
      where: { cnpj: "11222333000144" },
      update: {},
      create: {
        nome: "Comercio Central ME",
        cnpj: "11222333000144",
        email: "fiscal@comerciocentral.com.br",
        responsavel: "Ana Oliveira",
      },
    }),
    prisma.cliente.upsert({
      where: { cnpj: "55666777000188" },
      update: {},
      create: {
        nome: "Consultoria XYZ",
        cnpj: "55666777000188",
        email: "contabilidade@consultoriaxyz.com.br",
        responsavel: "Pedro Costa",
      },
    }),
    prisma.cliente.upsert({
      where: { cnpj: "99888777000122" },
      update: {},
      create: {
        nome: "Industria Nacional",
        cnpj: "99888777000122",
        email: "fiscal@industrianacional.com.br",
        responsavel: "Lucia Ferreira",
      },
    }),
  ]);

  console.log(`Created ${clientes.length} clients`);

  // Create sample recibos for current and previous months
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);

  const recibos = [];

  for (const cliente of clientes) {
    // Check if recibo exists for current month
    const existingRecibo = await prisma.recibo.findFirst({
      where: {
        clienteId: cliente.id,
        mesReferencia: currentMonth,
      },
    });

    if (!existingRecibo) {
      const honorario = Math.floor(Math.random() * 2000) + 500;
      const decimoTerceiro = Math.random() > 0.7 ? Math.floor(Math.random() * 500) : 0;
      const registro = Math.random() > 0.8 ? Math.floor(Math.random() * 300) : 0;
      const total = honorario + decimoTerceiro + registro + 5;

      recibos.push(
        prisma.recibo.create({
          data: {
            clienteId: cliente.id,
            mesReferencia: currentMonth,
            honorario,
            decimoTerceiro,
            registro,
            alteracao: 0,
            materialExpediente: 5,
            outros: 0,
            total,
            status: Math.random() > 0.3 ? "pago" : "pendente",
          },
        })
      );
    }

    // Check for last month
    const existingReciboLastMonth = await prisma.recibo.findFirst({
      where: {
        clienteId: cliente.id,
        mesReferencia: lastMonth,
      },
    });

    if (!existingReciboLastMonth) {
      const honorario = Math.floor(Math.random() * 2000) + 500;
      const total = honorario + 5;

      recibos.push(
        prisma.recibo.create({
          data: {
            clienteId: cliente.id,
            mesReferencia: lastMonth,
            honorario,
            decimoTerceiro: 0,
            registro: 0,
            alteracao: 0,
            materialExpediente: 5,
            outros: 0,
            total,
            status: "pago",
          },
        })
      );
    }

    // Check for two months ago
    const existingReciboTwoMonths = await prisma.recibo.findFirst({
      where: {
        clienteId: cliente.id,
        mesReferencia: twoMonthsAgo,
      },
    });

    if (!existingReciboTwoMonths) {
      const honorario = Math.floor(Math.random() * 2000) + 500;
      const total = honorario + 5;

      recibos.push(
        prisma.recibo.create({
          data: {
            clienteId: cliente.id,
            mesReferencia: twoMonthsAgo,
            honorario,
            decimoTerceiro: 0,
            registro: 0,
            alteracao: 0,
            materialExpediente: 5,
            outros: 0,
            total,
            status: "pago",
          },
        })
      );
    }
  }

  if (recibos.length > 0) {
    await Promise.all(recibos);
    console.log(`Created ${recibos.length} recibos`);
  }

  console.log("\nSeed completed!");
  console.log("\nCredentials:");
  console.log("  Email: admin@jccontabilidade.com.br");
  console.log("  Password: admin123");
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

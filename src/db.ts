import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || "postgresql://sa:btp_psswd00@localhost:5432/postgres";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Instancia configurada para Prisma 7
const prisma = new PrismaClient({ adapter });

export default prisma;
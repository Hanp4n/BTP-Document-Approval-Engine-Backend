import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: import.meta.DATABASE_URL || "postgresql://sa:btp_psswd00@localhost:5432/postgres",
  },
});
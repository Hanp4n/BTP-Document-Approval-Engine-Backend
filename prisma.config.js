import { defineConfig } from '@prisma/config';
export default defineConfig({
    datasource: {
        url: process.env.DATABASE_URL || "postgresql://sa:btp_psswd00@localhost:5432/postgres",
    },
});
//# sourceMappingURL=prisma.config.js.map
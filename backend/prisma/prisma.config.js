import { defineConfig } from "@prisma/config";

export default defineConfig({
  migrate: {
    dbUrl: process.env.DATABASE_URL, // Migration URL
  },
});

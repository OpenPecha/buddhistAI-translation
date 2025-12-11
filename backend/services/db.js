// 1. Use require for importing the PrismaClient
const { PrismaClient } = require("@prisma/client");

// Use a global variable to prevent multiple Prisma Clients in development hot-reloading.
// This is critical for environments like Next.js or other frameworks that use hot-reloading.
// We access the global object in Node.js directly.
const globalForPrisma = global;

let prisma;

// 2. Implement the singleton pattern
if (process.env.NODE_ENV === "production") {
  // In production, just create the client directly
  prisma = new PrismaClient();
} else {
  // In development, use the global object to store the instance
  // This prevents creating new clients on every code reload (hot-reloading)
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      // Optional: Add logging for better debugging
      log: ["query", "info", "warn", "error"],
    });
  }
  prisma = globalForPrisma.prisma;
}

// 3. Use module.exports to export the single, shared instance
module.exports = { prisma };

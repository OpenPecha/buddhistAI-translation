const { PrismaClient } = require("../prisma/generated/prisma/client.js");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv").config();
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };


const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Conectar ao banco de dados
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Conectado ao PostgreSQL via Prisma');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

// Desconectar do banco de dados
async function disconnectDatabase() {
  await prisma.$disconnect();
}

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase
};

const { prisma } = require("../lib/database");

async function resetarTabelas() {
  try {
    console.log("🧹 Limpando todas as tabelas...");

    await prisma.presenca.deleteMany();
    await prisma.resumo.deleteMany();
    await prisma.chamada.deleteMany();
    await prisma.matricula.deleteMany();
    await prisma.turma.deleteMany();
    await prisma.audioCurso.deleteMany();
    await prisma.materialCurso.deleteMany();
    await prisma.materialAula.deleteMany();
    await prisma.curso.deleteMany();
    await prisma.escola.deleteMany();
    await prisma.usuario.deleteMany();

    console.log("✅ Todas as tabelas foram limpas!");
  } catch (err) {
    console.error("❌ Erro ao limpar tabelas:", err);
  } finally {
    await prisma.$disconnect();
  }
}

resetarTabelas();

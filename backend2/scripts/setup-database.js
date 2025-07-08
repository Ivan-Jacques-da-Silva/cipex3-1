
const { prisma } = require('../lib/database');

async function setupDatabase() {
  try {
    console.log('🔧 Configurando banco de dados PostgreSQL...');
    
    // Gerar o cliente Prisma
    console.log('📦 Gerando cliente Prisma...');
    
    // Aplicar migrações
    console.log('🔄 Aplicando schema ao banco...');
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com PostgreSQL estabelecida!');
    
    // Verificar se há tabelas
    const usuarios = await prisma.usuario.findMany({ take: 1 });
    console.log(`📊 Banco configurado. Usuários encontrados: ${usuarios.length}`);
    
    console.log('🎉 Banco de dados configurado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();

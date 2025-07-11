
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Função para limpar todas as tabelas
async function clearAllTables() {
  console.log('🗑️  Iniciando limpeza do banco de dados PostgreSQL');
  console.log('====================================================');
  
  try {
    // Lista das tabelas na ordem correta para evitar problemas de chave estrangeira
    const tables = [
      'cp_historico_chamadas',
      'cp_registro_aulas', 
      'cp_resumos',
      'cp_mat_materiais',
      'cp_mat_extra',
      'cp_audios',
      'cp_matriculas',
      'cp_turmas',
      'cp_cursos',
      'cp_escolas',
      'cp_usuarios'
    ];

    let totalRecordsDeleted = 0;

    for (const table of tables) {
      try {
        console.log(`🧹 Limpando tabela: ${table}`);
        
        // Contar registros antes da exclusão
        const countBefore = await prisma[table].count();
        
        if (countBefore > 0) {
          // Deletar todos os registros da tabela
          const result = await prisma[table].deleteMany({});
          
          console.log(`   ✓ ${result.count} registros removidos de ${table}`);
          totalRecordsDeleted += result.count;
        } else {
          console.log(`   ✓ Tabela ${table} já estava vazia`);
        }
        
      } catch (error) {
        console.error(`   ❌ Erro ao limpar tabela ${table}:`, error.message);
      }
    }

    // Reset dos sequences (auto increment) para começar do 1 novamente
    console.log('\n🔄 Resetando sequences dos IDs...');
    
    const sequenceResets = [
      'ALTER SEQUENCE cp_usuarios_cp_id_seq RESTART WITH 1',
      'ALTER SEQUENCE cp_escolas_cp_ec_id_seq RESTART WITH 1', 
      'ALTER SEQUENCE cp_cursos_cp_id_curso_seq RESTART WITH 1',
      'ALTER SEQUENCE cp_turmas_cp_tr_id_seq RESTART WITH 1',
      'ALTER SEQUENCE cp_matriculas_cp_mt_id_seq RESTART WITH 1',
      'ALTER SEQUENCE cp_audios_cp_aud_id_seq RESTART WITH 1',
      'ALTER SEQUENCE cp_mat_extra_cp_mat_extra_id_seq RESTART WITH 1',
      'ALTER SEQUENCE cp_mat_materiais_cp_mat_id_seq RESTART WITH 1',
      'ALTER SEQUENCE cp_resumos_cp_res_id_seq RESTART WITH 1',
      'ALTER SEQUENCE cp_registro_aulas_cp_reg_id_seq RESTART WITH 1',
      'ALTER SEQUENCE cp_historico_chamadas_cp_hist_id_seq RESTART WITH 1'
    ];

    for (const sql of sequenceResets) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (error) {
        console.log(`   ⚠️  Sequence reset falhou (provavelmente não existe ainda): ${error.message}`);
      }
    }

    console.log('✓ Sequences resetados com sucesso');

    console.log('\n====================================================');
    console.log(`✅ Limpeza concluída! Total de ${totalRecordsDeleted} registros removidos`);
    console.log('💡 Banco de dados limpo e pronto para nova migração');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    // Fechar conexão do Prisma
    await prisma.$disconnect();
    console.log('✓ Conexão do Prisma fechada');
  }
}

// Função para confirmar a limpeza (segurança)
async function confirmAndClear() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('⚠️  ATENÇÃO: Esta operação irá DELETAR TODOS os dados do banco!\nTem certeza que deseja continuar? (Digite "SIM" para confirmar): ', (answer) => {
      rl.close();
      
      if (answer.toUpperCase() === 'SIM') {
        console.log('✅ Confirmação recebida. Iniciando limpeza...\n');
        clearAllTables();
      } else {
        console.log('❌ Operação cancelada pelo usuário');
        prisma.$disconnect();
      }
      
      resolve();
    });
  });
}

// Verificar se foi chamado com --force para pular confirmação
const args = process.argv.slice(2);
if (args.includes('--force')) {
  console.log('🚀 Modo --force ativado. Pulando confirmação...\n');
  clearAllTables();
} else {
  confirmAndClear();
}

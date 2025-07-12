
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function hashExistingPasswords() {
  try {
    console.log('Iniciando conversão de senhas para bcrypt...');
    
    // Buscar todos os usuários
    const result = await db.query('SELECT cp_id, cp_login, cp_password FROM cp_usuarios WHERE cp_excluido = 0');
    
    let converted = 0;
    let skipped = 0;
    
    for (const user of result.rows) {
      // Verificar se a senha já está hasheada
      if (user.cp_password && user.cp_password.startsWith('$2') && user.cp_password.length === 60) {
        console.log(`Usuário ${user.cp_login} já possui senha hasheada, pulando...`);
        skipped++;
        continue;
      }
      
      // Converter senha para bcrypt
      const hashedPassword = await bcrypt.hash(user.cp_password, 10);
      
      // Atualizar no banco
      await db.query(
        'UPDATE cp_usuarios SET cp_password = $1 WHERE cp_id = $2',
        [hashedPassword, user.cp_id]
      );
      
      console.log(`Senha do usuário ${user.cp_login} convertida para bcrypt`);
      converted++;
    }
    
    console.log(`\nProcesso concluído:`);
    console.log(`- Senhas convertidas: ${converted}`);
    console.log(`- Senhas já hasheadas: ${skipped}`);
    
  } catch (error) {
    console.error('Erro ao converter senhas:', error);
  } finally {
    await db.end();
  }
}

hashExistingPasswords();

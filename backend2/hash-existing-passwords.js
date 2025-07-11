
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/cipex',
  ssl: false
});

async function hashExistingPasswords() {
  try {
    console.log('Iniciando migração de senhas...');
    
    // Buscar todos os usuários
    const users = await db.query('SELECT cp_id, cp_password FROM cp_usuarios WHERE cp_excluido = 0');
    
    for (const user of users.rows) {
      // Verificar se a senha já está hasheada (bcrypt hash tem 60 caracteres e começa com $2)
      if (user.cp_password && !user.cp_password.startsWith('$2')) {
        const hashedPassword = await bcrypt.hash(user.cp_password, 10);
        
        await db.query(
          'UPDATE cp_usuarios SET cp_password = ? WHERE cp_id = ?',
          [hashedPassword, user.cp_id]
        );
        
        console.log(`Senha do usuário ${user.cp_id} atualizada com hash`);
      }
    }
    
    console.log('Migração de senhas concluída!');
    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

hashExistingPasswords();

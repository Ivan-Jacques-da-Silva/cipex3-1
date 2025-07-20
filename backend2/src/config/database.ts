
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do banco de dados PostgreSQL
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Teste de conexão
db.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
  } else {
    console.log("Conectado ao banco de dados PostgreSQL:", result.rows[0]);
  }
});

export default db;

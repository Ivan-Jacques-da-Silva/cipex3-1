
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

// Configuração do banco de dados PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Buscar professores
router.get("/users-professores", (req: Request, res: Response) => {
  const query = "SELECT * FROM cp_usuarios WHERE cp_tipo_user = 4 AND cp_excluido = 0";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar professores:", err);
      return res.status(500).json({ error: "Erro ao buscar professores" });
    }
    res.json(results.rows);
  });
});

// Buscar usuários por tipo
router.get("/users-escolas", (req: Request, res: Response) => {
  const { cp_tipo_user } = req.query;

  if (!cp_tipo_user) {
    return res.status(400).json({ error: "Tipo de usuário é obrigatório" });
  }

  const query = "SELECT * FROM cp_usuarios WHERE cp_tipo_user = $1 AND cp_excluido = 0";

  db.query(query, [cp_tipo_user], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuários por tipo:", err);
      return res.status(500).json({ error: "Erro ao buscar usuários por tipo" });
    }
    res.json(results.rows);
  });
});

export default router;

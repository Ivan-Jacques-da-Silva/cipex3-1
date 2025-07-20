
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Configuração do banco de dados PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Buscar todas as escolas
router.get("/escolas", authenticateToken, (req: Request, res: Response) => {
  const query = "SELECT * FROM cp_escolas WHERE cp_ec_excluido = 0 OR cp_ec_excluido IS NULL";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar escolas:", err);
      return res.status(500).json({ error: "Erro ao buscar escolas" });
    }
    res.json(results.rows);
  });
});

// Buscar escola por ID
router.get("/escolas/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const query = "SELECT * FROM cp_escolas WHERE cp_ec_id = $1 AND (cp_ec_excluido = 0 OR cp_ec_excluido IS NULL)";

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar escola:", err);
      return res.status(500).json({ error: "Erro ao buscar escola" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Escola não encontrada" });
    }

    res.json(results.rows[0]);
  });
});

// Cadastro de escola
router.post("/escolas", authenticateToken, (req: Request, res: Response) => {
  const {
    cp_ec_nome,
    cp_ec_responsavel,
    cp_ec_endereco_rua,
    cp_ec_endereco_numero,
    cp_ec_endereco_cidade,
    cp_ec_endereco_bairro,
    cp_ec_endereco_estado,
    cp_ec_data_cadastro,
    cp_ec_descricao,
  } = req.body;

  if (!cp_ec_nome) {
    return res.status(400).json({ error: "Nome da escola é obrigatório" });
  }

  const query = `
    INSERT INTO cp_escolas (
      cp_ec_nome, 
      cp_ec_responsavel,
      cp_ec_endereco_rua,
      cp_ec_endereco_numero,
      cp_ec_endereco_cidade,
      cp_ec_endereco_bairro,
      cp_ec_endereco_estado,
      cp_ec_data_cadastro,
      cp_ec_descricao
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
  `;

  const values = [
    cp_ec_nome,
    cp_ec_responsavel,
    cp_ec_endereco_rua,
    cp_ec_endereco_numero,
    cp_ec_endereco_cidade,
    cp_ec_endereco_bairro,
    cp_ec_endereco_estado,
    cp_ec_data_cadastro,
    cp_ec_descricao,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar escola:", err);
      return res.status(500).json({ error: "Erro ao cadastrar escola" });
    }

    res.status(200).json({
      success: true,
      message: "Escola cadastrada com sucesso",
      escola: result.rows[0],
    });
  });
});

// Editar escola
router.put("/escolas/:id", authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    cp_ec_nome,
    cp_ec_responsavel,
    cp_ec_endereco_rua,
    cp_ec_endereco_numero,
    cp_ec_endereco_cidade,
    cp_ec_endereco_bairro,
    cp_ec_endereco_estado,
    cp_ec_data_cadastro,
    cp_ec_descricao,
  } = req.body;

  if (!cp_ec_nome) {
    return res.status(400).json({ error: "Nome da escola é obrigatório" });
  }

  const query = `
    UPDATE cp_escolas 
    SET cp_ec_nome = $1, 
        cp_ec_responsavel = $2,
        cp_ec_endereco_rua = $3,
        cp_ec_endereco_numero = $4,
        cp_ec_endereco_cidade = $5,
        cp_ec_endereco_bairro = $6,
        cp_ec_endereco_estado = $7,
        cp_ec_data_cadastro = $8,
        cp_ec_descricao = $9,
        updated_at = NOW()
    WHERE cp_ec_id = $10 RETURNING *
  `;

  const values = [
    cp_ec_nome,
    cp_ec_responsavel,
    cp_ec_endereco_rua,
    cp_ec_endereco_numero,
    cp_ec_endereco_cidade,
    cp_ec_endereco_bairro,
    cp_ec_endereco_estado,
    cp_ec_data_cadastro,
    cp_ec_descricao,
    id,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar escola:", err);
      return res.status(500).json({ error: "Erro ao atualizar escola" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Escola não encontrada" });
    }

    res.json({
      success: true,
      message: "Escola atualizada com sucesso",
      escola: result.rows[0],
    });
  });
});

// Deletar escola
router.delete("/escolas/:id", authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;

  const query = "UPDATE cp_escolas SET cp_ec_excluido = 1 WHERE cp_ec_id = $1";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar escola:", err);
      return res.status(500).json({ error: "Erro ao deletar escola" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Escola não encontrada" });
    }

    res.json({ message: "Escola deletada com sucesso" });
  });
});

// Obter alunos por escola
router.get("/escola/alunos/:escolaId", authenticateToken, (req: Request, res: Response) => {
  const { escolaId } = req.params;

  if (!escolaId) {
    return res.status(400).json({ error: "Escola ID é obrigatório" });
  }

  const query = `
    SELECT cp_id, cp_nome, cp_cpf, cp_email, cp_tipo_user, cp_escola_id, cp_turma_id
    FROM cp_usuarios 
    WHERE cp_escola_id = $1 
    ORDER BY cp_nome ASC
  `;

  db.query(query, [escolaId], (err, result) => {
    if (err) {
      console.error("Erro ao buscar alunos da escola:", err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }

    res.status(200).json(result.rows);
  });
});

export default router;

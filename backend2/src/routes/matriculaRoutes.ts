
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Configuração do banco de dados PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Buscar matrículas
router.get("/matriculas", authenticateToken, (req: Request, res: Response) => {
  const query = `
    SELECT 
      m.*,
      m.cp_mt_nome_usuario as nome_usuario,
      u.cp_email as email_usuario,
      t.cp_tr_nome as nome_turma,
      e.cp_ec_nome as nome_escola,
      m.cp_mt_status as cp_status
    FROM cp_matriculas m
    LEFT JOIN cp_usuarios u ON m.cp_mt_usuario_id = u.cp_id
    LEFT JOIN cp_turmas t ON u.cp_turma_id = t.cp_tr_id
    LEFT JOIN cp_escolas e ON m.cp_mt_escola_id = e.cp_ec_id
    WHERE m.cp_mt_excluido = 0 OR m.cp_mt_excluido IS NULL
    ORDER BY m.cp_mt_id ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar matrículas:", err);
      return res.status(500).json({ error: "Erro ao buscar matrículas" });
    }
    res.json(results.rows);
  });
});

// Buscar matrícula por ID
router.get("/matriculas/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const query = `
    SELECT 
      m.*,
      u.cp_nome as nome_usuario,
      u.cp_email as email_usuario,
      u.cp_cpf as cpf_usuario,
      u.cp_datanascimento as data_nascimento,
      u.cp_profissao,
      u.cp_estadocivil as estado_civil,
      u.cp_whatsapp,
      u.cp_telefone,
      u.cp_end_cidade_estado as endereco,
      u.cp_escola_id,
      t.cp_tr_nome as nome_turma,
      e.cp_ec_nome as nome_escola
    FROM cp_matriculas m
    LEFT JOIN cp_usuarios u ON m.cp_mt_usuario_id = u.cp_id
    LEFT JOIN cp_turmas t ON u.cp_turma_id = t.cp_tr_id
    LEFT JOIN cp_escolas e ON m.cp_mt_escola_id = e.cp_ec_id
    WHERE m.cp_mt_id = $1 AND (m.cp_mt_excluido = 0 OR m.cp_mt_excluido IS NULL)
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar matrícula:", err);
      return res.status(500).json({ error: "Erro ao buscar matrícula" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Matrícula não encontrada" });
    }

    res.json(results.rows[0]);
  });
});

// Cadastro de matrícula simples
router.post("/matriculas", authenticateToken, (req: Request, res: Response) => {
  const {
    cp_usuario_id,
    cp_turma_id,
    cp_data_matricula,
    cp_valor,
    cp_status,
    cp_observacoes,
  } = req.body;

  if (!cp_usuario_id || !cp_turma_id) {
    return res.status(400).json({ error: "Usuário e turma são obrigatórios" });
  }

  const query = `
    INSERT INTO cp_matriculas (
      cp_usuario_id, cp_turma_id, cp_data_matricula, cp_valor, cp_status, cp_observacoes
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  `;

  const values = [
    cp_usuario_id,
    cp_turma_id,
    cp_data_matricula || new Date(),
    cp_valor || 0,
    cp_status || "ativa",
    cp_observacoes,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar matrícula:", err);
      return res.status(500).json({ error: "Erro ao cadastrar matrícula" });
    }

    res.status(201).json({
      success: true,
      message: "Matrícula cadastrada com sucesso",
      matricula: result.rows[0],
    });
  });
});

// Cadastro de matrícula com todos os campos
router.post("/cadastrar-matricula", authenticateToken, (req: Request, res: Response) => {
  const {
    cursoId,
    usuarioId,
    escolaId,
    nomeUsuario,
    cpfUsuario,
    valorCurso,
    numeroParcelas,
    primeiraDataPagamento,
    status,
    nivelIdioma,
    horarioInicio,
    horarioFim,
    localNascimento,
    escolaridade,
    redeSocial,
    nomePai,
    contatoPai,
    nomeMae,
    contatoMae,
    diasSemana,
    tipoPagamento,
  } = req.body;

  if (!usuarioId || !escolaId || !cursoId) {
    return res.status(400).json({ error: "Usuário, escola e curso são obrigatórios" });
  }

  const cursoIdInt = parseInt(cursoId);
  if (isNaN(cursoIdInt)) {
    return res.status(400).json({ error: "ID do curso deve ser um número válido" });
  }

  const query = `
    INSERT INTO cp_matriculas (
      cp_mt_curso, cp_mt_usuario_id, cp_mt_escola_id, cp_mt_nome_usuario,
      cp_mt_cpf_usuario, cp_mt_valor_curso, cp_mt_numero_parcelas,
      cp_mt_primeira_data_pagamento, cp_mt_status, cp_mt_nivel_idioma,
      cp_mt_local_nascimento, cp_mt_escolaridade, cp_mt_rede_social, cp_mt_nome_pai,
      cp_mt_contato_pai, cp_mt_nome_mae, cp_mt_contato_mae,
      cp_mt_dias_semana, cp_mt_tipo_pagamento, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()) RETURNING *
  `;

  const values = [
    cursoIdInt,
    parseInt(usuarioId),
    parseInt(escolaId),
    nomeUsuario,
    cpfUsuario,
    parseFloat(valorCurso) || 0,
    parseInt(numeroParcelas) || 1,
    primeiraDataPagamento,
    status || "ativo",
    nivelIdioma,
    localNascimento,
    escolaridade,
    redeSocial,
    nomePai,
    contatoPai,
    nomeMae,
    contatoMae,
    diasSemana,
    tipoPagamento || "parcelado",
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar matrícula:", err);
      return res.status(500).json({ error: "Erro ao cadastrar matrícula" });
    }

    res.status(201).json({
      success: true,
      msg: "Matrícula cadastrada com sucesso",
      matricula: result.rows[0],
    });
  });
});

// Editar matrícula
router.put("/editar-matricula/:id", authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    cursoId,
    usuarioId,
    escolaId,
    nomeUsuario,
    cpfUsuario,
    valorCurso,
    numeroParcelas,
    primeiraDataPagamento,
    status,
    nivelIdioma,
    horarioInicio,
    horarioFim,
    localNascimento,
    escolaridade,
    redeSocial,
    nomePai,
    contatoPai,
    nomeMae,
    contatoMae,
    diasSemana,
    tipoPagamento,
  } = req.body;

  const cursoIdInt = parseInt(cursoId);
  const usuarioIdInt = parseInt(usuarioId);
  const escolaIdInt = parseInt(escolaId);

  if (isNaN(cursoIdInt) || isNaN(usuarioIdInt) || isNaN(escolaIdInt)) {
    return res.status(400).json({ error: "IDs devem ser números válidos" });
  }

  const query = `
    UPDATE cp_matriculas SET
      cp_mt_curso = $1,
      cp_mt_usuario_id = $2,
      cp_mt_escola_id = $3,
      cp_mt_nome_usuario = $4,
      cp_mt_cpf_usuario = $5,
      cp_mt_valor_curso = $6,
      cp_mt_numero_parcelas = $7,
      cp_mt_primeira_data_pagamento = $8,
      cp_mt_status = $9,
      cp_mt_nivel_idioma = $10,
      cp_mt_local_nascimento = $11,
      cp_mt_escolaridade = $12,
      cp_mt_rede_social = $13,
      cp_mt_nome_pai = $14,
      cp_mt_contato_pai = $15,
      cp_mt_nome_mae = $16,
      cp_mt_contato_mae = $17,
      cp_mt_dias_semana = $18,
      cp_mt_tipo_pagamento = $19,
      updated_at = NOW()
    WHERE cp_mt_id = $20 RETURNING *
  `;

  const values = [
    cursoIdInt,
    usuarioIdInt,
    escolaIdInt,
    nomeUsuario,
    cpfUsuario,
    parseFloat(valorCurso) || 0,
    parseInt(numeroParcelas) || 1,
    primeiraDataPagamento,
    status || "ativo",
    nivelIdioma,
    localNascimento,
    escolaridade,
    redeSocial,
    nomePai,
    contatoPai,
    nomeMae,
    contatoMae,
    diasSemana,
    tipoPagamento || "parcelado",
    parseInt(id),
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao editar matrícula:", err);
      return res.status(500).json({ error: "Erro ao editar matrícula" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Matrícula não encontrada" });
    }

    res.json({
      success: true,
      msg: "Matrícula e parcelas atualizadas com sucesso",
      matricula: result.rows[0],
    });
  });
});

// Deletar matrícula
router.delete("/matriculas/:id", authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;

  const query = "UPDATE cp_matriculas SET cp_mt_excluido = 1 WHERE cp_mt_id = $1";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar matrícula:", err);
      return res.status(500).json({ error: "Erro ao deletar matrícula" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Matrícula não encontrada" });
    }

    res.json({ message: "Matrícula deletada com sucesso" });
  });
});

// Buscar dados do usuário para matrícula
router.get("/buscarusermatricula", (req: Request, res: Response) => {
  const query = `
    SELECT 
      cp_id,
      cp_nome,
      cp_email,
      cp_cpf,
      cp_datanascimento,
      cp_profissao,
      cp_estadocivil,
      cp_whatsapp,
      cp_telefone,
      cp_end_cidade_estado,
      cp_end_rua,
      cp_end_num,
      cp_escola_id
    FROM cp_usuarios 
    WHERE cp_tipo_user = 5 AND cp_excluido = 0
    ORDER BY cp_nome ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar alunos:", err);
      return res.status(500).json({ error: "Erro ao buscar alunos" });
    }

    res.json(results.rows);
  });
});

// Buscar usuário específico para matrícula
router.get("/buscarusermatricula/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;

  const query = `
    SELECT 
      cp_id,
      cp_nome,
      cp_email,
      cp_cpf,
      cp_datanascimento,
      cp_profissao,
      cp_estadocivil,
      cp_whatsapp,
      cp_telefone,
      cp_end_cidade_estado,
      cp_end_rua,
      cp_end_num,
      cp_escola_id
    FROM cp_usuarios 
    WHERE cp_id = $1 AND cp_excluido = 0
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).json({ error: "Erro ao buscar usuário" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(results.rows[0]);
  });
});

export default router;

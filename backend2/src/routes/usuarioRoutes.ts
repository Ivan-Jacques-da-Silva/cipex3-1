
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Usuario } from '../types';

const router = Router();

// Função para hash de senha
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Rota para registro de usuários
router.post("/register", async (req: Request, res: Response) => {
  const {
    cp_nome,
    cp_email,
    cp_login,
    cp_password,
    cp_tipo_user,
    cp_rg,
    cp_cpf,
    cp_datanascimento,
    cp_estadocivil,
    cp_cnpj,
    cp_ie,
    cp_whatsapp,
    cp_telefone,
    cp_empresaatuacao,
    cp_profissao,
    cp_end_cidade_estado,
    cp_end_rua,
    cp_end_num,
    cp_end_cep,
    cp_descricao,
    cp_escola_id,
    cp_turma_id,
  } = req.body;

  if (!cp_nome || !cp_email || !cp_login || !cp_password || !cp_cpf) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios: nome, email, login, senha e CPF" });
  }

  try {
    // Verificar se login já existe
    const checkQuery =
      "SELECT cp_id FROM cp_usuarios WHERE cp_login = $1 OR cp_email = $2";
    db.query(checkQuery, [cp_login, cp_email], async (err, results) => {
      if (err) {
        console.error("Erro ao verificar usuário existente:", err);
        return res.status(500).json({ error: "Erro interno do servidor" });
      }

      if (results.rows.length > 0) {
        return res.status(400).json({ error: "Login ou email já cadastrado" });
      }

      // Hash da senha
      const hashedPassword = await hashPassword(cp_password);

      // Inserir usuário
      const insertQuery = `
        INSERT INTO cp_usuarios (
          cp_nome, cp_email, cp_login, cp_password, cp_tipo_user, cp_rg, cp_cpf, 
          cp_datanascimento, cp_estadocivil, cp_cnpj, cp_ie, cp_whatsapp, cp_telefone,
          cp_empresaatuacao, cp_profissao, cp_end_cidade_estado, cp_end_rua, cp_end_num,
          cp_end_cep, cp_descricao, cp_escola_id, cp_turma_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `;

      const values = [
        cp_nome,
        cp_email,
        cp_login,
        hashedPassword,
        cp_tipo_user,
        cp_rg,
        cp_cpf,
        cp_datanascimento,
        cp_estadocivil,
        cp_cnpj,
        cp_ie,
        cp_whatsapp,
        cp_telefone,
        cp_empresaatuacao,
        cp_profissao,
        cp_end_cidade_estado,
        cp_end_rua,
        cp_end_num,
        cp_end_cep,
        cp_descricao,
        cp_escola_id,
        cp_turma_id,
      ];

      db.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error("Erro ao cadastrar usuário:", err);
          return res.status(500).json({ error: "Erro ao cadastrar usuário" });
        }

        res.status(201).json({
          success: true,
          message: "Usuário cadastrado com sucesso",
          userId: result.insertId,
        });
      });
    });
  } catch (error) {
    console.error("Erro ao processar cadastro:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Buscar todos os usuários
router.get("/", (req: Request, res: Response) => {
  const query = "SELECT * FROM cp_usuarios WHERE cp_excluido = 0";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuários:", err);
      return res.status(500).json({ error: "Erro ao buscar usuários" });
    }
    res.json(results.rows);
  });
});

// Buscar usuário por ID
router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const query =
    "SELECT * FROM cp_usuarios WHERE cp_id = $1 AND cp_excluido = 0";

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).json({ error: "Erro ao buscar usuário" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const user = results.rows[0];
    // Remover senha da resposta
    delete user.cp_password;

    res.json(user);
  });
});

// Editar usuário
router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (req.body.cp_cnpj) {
    req.body.cp_cnpj = req.body.cp_cnpj.replace(/\D/g, "");
  }
  
  const {
    cp_nome,
    cp_email,
    cp_login,
    cp_password,
    cp_tipo_user,
    cp_rg,
    cp_cpf,
    cp_datanascimento,
    cp_estadocivil,
    cp_cnpj,
    cp_ie,
    cp_whatsapp,
    cp_telefone,
    cp_empresaatuacao,
    cp_profissao,
    cp_end_cidade_estado,
    cp_end_rua,
    cp_end_num,
    cp_end_cep,
    cp_descricao,
    cp_escola_id,
    cp_turma_id,
  } = req.body;

  if (!cp_nome || !cp_email || !cp_login) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios: nome, email e login" });
  }

  try {
    let query: string;
    let values: any[];

    if (cp_password) {
      // Se senha foi fornecida, fazer hash e atualizar
      const hashedPassword = await hashPassword(cp_password);
      query = `
        UPDATE cp_usuarios 
        SET cp_nome = $1, cp_email = $2, cp_login = $3, cp_password = $4, cp_tipo_user = $5, 
            cp_rg = $6, cp_cpf = $7, cp_datanascimento = $8, cp_estadocivil = $9, cp_cnpj = $10, 
            cp_ie = $11, cp_whatsapp = $12, cp_telefone = $13, cp_empresaatuacao = $14, 
            cp_profissao = $15, cp_end_cidade_estado = $16, cp_end_rua = $17, cp_end_num = $18, 
            cp_end_cep = $19, cp_descricao = $20, cp_escola_id = $21, cp_turma_id = $22,
            updated_at = NOW()
        WHERE cp_id = $23 RETURNING *
      `;
      values = [
        cp_nome,
        cp_email,
        cp_login,
        hashedPassword,
        cp_tipo_user,
        cp_rg,
        cp_cpf,
        cp_datanascimento,
        cp_estadocivil,
        cp_cnpj,
        cp_ie,
        cp_whatsapp,
        cp_telefone,
        cp_empresaatuacao,
        cp_profissao,
        cp_end_cidade_estado,
        cp_end_rua,
        cp_end_num,
        cp_end_cep,
        cp_descricao,
        cp_escola_id,
        cp_turma_id,
        id,
      ];
    } else {
      // Se senha não foi fornecida, não atualizar
      query = `
        UPDATE cp_usuarios 
        SET cp_nome = $1, cp_email = $2, cp_login = $3, cp_tipo_user = $4, 
            cp_rg = $5, cp_cpf = $6, cp_datanascimento = $7, cp_estadocivil = $8, cp_cnpj = $9, 
            cp_ie = $10, cp_whatsapp = $11, cp_telefone = $12, cp_empresaatuacao = $13, 
            cp_profissao = $14, cp_end_cidade_estado = $15, cp_end_rua = $16, cp_end_num = $17, 
            cp_end_cep = $18, cp_descricao = $19, cp_escola_id = $20, cp_turma_id = $21,
            updated_at = NOW()
        WHERE cp_id = $22 RETURNING *
      `;
      values = [
        cp_nome,
        cp_email,
        cp_login,
        cp_tipo_user,
        cp_rg,
        cp_cpf,
        cp_datanascimento,
        cp_estadocivil,
        cp_cnpj,
        cp_ie,
        cp_whatsapp,
        cp_telefone,
        cp_empresaatuacao,
        cp_profissao,
        cp_end_cidade_estado,
        cp_end_rua,
        cp_end_num,
        cp_end_cep,
        cp_descricao,
        cp_escola_id,
        cp_turma_id,
        id,
      ];
    }

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Erro ao atualizar usuário:", err);
        return res.status(500).json({ error: "Erro ao atualizar usuário" });
      }

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const user = result.rows[0];
      // Remover senha da resposta
      delete user.cp_password;

      res.json({
        success: true,
        message: "Usuário atualizado com sucesso",
        usuario: user,
      });
    });
  } catch (error) {
    console.error("Erro ao processar atualização do usuário:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Deletar usuário
router.delete("/:id", authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;

  const query = "UPDATE cp_usuarios SET cp_excluido = 1 WHERE cp_id = $1";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar usuário:", err);
      return res.status(500).json({ error: "Erro ao deletar usuário" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ message: "Usuário deletado com sucesso" });
  });
});

// Buscar professores
router.get("/tipo/professores", (req: Request, res: Response) => {
  const query =
    "SELECT * FROM cp_usuarios WHERE cp_tipo_user = 4 AND cp_excluido = 0";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar professores:", err);
      return res.status(500).json({ error: "Erro ao buscar professores" });
    }
    res.json(results.rows);
  });
});

// Buscar usuários por tipo
router.get("/tipo/:tipo", (req: Request, res: Response) => {
  const { tipo } = req.params;

  if (!tipo) {
    return res.status(400).json({ error: "Tipo de usuário é obrigatório" });
  }

  const query =
    "SELECT * FROM cp_usuarios WHERE cp_tipo_user = $1 AND cp_excluido = 0";

  db.query(query, [tipo], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuários por tipo:", err);
      return res
        .status(500)
        .json({ error: "Erro ao buscar usuários por tipo" });
    }
    res.json(results.rows);
  });
});

// Buscar alunos para matrícula
router.get("/alunos/matricula", (req: Request, res: Response) => {
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

export default router;


import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { authenticateToken, hashPassword } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configuração do banco de dados PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'FotoPerfil/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Rota para buscar todos os usuários
router.get("/usuarios", authenticateToken, (req: Request, res: Response) => {
  console.log("=== DEBUG BUSCAR USUÁRIOS ===");
  console.log("Usuário autenticado:", req.user);
  console.log("Headers da requisição:", req.headers);
  
  const query = "SELECT * FROM cp_usuarios WHERE cp_excluido = 0 ORDER BY cp_id DESC";
  
  db.query(query, [], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuários:", err);
      return res.status(500).json({ 
        success: false,
        error: "Erro ao buscar usuários" 
      });
    }

    console.log(`Encontrados ${results.rows.length} usuários`);
    
    // Remover senhas dos resultados
    const usuarios = results.rows.map(user => {
      const { cp_password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      success: true,
      usuarios: usuarios
    });
  });
});

// Rota para buscar usuário por ID
router.get("/usuarios/:id", authenticateToken, (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  
  console.log("=== DEBUG BUSCAR USUÁRIO POR ID ===");
  console.log("ID recebido:", userId);
  
  if (isNaN(userId)) {
    return res.status(400).json({ 
      success: false,
      error: "ID inválido" 
    });
  }

  const query = "SELECT * FROM cp_usuarios WHERE cp_id = $1 AND cp_excluido = 0";
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).json({ 
        success: false,
        error: "Erro ao buscar usuário" 
      });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }

    const user = results.rows[0];
    // Remover senha do resultado
    delete user.cp_password;

    console.log("Usuário encontrado:", user.cp_nome);
    
    res.json(user);
  });
});

// Rota para registrar novo usuário
router.post("/register", upload.single('cp_foto_perfil'), async (req: Request, res: Response) => {
  console.log("=== DEBUG REGISTRO USUÁRIO ===");
  console.log("Dados recebidos:", req.body);
  console.log("Arquivo recebido:", req.file);

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
    cp_turma_id
  } = req.body;

  // Validações obrigatórias
  if (!cp_nome || !cp_email || !cp_login || !cp_password || !cp_cpf || !cp_telefone || !cp_datanascimento) {
    return res.status(400).json({
      success: false,
      msg: "Campos obrigatórios: nome, email, login, senha, CPF, telefone e data de nascimento"
    });
  }

  try {
    // Verificar se login já existe
    const checkLoginQuery = "SELECT cp_id FROM cp_usuarios WHERE cp_login = $1 AND cp_excluido = 0";
    const loginExists = await new Promise((resolve, reject) => {
      db.query(checkLoginQuery, [cp_login], (err, results) => {
        if (err) reject(err);
        else resolve(results.rows.length > 0);
      });
    });

    if (loginExists) {
      return res.status(400).json({
        success: false,
        msg: "Login já existe"
      });
    }

    // Hash da senha
    const hashedPassword = await hashPassword(cp_password);

    // Caminho da foto de perfil
    const fotoPerfilPath = req.file ? `FotoPerfil/${req.file.filename}` : null;

    const insertQuery = `
      INSERT INTO cp_usuarios (
        cp_nome, cp_email, cp_login, cp_password, cp_tipo_user, cp_rg, cp_cpf, 
        cp_datanascimento, cp_estadocivil, cp_cnpj, cp_ie, cp_whatsapp, cp_telefone, 
        cp_empresaatuacao, cp_profissao, cp_end_cidade_estado, cp_end_rua, 
        cp_end_num, cp_end_cep, cp_descricao, cp_foto_perfil, cp_escola_id, cp_turma_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING cp_id
    `;

    const values = [
      cp_nome,
      cp_email,
      cp_login,
      hashedPassword,
      cp_tipo_user ? parseInt(cp_tipo_user) : null,
      cp_rg || null,
      cp_cpf,
      cp_datanascimento,
      cp_estadocivil || null,
      cp_cnpj ? BigInt(cp_cnpj) : null,
      cp_ie ? BigInt(cp_ie) : null,
      cp_whatsapp || null,
      cp_telefone,
      cp_empresaatuacao || null,
      cp_profissao || null,
      cp_end_cidade_estado || null,
      cp_end_rua || null,
      cp_end_num || null,
      cp_end_cep || null,
      cp_descricao || null,
      fotoPerfilPath,
      cp_escola_id ? parseInt(cp_escola_id) : null,
      cp_turma_id ? parseInt(cp_turma_id) : null
    ];

    db.query(insertQuery, values, (err, results) => {
      if (err) {
        console.error("Erro ao inserir usuário:", err);
        return res.status(500).json({
          success: false,
          msg: "Erro ao criar usuário"
        });
      }

      const newUserId = results.rows[0].cp_id;
      console.log("Usuário criado com ID:", newUserId);

      res.status(201).json({
        success: true,
        msg: "Usuário criado com sucesso",
        userId: newUserId
      });
    });

  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({
      success: false,
      msg: "Erro interno do servidor"
    });
  }
});

// Rota para editar usuário
router.put("/usuarios/:id", authenticateToken, upload.single('cp_foto_perfil'), async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  
  console.log("=== DEBUG EDITAR USUÁRIO ===");
  console.log("ID do usuário:", userId);
  console.log("Dados recebidos:", req.body);
  console.log("Arquivo recebido:", req.file);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      msg: "ID inválido"
    });
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
    cp_turma_id
  } = req.body;

  try {
    // Verificar se usuário existe
    const checkUserQuery = "SELECT * FROM cp_usuarios WHERE cp_id = $1 AND cp_excluido = 0";
    const userExists = await new Promise<any>((resolve, reject) => {
      db.query(checkUserQuery, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results.rows.length > 0 ? results.rows[0] : null);
      });
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        msg: "Usuário não encontrado"
      });
    }

    // Verificar se login já existe (exceto para o próprio usuário)
    if (cp_login && cp_login !== userExists.cp_login) {
      const checkLoginQuery = "SELECT cp_id FROM cp_usuarios WHERE cp_login = $1 AND cp_id != $2 AND cp_excluido = 0";
      const loginExists = await new Promise((resolve, reject) => {
        db.query(checkLoginQuery, [cp_login, userId], (err, results) => {
          if (err) reject(err);
          else resolve(results.rows.length > 0);
        });
      });

      if (loginExists) {
        return res.status(400).json({
          success: false,
          msg: "Login já existe"
        });
      }
    }

    // Preparar dados para atualização
    let hashedPassword = userExists.cp_password;
    if (cp_password && cp_password.trim() !== '') {
      hashedPassword = await hashPassword(cp_password);
    }

    // Caminho da foto de perfil
    let fotoPerfilPath = userExists.cp_foto_perfil;
    if (req.file) {
      fotoPerfilPath = `FotoPerfil/${req.file.filename}`;
    }

    const updateQuery = `
      UPDATE cp_usuarios SET 
        cp_nome = $1,
        cp_email = $2,
        cp_login = $3,
        cp_password = $4,
        cp_tipo_user = $5,
        cp_rg = $6,
        cp_cpf = $7,
        cp_datanascimento = $8,
        cp_estadocivil = $9,
        cp_cnpj = $10,
        cp_ie = $11,
        cp_whatsapp = $12,
        cp_telefone = $13,
        cp_empresaatuacao = $14,
        cp_profissao = $15,
        cp_end_cidade_estado = $16,
        cp_end_rua = $17,
        cp_end_num = $18,
        cp_end_cep = $19,
        cp_descricao = $20,
        cp_foto_perfil = $21,
        cp_escola_id = $22,
        cp_turma_id = $23,
        updated_at = CURRENT_TIMESTAMP
      WHERE cp_id = $24 AND cp_excluido = 0
    `;

    const values = [
      cp_nome || userExists.cp_nome,
      cp_email || userExists.cp_email,
      cp_login || userExists.cp_login,
      hashedPassword,
      cp_tipo_user ? parseInt(cp_tipo_user) : userExists.cp_tipo_user,
      cp_rg !== undefined ? cp_rg : userExists.cp_rg,
      cp_cpf || userExists.cp_cpf,
      cp_datanascimento || userExists.cp_datanascimento,
      cp_estadocivil !== undefined ? cp_estadocivil : userExists.cp_estadocivil,
      cp_cnpj !== undefined ? (cp_cnpj ? BigInt(cp_cnpj) : null) : userExists.cp_cnpj,
      cp_ie !== undefined ? (cp_ie ? BigInt(cp_ie) : null) : userExists.cp_ie,
      cp_whatsapp !== undefined ? cp_whatsapp : userExists.cp_whatsapp,
      cp_telefone || userExists.cp_telefone,
      cp_empresaatuacao !== undefined ? cp_empresaatuacao : userExists.cp_empresaatuacao,
      cp_profissao !== undefined ? cp_profissao : userExists.cp_profissao,
      cp_end_cidade_estado !== undefined ? cp_end_cidade_estado : userExists.cp_end_cidade_estado,
      cp_end_rua !== undefined ? cp_end_rua : userExists.cp_end_rua,
      cp_end_num !== undefined ? cp_end_num : userExists.cp_end_num,
      cp_end_cep !== undefined ? cp_end_cep : userExists.cp_end_cep,
      cp_descricao !== undefined ? cp_descricao : userExists.cp_descricao,
      fotoPerfilPath,
      cp_escola_id !== undefined ? (cp_escola_id ? parseInt(cp_escola_id) : null) : userExists.cp_escola_id,
      cp_turma_id !== undefined ? (cp_turma_id ? parseInt(cp_turma_id) : null) : userExists.cp_turma_id,
      userId
    ];

    db.query(updateQuery, values, (err, results) => {
      if (err) {
        console.error("Erro ao atualizar usuário:", err);
        return res.status(500).json({
          success: false,
          msg: "Erro ao atualizar usuário"
        });
      }

      console.log("Usuário atualizado com sucesso:", userId);

      res.json({
        success: true,
        msg: "Usuário atualizado com sucesso"
      });
    });

  } catch (error) {
    console.error("Erro na edição:", error);
    res.status(500).json({
      success: false,
      msg: "Erro interno do servidor"
    });
  }
});

// Rota para excluir usuário (exclusão lógica)
router.delete("/usuarios/:id", authenticateToken, (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  
  console.log("=== DEBUG EXCLUIR USUÁRIO ===");
  console.log("ID do usuário:", userId);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      msg: "ID inválido"
    });
  }

  const updateQuery = "UPDATE cp_usuarios SET cp_excluido = 1, updated_at = CURRENT_TIMESTAMP WHERE cp_id = $1 AND cp_excluido = 0";
  
  db.query(updateQuery, [userId], (err, results) => {
    if (err) {
      console.error("Erro ao excluir usuário:", err);
      return res.status(500).json({
        success: false,
        msg: "Erro ao excluir usuário"
      });
    }

    if (results.rowCount === 0) {
      return res.status(404).json({
        success: false,
        msg: "Usuário não encontrado"
      });
    }

    console.log("Usuário excluído com sucesso:", userId);

    res.json({
      success: true,
      msg: "Usuário excluído com sucesso"
    });
  });
});

// Rota para buscar usuários por escola
router.get("/usuarios/escola/:escolaId", authenticateToken, (req: Request, res: Response) => {
  const escolaId = parseInt(req.params.escolaId);
  
  console.log("=== DEBUG BUSCAR USUÁRIOS POR ESCOLA ===");
  console.log("ID da escola:", escolaId);

  if (isNaN(escolaId)) {
    return res.status(400).json({
      success: false,
      msg: "ID da escola inválido"
    });
  }

  const query = "SELECT * FROM cp_usuarios WHERE cp_escola_id = $1 AND cp_excluido = 0 ORDER BY cp_nome";
  
  db.query(query, [escolaId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuários por escola:", err);
      return res.status(500).json({
        success: false,
        msg: "Erro ao buscar usuários"
      });
    }

    // Remover senhas dos resultados
    const usuarios = results.rows.map(user => {
      const { cp_password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    console.log(`Encontrados ${usuarios.length} usuários na escola ${escolaId}`);

    res.json({
      success: true,
      usuarios: usuarios
    });
  });
});

// Rota para buscar usuários por turma
router.get("/usuarios/turma/:turmaId", authenticateToken, (req: Request, res: Response) => {
  const turmaId = parseInt(req.params.turmaId);
  
  console.log("=== DEBUG BUSCAR USUÁRIOS POR TURMA ===");
  console.log("ID da turma:", turmaId);

  if (isNaN(turmaId)) {
    return res.status(400).json({
      success: false,
      msg: "ID da turma inválido"
    });
  }

  const query = "SELECT * FROM cp_usuarios WHERE cp_turma_id = $1 AND cp_excluido = 0 ORDER BY cp_nome";
  
  db.query(query, [turmaId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuários por turma:", err);
      return res.status(500).json({
        success: false,
        msg: "Erro ao buscar usuários"
      });
    }

    // Remover senhas dos resultados
    const usuarios = results.rows.map(user => {
      const { cp_password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    console.log(`Encontrados ${usuarios.length} usuários na turma ${turmaId}`);

    res.json({
      success: true,
      usuarios: usuarios
    });
  });
});

export default router;

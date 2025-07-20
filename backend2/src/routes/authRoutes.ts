import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticateToken, hashPassword } from '../middleware/auth';

const router = Router();

// Configuração do banco de dados PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_super_segura_aqui";

// Rota de teste
router.get("/test", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Backend2 TypeScript está funcionando!",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3001,
  });
});

// Rota de login
router.post("/login", (req: Request, res: Response) => {
  const { login, password } = req.body;

  console.log("=== DEBUG LOGIN ===");
  console.log("Login recebido:", login);
  console.log("Password recebido:", password);
  console.log("Tipo do login:", typeof login);
  console.log("Tipo da password:", typeof password);

  if (!login || !password) {
    return res.status(400).json({
      success: false,
      msg: "Login e senha são obrigatórios",
    });
  }

  // Buscar usuário no banco de dados - primeiro vamos listar todos os usuários para debug
  const debugQuery = "SELECT cp_id, cp_login, cp_nome FROM cp_usuarios WHERE cp_excluido = 0";

  db.query(debugQuery, [], (debugErr, debugResults) => {
    if (!debugErr) {
      console.log("=== USUÁRIOS DISPONÍVEIS NO BANCO ===");
      debugResults.rows.forEach((user) => {
        console.log(`ID: ${user.cp_id}, Login: "${user.cp_login}", Nome: "${user.cp_nome}"`);
      });
    }

    // Agora fazer a busca real
    const query = "SELECT * FROM cp_usuarios WHERE cp_login = $1 AND cp_excluido = 0";

    console.log("Executando query:", query);
    console.log("Parâmetro:", login);

    db.query(query, [login], async (err, results) => {
      if (err) {
        console.error("Erro ao buscar usuário:", err);
        return res.status(500).json({
          success: false,
          msg: "Erro interno do servidor",
        });
      }

      console.log("Resultados encontrados:", results.rows.length);

      if (results.rows.length === 0) {
        console.log("Usuário não encontrado:", login);

        // Vamos tentar busca case-insensitive
        const caseInsensitiveQuery = "SELECT * FROM cp_usuarios WHERE LOWER(cp_login) = LOWER($1) AND cp_excluido = 0";
        db.query(caseInsensitiveQuery, [login], (err2, results2) => {
          if (!err2 && results2.rows.length > 0) {
            console.log("Usuário encontrado com busca case-insensitive:", results2.rows[0].cp_login);
          } else {
            console.log("Usuário não encontrado mesmo com busca case-insensitive");
          }
        });

        return res.status(401).json({
          success: false,
          msg: "Credenciais inválidas",
        });
      }

      const user = results.rows[0];
      console.log("Usuário encontrado:", {
        id: user.cp_id,
        login: user.cp_login,
        nome: user.cp_nome,
        email: user.cp_email,
        senha_length: user.cp_password?.length,
        senha_start: user.cp_password?.substring(0, 10),
      });

      try {
        // Verificar senha - primeiro tenta bcrypt, depois senha direta
        let isPasswordValid = false;

        if (user.cp_password && user.cp_password.startsWith("$2")) {
          // Senha já está hasheada com bcrypt
          console.log("Verificando senha com bcrypt...");
          isPasswordValid = await bcrypt.compare(password, user.cp_password);
        } else {
          // Senha em texto plano ou outro formato
          console.log("Verificando senha em texto plano...");
          console.log("Password do usuário:", user.cp_password);
          console.log("Password informada:", password);
          isPasswordValid = password === user.cp_password;
        }

        console.log("Senha válida:", isPasswordValid);

        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            msg: "Credenciais inválidas",
          });
        }

        // Gerar token JWT
        const tokenPayload = {
          id: user.cp_id,
          login: user.cp_login,
          nome: user.cp_nome,
          tipo: user.cp_tipo_user,
          escola_id: user.cp_escola_id,
          turma_id: user.cp_turma_id,
        };

        console.log("Payload do token:", tokenPayload);

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });

        console.log("Token gerado:", token.substring(0, 50) + "...");

        // Retornar dados no formato esperado pelo frontend
        const responseData = {
          success: true,
          msg: "Usuário Logado com sucesso",
          token,
          userType: user.cp_tipo_user,
          userName: user.cp_nome,
          userId: user.cp_id,
          userProfilePhoto: user.cp_foto_perfil,
          schoolId: user.cp_escola_id,
          turmaID: user.cp_turma_id,
          user: {
            id: user.cp_id,
            nome: user.cp_nome,
            email: user.cp_email,
            login: user.cp_login,
            tipo: user.cp_tipo_user,
            escola_id: user.cp_escola_id,
            turma_id: user.cp_turma_id,
            foto_perfil: user.cp_foto_perfil,
          },
        };

        console.log("Resposta de sucesso:", responseData);
        res.json(responseData);
      } catch (error) {
        console.error("Erro ao verificar senha:", error);
        return res.status(500).json({
          success: false,
          msg: "Erro interno do servidor",
        });
      }
    });
  });
});

// Rota para verificar token
router.get("/verify-token", authenticateToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Rota para buscar dados do usuário logado
router.get("/me", authenticateToken, (req: Request, res: Response) => {
  const query = "SELECT * FROM cp_usuarios WHERE cp_id = $1 AND cp_excluido = 0";

  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar dados do usuário:", err);
      return res.status(500).json({ error: "Erro ao buscar dados do usuário" });
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

export default router;
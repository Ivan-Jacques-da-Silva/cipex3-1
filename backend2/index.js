const express = require("express");
require("dotenv").config();
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3001;

// JWT Secret - em produção, coloque isso no .env
const JWT_SECRET =
  process.env.JWT_SECRET || "sua_chave_secreta_super_segura_aqui";

// Função para hash de senha
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("=== MIDDLEWARE AUTH ===");
  console.log("Authorization header:", authHeader);

  const token = authHeader && authHeader.split(" ")[1];
  console.log(
    "Token extraído:",
    token ? token.substring(0, 50) + "..." : "null",
  );

  if (!token) {
    console.log("Token não fornecido");
    return res.status(401).json({ error: "Token de acesso requerido" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Erro ao verificar token:", err.message);
      return res.status(403).json({ error: "Token inválido" });
    }
    console.log("Token válido, usuário:", user);
    req.user = user;
    next();
  });
};

// Configuração de CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://0.0.0.0:3000",
    "https://localhost:3000",
    "https://0.0.0.0:3000",
    /\.replit\.dev$/,
    /\.replit\.com$/,
    /\.replit\.co$/,
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do banco de dados PostgreSQL
const db = new Pool({
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

// Configuração do multer para upload de arquivos
const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "materialdeaula");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "AudiosCurso");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const materialCursoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "MaterialCurso");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const materialExtraStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "MaterialExtra");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const materialUpload = multer({ storage: materialStorage });
const audioUpload = multer({ storage: audioStorage });
const materialCursoUpload = multer({ storage: materialCursoStorage });
const materialExtraUpload = multer({ storage: materialExtraStorage });

// Servir arquivos estáticos
app.use(
  "/materialdeaula",
  express.static(path.join(__dirname, "materialdeaula")),
);
app.use("/AudiosCurso", express.static(path.join(__dirname, "AudiosCurso")));
app.use(
  "/MaterialCurso",
  express.static(path.join(__dirname, "MaterialCurso")),
);
app.use(
  "/MaterialExtra",
  express.static(path.join(__dirname, "MaterialExtra")),
);

// ROTAS DA API

// Rota de teste
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend2 está funcionando!",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Rota de login
app.post("/login", (req, res) => {
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
  const debugQuery =
    "SELECT cp_id, cp_login, cp_nome FROM cp_usuarios WHERE cp_excluido = 0";

  db.query(debugQuery, [], (debugErr, debugResults) => {
    if (!debugErr) {
      console.log("=== USUÁRIOS DISPONÍVEIS NO BANCO ===");
      debugResults.rows.forEach((user) => {
        console.log(
          `ID: ${user.cp_id}, Login: "${user.cp_login}", Nome: "${user.cp_nome}"`,
        );
      });
    }

    // Agora fazer a busca real
    const query =
      "SELECT * FROM cp_usuarios WHERE cp_login = $1 AND cp_excluido = 0";

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
        const caseInsensitiveQuery =
          "SELECT * FROM cp_usuarios WHERE LOWER(cp_login) = LOWER($1) AND cp_excluido = 0";
        db.query(caseInsensitiveQuery, [login], (err2, results2) => {
          if (!err2 && results2.rows.length > 0) {
            console.log(
              "Usuário encontrado com busca case-insensitive:",
              results2.rows[0].cp_login,
            );
          } else {
            console.log(
              "Usuário não encontrado mesmo com busca case-insensitive",
            );
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
app.get("/verify-token", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Rota para buscar dados do usuário logado
app.get("/me", authenticateToken, (req, res) => {
  const query =
    "SELECT * FROM cp_usuarios WHERE cp_id = $1 AND cp_excluido = 0";

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

// Rota para registro de usuários
app.post("/register", async (req, res) => {
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

// 1. Rota para buscar todas as turmas
app.get("/turmas", authenticateToken, (req, res) => {
  const query = `
    SELECT 
      t.*, 
      u.cp_nome as nomeDoProfessor,
      u.cp_nome as nomedoprofessor,
      e.cp_ec_nome as nomeDaEscola 
    FROM cp_turmas t
    LEFT JOIN cp_usuarios u ON t.cp_tr_id_professor = u.cp_id
    LEFT JOIN cp_escolas e ON t.cp_tr_id_escola = e.cp_ec_id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar turmas:", err);
      return res.status(500).json({ error: "Erro ao buscar turmas" });
    }
    res.json(results.rows);
  });
});

// 2. Rota para buscar turmas com alunos
app.get("/turmasComAlunos", (req, res) => {
  const query = `
    SELECT 
      t.*,
      u.cp_nome as nomeDoProfessor,
      e.cp_ec_nome as nomeDaEscola
    FROM cp_turmas t
    LEFT JOIN cp_usuarios u ON t.cp_tr_id_professor = u.cp_id
    LEFT JOIN cp_escolas e ON t.cp_tr_id_escola = e.cp_ec_id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar turmas com alunos:", err);
      return res
        .status(500)
        .json({ error: "Erro ao buscar turmas com alunos" });
    }
    res.json(results.rows);
  });
});

// 3. Rota para buscar alunos de uma turma específica
app.get("/turmas/:turmaId/alunos", (req, res) => {
  const { turmaId } = req.params;

  const query = `
    SELECT 
      u.*
    FROM cp_usuarios u
    WHERE u.cp_turma_id = $1 AND u.cp_tipo_user = 5 AND u.cp_excluido = 0
  `;

  db.query(query, [turmaId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar alunos da turma:", err);
      return res.status(500).json({ error: "Erro ao buscar alunos da turma" });
    }
    res.json(results.rows);
  });
});

// 4. Rota para buscar curso por ID
app.get("/cursos/:cursoId", (req, res) => {
  const { cursoId } = req.params;

  const query = "SELECT * FROM cp_cursos WHERE cp_id_curso = $1";

  db.query(query, [cursoId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar curso:", err);
      return res.status(500).json({ error: "Erro ao buscar curso" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    res.json(results.rows[0]);
  });
});

// Rota para buscar alunos de uma escola específica
app.get("/escola/alunos/:escolaId", (req, res) => {
  const { escolaId } = req.params;

  const query = `
    SELECT *
    FROM cp_usuarios 
    WHERE cp_escola_id = $1 AND cp_tipo_user = 5 AND cp_excluido = 0
    ORDER BY cp_nome ASC
  `;

  db.query(query, [escolaId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar alunos da escola:", err);
      return res.status(500).json({ error: "Erro ao buscar alunos da escola" });
    }
    res.json(results.rows);
  });
});

// 5. Rota para buscar múltiplos cursos
app.post("/cursos/batch", (req, res) => {
  const { cursoIds } = req.body;

  if (!cursoIds || cursoIds.length === 0) {
    return res.json([]);
  }

  const placeholders = cursoIds.map((_, index) => `$${index + 1}`).join(",");
  const query = `SELECT * FROM cp_cursos WHERE cp_id IN (${placeholders})`;

  db.query(query, cursoIds, (err, results) => {
    if (err) {
      console.error("Erro ao buscar cursos em lote:", err);
      return res.status(500).json({ error: "Erro ao buscar cursos em lote" });
    }
    res.json(results.rows);
  });
});

// 6. Rota para deletar turma
app.delete("/delete-turma/:turmaId", authenticateToken, (req, res) => {
  const { turmaId } = req.params;

  const query = "DELETE FROM cp_turmas WHERE cp_tr_id = $1";

  db.query(query, [turmaId], (err, result) => {
    if (err) {
      console.error("Erro ao deletar turma:", err);
      return res.status(500).json({ error: "Erro ao deletar turma" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    res.json({ message: "Turma deletada com sucesso" });
  });
});

// 7. Rota para buscar professores
app.get("/users-professores", (req, res) => {
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

// 8. Rota para buscar turmas de um professor
app.get("/cp_turmas/professor/:professorId", (req, res) => {
  const { professorId } = req.params;

  const query = "SELECT * FROM cp_turmas WHERE cp_tr_id_professor = $1";

  db.query(query, [professorId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar turmas do professor:", err);
      return res
        .status(500)
        .json({ error: "Erro ao buscar turmas do professor" });
    }
    res.json(results.rows);
  });
});

// 9. Rota para buscar todos os materiais
app.get("/materiais", (req, res) => {
  const query = "SELECT * FROM cp_materiais_extra";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar materiais:", err);
      return res.status(500).json({ error: "Erro ao buscar materiais" });
    }
    res.json(results.rows);
  });
});

// 10. Rota para buscar materiais de uma turma específica
app.get("/materiais/:turmaID", (req, res) => {
  const { turmaID } = req.params;

  const query = `
    SELECT 
      cp_res_id, 
      cp_res_turma_id, 
      cp_res_data, 
      cp_res_hora, 
      cp_res_resumo, 
      cp_res_arquivo, 
      cp_res_aula, 
      cp_res_link, 
      cp_res_link_youtube 
    FROM cp_resumos 
    WHERE cp_res_turma_id = $1
  `;

  db.query(query, [turmaID], (err, results) => {
    if (err) {
      console.error("Erro ao buscar materiais da turma:", err);
      return res
        .status(500)
        .json({ error: "Erro ao buscar materiais da turma" });
    }
    res.json(results.rows);
  });
});

// 11. Rota para salvar resumo
app.post("/resumos", materialUpload.single("arquivo"), (req, res) => {
  const { turmaId, resumo, data, hora, aula, link, linkYoutube } = req.body;
  const arquivo = req.file ? req.file.filename : null;

  const query = `
    INSERT INTO cp_resumos (cp_res_turma_id, cp_res_data, cp_res_hora, cp_res_resumo, cp_res_arquivo, cp_res_aula, cp_res_link, cp_res_link_youtube)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;
  const values = [
    turmaId,
    data,
    hora,
    resumo,
    arquivo,
    aula,
    link,
    linkYoutube,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao inserir resumo:", err);
      return res.status(500).json({ error: "Erro ao salvar resumo" });
    }
    res.status(201).json({ message: "Resumo salvo com sucesso" });
  });
});

// 12. Rota para buscar resumos por data e turma
app.get("/resumos/:data/:turmaId", (req, res) => {
  const { data, turmaId } = req.params;

  const query = `
    SELECT 
      cp_res_id, 
      cp_res_turma_id, 
      cp_res_data, 
      cp_res_hora, 
      cp_res_resumo, 
      cp_res_arquivo, 
      cp_res_aula, 
      cp_res_link, 
      cp_res_link_youtube 
    FROM cp_resumos 
    WHERE cp_res_data = $1 AND cp_res_turma_id = $2
  `;

  db.query(query, [data, turmaId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar resumos:", err);
      return res.status(500).json({ error: "Erro ao buscar resumos" });
    }
    res.json(results.rows);
  });
});

// 13. Rota para buscar curso ID da turma
app.get("/curso-id-da-turma/:turmaId", (req, res) => {
  const { turmaId } = req.params;

  const query = "SELECT cp_tr_curso_id FROM cp_turmas WHERE cp_tr_id = $1";

  db.query(query, [turmaId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar curso ID da turma:", err);
      return res
        .status(500)
        .json({ error: "Erro ao buscar curso ID da turma" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    res.json(results.rows[0]);
  });
});

// 14. Rota para buscar material do curso
app.get("/curso-material/:cursoId", (req, res) => {
  const { cursoId } = req.params;

  const query = "SELECT * FROM cp_materiais WHERE cp_mat_curso_id = $1";

  db.query(query, [cursoId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar material do curso:", err);
      return res
        .status(500)
        .json({ error: "Erro ao buscar material do curso" });
    }
    res.json(results.rows);
  });
});

// 15. Rota para buscar áudios do curso
app.get("/audios-curso/:cursoId", (req, res) => {
  const { cursoId } = req.params;

  const query = "SELECT * FROM cp_audios WHERE cp_aud_curso_id = $1 AND cp_aud_excluido = 0 ORDER BY cp_aud_titulo";

  db.query(query, [cursoId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar áudios do curso:", err);
      return res.status(500).json({ error: "Erro ao buscar áudios do curso" });
    }
    
    // Mapear para o formato esperado pelo frontend
    const audiosFormatados = results.rows.map(audio => ({
      cp_aud_id: audio.cp_aud_id,
      cp_nome_audio: audio.cp_aud_titulo,
      cp_aud_titulo: audio.cp_aud_titulo,
      cp_aud_arquivo: audio.cp_aud_arquivo,
      cp_aud_curso_id: audio.cp_aud_curso_id,
      arquivo: audio.cp_aud_arquivo
    }));
    
    res.json(audiosFormatados);
  });
});

// 16. Rota para buscar áudios marcados pelo usuário
app.get("/audios-marcados/:userId", (req, res) => {
  const { userId } = req.params;

  // Assumindo que existe uma tabela para visualizações, senão retornamos array vazio
  res.json([]);
});

// 17. Rota para registrar visualização de áudio
app.post("/registrar-visualizacao", (req, res) => {
  const { userId, audioId } = req.body;

  // Por enquanto apenas retornamos sucesso, pois não temos a tabela de visualizações no schema
  res.json({ message: "Visualização registrada com sucesso" });
});

// 18. Rota para buscar todos os cursos
app.get("/cursos", (req, res) => {
  const query = "SELECT * FROM cp_cursos";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar cursos:", err);
      return res.status(500).json({ error: "Erro ao buscar cursos" });
    }
    res.json(results.rows);
  });
});

// Rota para buscar cursos para migração (compatibilidade)
app.get("/cursos-migracao", (req, res) => {
  const query = "SELECT cp_id_curso as cp_curso_id, cp_nome_curso, cp_youtube_link_curso, cp_pdf1_curso, cp_pdf2_curso, cp_pdf3_curso FROM cp_cursos ORDER BY cp_nome_curso";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar cursos:", err);
      return res.status(500).json({ error: "Erro ao buscar cursos" });
    }
    res.json(results.rows);
  });
});

// 19. Rota para deletar curso
app.delete("/delete-curso/:cursoId", authenticateToken, (req, res) => {
  const { cursoId } = req.params;

  const query = "DELETE FROM cp_cursos WHERE cp_id_curso = $1";

  db.query(query, [cursoId], (err, result) => {
    if (err) {
      console.error("Erro ao deletar curso:", err);
      return res.status(500).json({ error: "Erro ao deletar curso" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    res.json({ message: "Curso deletado com sucesso" });
  });
});

// 20. Rota para buscar material extra
app.get("/material-extra", (req, res) => {
  const query = "SELECT * FROM cp_materiais_extra";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar material extra:", err);
      return res.status(500).json({ error: "Erro ao buscar material extra" });
    }
    res.json(results.rows);
  });
});

// 21. Rota para deletar material extra
app.delete("/material-extra/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM cp_materiais_extra WHERE cp_mat_extra_id = $1";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar material extra:", err);
      return res.status(500).json({ error: "Erro ao deletar material extra" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Material não encontrado" });
    }

    res.json({ message: "Material deletado com sucesso" });
  });
});

// 22. Rota para buscar todas as escolas
app.get("/escolas", authenticateToken, (req, res) => {
  const query =
    "SELECT * FROM cp_escolas WHERE cp_ec_excluido = 0 OR cp_ec_excluido IS NULL";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar escolas:", err);
      return res.status(500).json({ error: "Erro ao buscar escolas" });
    }
    res.json(results.rows);
  });
});

// 23. Rota para buscar todos os usuários
app.get("/usuarios", (req, res) => {
  const query = "SELECT * FROM cp_usuarios WHERE cp_excluido = 0";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuários:", err);
      return res.status(500).json({ error: "Erro ao buscar usuários" });
    }
    res.json(results.rows);
  });
});

// 24. Rota para buscar turma específica por ID
app.get("/turmas/:turmaId", (req, res) => {
  const { turmaId } = req.params;

  const query = `
    SELECT 
      t.*,
      u.cp_nome as nomeDoProfessor,
      e.cp_ec_nome as nomeDaEscola
    FROM cp_turmas t
    LEFT JOIN cp_usuarios u ON t.cp_tr_id_professor = u.cp_id
    LEFT JOIN cp_escolas e ON t.cp_tr_id_escola = e.cp_ec_id
    WHERE t.cp_tr_id = $1
  `;

  db.query(query, [turmaId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar turma:", err);
      return res.status(500).json({ error: "Erro ao buscar turma" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    res.json(results.rows[0]);
  });
});

// 25. Rota para buscar usuários por tipo
app.get("/users-escolas", (req, res) => {
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

// 25. Rota proxy para download
app.get("/proxy-download", (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL é obrigatória" });
  }

  const filePath = path.join(__dirname, url);

  if (!filePath.startsWith(__dirname)) {
    return res.status(400).json({ error: "Caminho inválido" });
  }

  res.download(filePath, (err) => {
    if (err) {
      console.error("Erro ao fazer download:", err);
      res.status(404).json({ error: "Arquivo não encontrado" });
    }
  });
});

// Rota para obter alunos por escola
app.get("/escola/alunos/:escolaId", authenticateToken, (req, res) => {
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

// Rota para obter alunos específicos de uma turma
app.get("/turmas/:turmaId/alunos", authenticateToken, (req, res) => {
  const { turmaId } = req.params;

  if (!turmaId) {
    return res.status(400).json({ error: "Turma ID é obrigatório" });
  }

  const query = `
    SELECT cp_id, cp_nome, cp_cpf, cp_email, cp_tipo_user, cp_escola_id, cp_turma_id
    FROM cp_usuarios 
    WHERE cp_turma_id = $1 AND cp_tipo_user = 5
    ORDER BY cp_nome ASC
  `;

  db.query(query, [turmaId], (err, result) => {
    if (err) {
      console.error("Erro ao buscar alunos da turma:", err);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }

    res.status(200).json(result.rows);
  });
});

// ROTAS DE CADASTRO - POST

// Cadastro de escola
app.post("/escolas", authenticateToken, (req, res) => {
  const { 
    cp_ec_nome, 
    cp_ec_responsavel,
    cp_ec_endereco_rua,
    cp_ec_endereco_numero,
    cp_ec_endereco_cidade,
    cp_ec_endereco_bairro,
    cp_ec_endereco_estado,
    cp_ec_data_cadastro,
    cp_ec_descricao
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
    cp_ec_descricao
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

// Cadastro de curso
app.post("/cursos", authenticateToken, (req, res) => {
  const { cp_nome, cp_descricao, cp_preco, cp_duracao_meses } = req.body;

  if (!cp_nome) {
    return res.status(400).json({ error: "Nome do curso é obrigatório" });
  }

  const query = `
    INSERT INTO cp_cursos (cp_nome_curso, cp_descricao, cp_preco, cp_duracao_meses)
    VALUES ($1, $2, $3, $4) RETURNING *
  `;

  const values = [cp_nome, cp_descricao, cp_preco || 0, cp_duracao_meses || 0];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar curso:", err);
      return res.status(500).json({ error: "Erro ao cadastrar curso" });
    }

    res.status(201).json({
      success: true,
      message: "Curso cadastrado com sucesso",
      curso: result.rows[0],
    });
  });
});

// Cadastro de turma
app.post("/turmas", authenticateToken, async (req, res) => {
  const {
    cp_tr_nome,
    cp_tr_data,
    cp_tr_id_escola,
    cp_tr_id_professor,
    cp_tr_curso_id,
    cp_tr_dias_semana,
    cp_tr_horario_inicio,
    cp_tr_horario_fim,
    cp_tr_alunos, // Array de IDs dos alunos selecionados
  } = req.body;

  if (!cp_tr_nome || !cp_tr_id_escola) {
    return res
      .status(400)
      .json({ error: "Nome da turma e escola são obrigatórios" });
  }

  try {
    // Inserir a turma
    const queryTurma = `
      INSERT INTO cp_turmas (
        cp_tr_nome, cp_tr_data, cp_tr_id_escola, cp_tr_id_professor,
        cp_tr_curso_id, cp_tr_dias_semana, cp_tr_horario_inicio, cp_tr_horario_fim
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;

    const values = [
      cp_tr_nome,
      cp_tr_data,
      cp_tr_id_escola,
      cp_tr_id_professor,
      cp_tr_curso_id,
      cp_tr_dias_semana,
      cp_tr_horario_inicio,
      cp_tr_horario_fim,
    ];

    const resultTurma = await new Promise((resolve, reject) => {
      db.query(queryTurma, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const turmaId = resultTurma.rows[0].cp_tr_id;
    console.log("Turma cadastrada com ID:", turmaId);

    // Atualizar cp_turma_id para os alunos selecionados
    if (Array.isArray(cp_tr_alunos) && cp_tr_alunos.length > 0) {
      console.log("Atualizando alunos com IDs:", cp_tr_alunos);
      
      const queryUpdateAlunos = `
        UPDATE cp_usuarios 
        SET cp_turma_id = $1, updated_at = NOW() 
        WHERE cp_id = ANY($2) AND cp_tipo_user = 5
      `;

      await new Promise((resolve, reject) => {
        db.query(queryUpdateAlunos, [turmaId, cp_tr_alunos], (err, result) => {
          if (err) reject(err);
          else {
            console.log(`${result.rowCount} alunos atualizados com a turma ${turmaId}`);
            resolve(result);
          }
        });
      });
    }

    res.status(201).json({
      success: true,
      message: "Turma cadastrada com sucesso",
      turma: resultTurma.rows[0],
      alunosAtualizados: cp_tr_alunos ? cp_tr_alunos.length : 0,
    });

  } catch (error) {
    console.error("Erro ao cadastrar turma:", error);
    res.status(500).json({ error: "Erro ao cadastrar turma" });
  }
});

// Cadastro de matrícula
app.post("/matriculas", authenticateToken, (req, res) => {
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
app.post("/cadastrar-matricula", authenticateToken, (req, res) => {
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
    tipoPagamento
  } = req.body;

  if (!usuarioId || !escolaId || !cursoId) {
    return res.status(400).json({ error: "Usuário, escola e curso são obrigatórios" });
  }

  // Validar e converter cursoId para integer
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
    tipoPagamento || "parcelado"
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
app.put("/editar-matricula/:id", authenticateToken, (req, res) => {
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
    tipoPagamento
  } = req.body;

  // Validar e converter IDs para integer
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
    parseInt(id)
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

// ROTAS DE BUSCA - GET

// Buscar matrículas
app.get("/matriculas", authenticateToken, (req, res) => {
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
app.get("/matriculas/:id", (req, res) => {
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

// Rota para buscar todos os alunos de uma escola para matrícula
app.get("/buscarusermatricula", (req, res) => {
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

// Rota para buscar dados do usuário para matrícula
app.get("/buscarusermatricula/:userId", (req, res) => {
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

// Buscar escola por ID
app.get("/escolas/:id", (req, res) => {
  const { id } = req.params;

  const query =
    "SELECT * FROM cp_escolas WHERE cp_ec_id = $1 AND (cp_ec_excluido = 0 OR cp_ec_excluido IS NULL)";

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

// Buscar usuário por ID
app.get("/usuarios/:id", (req, res) => {
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

// ROTAS DE EDIÇÃO - PUT

// Editar escola
app.put("/escolas/:id", authenticateToken, (req, res) => {
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
    cp_ec_descricao
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
    id
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

// Editar curso
app.put("/cursos/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { cp_nome, cp_descricao, cp_preco, cp_duracao_meses } = req.body;

  if (!cp_nome) {
    return res.status(400).json({ error: "Nome do curso é obrigatório" });
  }

  const query = `
    UPDATE cp_cursos 
    SET cp_nome_curso = $1, cp_descricao = $2, cp_preco = $3, cp_duracao_meses = $4, updated_at = NOW()
    WHERE cp_id_curso = $5 RETURNING *
  `;

  const values = [
    cp_nome,
    cp_descricao,
    cp_preco || 0,
    cp_duracao_meses || 0,
    id,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar curso:", err);
      return res.status(500).json({ error: "Erro ao atualizar curso" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    res.json({
      success: true,
      message: "Curso atualizado com sucesso",
      curso: result.rows[0],
    });
  });
});

// Editar turma
app.put("/turmas/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    cp_tr_nome,
    cp_tr_data,
    cp_tr_id_escola,
    cp_tr_id_professor,
    cp_tr_curso_id,
    cp_tr_dias_semana,
    cp_tr_horario_inicio,
    cp_tr_horario_fim,
    cp_tr_alunos, // Array de IDs dos alunos selecionados
  } = req.body;

  if (!cp_tr_nome || !cp_tr_id_escola) {
    return res
      .status(400)
      .json({ error: "Nome da turma e escola são obrigatórios" });
  }

  try {
    // Atualizar dados da turma
    const queryTurma = `
      UPDATE cp_turmas 
      SET cp_tr_nome = $1, cp_tr_data = $2, cp_tr_id_escola = $3, cp_tr_id_professor = $4,
          cp_tr_curso_id = $5, cp_tr_dias_semana = $6, cp_tr_horario_inicio = $7, cp_tr_horario_fim = $8
      WHERE cp_tr_id = $9 RETURNING *
    `;

    const values = [
      cp_tr_nome,
      cp_tr_data,
      cp_tr_id_escola,
      cp_tr_id_professor,
      cp_tr_curso_id,
      cp_tr_dias_semana,
      cp_tr_horario_inicio,
      cp_tr_horario_fim,
      id,
    ];

    const resultTurma = await new Promise((resolve, reject) => {
      db.query(queryTurma, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (resultTurma.rowCount === 0) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    // Remover todos os alunos desta turma primeiro
    await new Promise((resolve, reject) => {
      const queryRemoveAlunos = `
        UPDATE cp_usuarios 
        SET cp_turma_id = NULL, updated_at = NOW() 
        WHERE cp_turma_id = $1 AND cp_tipo_user = 5
      `;
      db.query(queryRemoveAlunos, [id], (err, result) => {
        if (err) reject(err);
        else {
          console.log(`${result.rowCount} alunos removidos da turma ${id}`);
          resolve(result);
        }
      });
    });

    // Adicionar os alunos selecionados à turma
    if (Array.isArray(cp_tr_alunos) && cp_tr_alunos.length > 0) {
      console.log("Atualizando alunos com IDs:", cp_tr_alunos);
      
      const queryUpdateAlunos = `
        UPDATE cp_usuarios 
        SET cp_turma_id = $1, updated_at = NOW() 
        WHERE cp_id = ANY($2) AND cp_tipo_user = 5
      `;

      await new Promise((resolve, reject) => {
        db.query(queryUpdateAlunos, [id, cp_tr_alunos], (err, result) => {
          if (err) reject(err);
          else {
            console.log(`${result.rowCount} alunos atualizados com a turma ${id}`);
            resolve(result);
          }
        });
      });
    }

    res.json({
      success: true,
      message: "Turma atualizada com sucesso",
      turma: resultTurma.rows[0],
      alunosAtualizados: cp_tr_alunos ? cp_tr_alunos.length : 0,
    });

  } catch (error) {
    console.error("Erro ao atualizar turma:", error);
    res.status(500).json({ error: "Erro ao atualizar turma" });
  }
});

// Editar usuário
app.put("/usuarios/:id", authenticateToken, async (req, res) => {
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
      .status(400).json({ error: "Campos obrigatórios: nome, email e login" });
  }

  try {
    let query;
    let values;

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

// ROTAS DE EXCLUSÃO - DELETE

// Deletar escola
app.delete("/escolas/:id", authenticateToken, (req, res) => {
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

// Deletar usuário
app.delete("/usuarios/:id", authenticateToken, (req, res) => {
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

// Deletar matrícula
app.delete("/matriculas/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const query =
    "UPDATE cp_matriculas SET cp_mt_excluido = 1 WHERE cp_mt_id = $1";

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

// ROTAS PARA CADASTRO DE ÁUDIO/CURSO

// Rota para cadastrar curso com PDFs
app.post("/cursos", materialCursoUpload.fields([
  { name: 'pdf1', maxCount: 1 },
  { name: 'pdf2', maxCount: 1 },
  { name: 'pdf3', maxCount: 1 }
]), (req, res) => {
  const { cp_nome_curso, cp_youtube_link_curso } = req.body;

  if (!cp_nome_curso) {
    return res.status(400).json({ error: "Nome do curso é obrigatório" });
  }

  const pdf1 = req.files?.pdf1 ? req.files.pdf1[0].filename : null;
  const pdf2 = req.files?.pdf2 ? req.files.pdf2[0].filename : null;
  const pdf3 = req.files?.pdf3 ? req.files.pdf3[0].filename : null;

  const query = `
    INSERT INTO cp_cursos (cp_nome_curso, cp_youtube_link_curso, cp_pdf1_curso, cp_pdf2_curso, cp_pdf3_curso, cp_descricao_curso, cp_preco_curso, cp_duracao_meses)
    VALUES ($1, $2, $3, $4, $5, '', 0, 0) RETURNING cp_id_curso
  `;

  const values = [cp_nome_curso, cp_youtube_link_curso || null, pdf1, pdf2, pdf3];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar curso:", err);
      return res.status(500).json({ error: "Erro ao cadastrar curso" });
    }

    res.status(201).json({
      success: true,
      message: "Curso cadastrado com sucesso",
      cursoId: result.rows[0].cp_id_curso
    });
  });
});

// Rota para cadastrar áudios de um curso
app.post("/register-audio/:cursoId", audioUpload.array('audios'), (req, res) => {
  const { cursoId } = req.params;
  const audios = req.files;

  if (!audios || audios.length === 0) {
    return res.status(400).json({ error: "Nenhum áudio foi enviado" });
  }

  // Validar formato MP3
  const invalidFiles = audios.filter(audio => !audio.mimetype.includes('audio') && !audio.originalname.toLowerCase().endsWith('.mp3'));
  if (invalidFiles.length > 0) {
    return res.status(400).json({ error: "Apenas arquivos de áudio .mp3 são permitidos" });
  }

  const queries = audios.map(audio => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO cp_audios (cp_aud_titulo, cp_aud_arquivo, cp_aud_curso_id)
        VALUES ($1, $2, $3)
      `;
      const values = [
        audio.originalname.replace('.mp3', ''), // Remove extensão do título
        audio.filename,
        parseInt(cursoId)
      ];

      db.query(query, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  });

  Promise.all(queries)
    .then(() => {
      res.status(201).json({
        success: true,
        message: `${audios.length} áudio(s) cadastrado(s) com sucesso`
      });
    })
    .catch(err => {
      console.error("Erro ao cadastrar áudios:", err);
      res.status(500).json({ error: "Erro ao cadastrar áudios" });
    });
});

// Rota para buscar curso por ID para edição
app.get("/curso/:cursoId", (req, res) => {
  const { cursoId } = req.params;

  const query = "SELECT * FROM cp_cursos WHERE cp_id_curso = $1";

  db.query(query, [cursoId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar curso:", err);
      return res.status(500).json({ error: "Erro ao buscar curso" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    res.json(results.rows[0]);
  });
});

// Rota para atualizar curso
app.put("/cursos/:cursoId", materialCursoUpload.fields([
  { name: 'pdf1', maxCount: 1 },
  { name: 'pdf2', maxCount: 1 },
  { name: 'pdf3', maxCount: 1 }
]), (req, res) => {
  const { cursoId } = req.params;
  const { cp_nome_curso, cp_youtube_link_curso } = req.body;

  if (!cp_nome_curso) {
    return res.status(400).json({ error: "Nome do curso é obrigatório" });
  }

  // Primeiro, buscar os PDFs atuais
  const getQuery = "SELECT cp_pdf1_curso, cp_pdf2_curso, cp_pdf3_curso FROM cp_cursos WHERE cp_id_curso = $1";
  
  db.query(getQuery, [cursoId], (err, currentResult) => {
    if (err) {
      console.error("Erro ao buscar curso atual:", err);
      return res.status(500).json({ error: "Erro ao buscar curso" });
    }

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    const currentData = currentResult.rows[0];
    
    // Usar novos arquivos se enviados, senão manter os atuais
    const pdf1 = req.files?.pdf1 ? req.files.pdf1[0].filename : currentData.cp_pdf1_curso;
    const pdf2 = req.files?.pdf2 ? req.files.pdf2[0].filename : currentData.cp_pdf2_curso;
    const pdf3 = req.files?.pdf3 ? req.files.pdf3[0].filename : currentData.cp_pdf3_curso;

    const updateQuery = `
      UPDATE cp_cursos 
      SET cp_nome_curso = $1, cp_youtube_link_curso = $2, cp_pdf1_curso = $3, cp_pdf2_curso = $4, cp_pdf3_curso = $5
      WHERE cp_id_curso = $6 RETURNING *
    `;

    const values = [cp_nome_curso, cp_youtube_link_curso || null, pdf1, pdf2, pdf3, cursoId];

    db.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error("Erro ao atualizar curso:", err);
        return res.status(500).json({ error: "Erro ao atualizar curso" });
      }

      res.json({
        success: true,
        message: "Curso atualizado com sucesso",
        curso: result.rows[0]
      });
    });
  });
});

// Rota para adicionar novos áudios a um curso existente
app.put("/update-audio/:cursoId", audioUpload.array('audios'), (req, res) => {
  const { cursoId } = req.params;
  const audios = req.files;

  if (!audios || audios.length === 0) {
    return res.status(200).json({
      success: true,
      message: "Nenhum áudio novo para adicionar"
    });
  }

  // Validar formato MP3
  const invalidFiles = audios.filter(audio => !audio.mimetype.includes('audio') && !audio.originalname.toLowerCase().endsWith('.mp3'));
  if (invalidFiles.length > 0) {
    return res.status(400).json({ error: "Apenas arquivos de áudio .mp3 são permitidos" });
  }

  const queries = audios.map(audio => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO cp_audios (cp_aud_titulo, cp_aud_arquivo, cp_aud_curso_id)
        VALUES ($1, $2, $3)
      `;
      const values = [
        audio.originalname.replace('.mp3', ''), // Remove extensão do título
        audio.filename,
        parseInt(cursoId)
      ];

      db.query(query, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  });

  Promise.all(queries)
    .then(() => {
      res.status(200).json({
        success: true,
        message: `${audios.length} áudio(s) adicionado(s) com sucesso`
      });
    })
    .catch(err => {
      console.error("Erro ao adicionar áudios:", err);
      res.status(500).json({ error: "Erro ao adicionar áudios" });
    });
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend2 rodando na porta ${PORT} em 0.0.0.0`);
  console.log(`Acesse em: http://0.0.0.0:${PORT}`);
});
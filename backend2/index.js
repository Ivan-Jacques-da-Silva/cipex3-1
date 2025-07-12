
const express = require('express');
require('dotenv').config();
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const app = express();
const PORT = process.env.PORT || 3001;

// JWT Secret - em produção, coloque isso no .env
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui';

// Função para hash de senha
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('=== MIDDLEWARE AUTH ===');
  console.log('Authorization header:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token extraído:', token ? token.substring(0, 50) + '...' : 'null');

  if (!token) {
    console.log('Token não fornecido');
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Erro ao verificar token:', err.message);
      return res.status(403).json({ error: 'Token inválido' });
    }
    console.log('Token válido, usuário:', user);
    req.user = user;
    next();
  });
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do banco de dados PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Teste de conexão
db.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado ao banco de dados PostgreSQL:', result.rows[0]);
  }
});

// Configuração do multer para upload de arquivos
const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'materialdeaula');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'AudiosCurso');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const materialCursoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'MaterialCurso');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const materialExtraStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'MaterialExtra');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const materialUpload = multer({ storage: materialStorage });
const audioUpload = multer({ storage: audioStorage });
const materialCursoUpload = multer({ storage: materialCursoStorage });
const materialExtraUpload = multer({ storage: materialExtraStorage });

// Servir arquivos estáticos
app.use('/materialdeaula', express.static(path.join(__dirname, 'materialdeaula')));
app.use('/AudiosCurso', express.static(path.join(__dirname, 'AudiosCurso')));
app.use('/MaterialCurso', express.static(path.join(__dirname, 'MaterialCurso')));
app.use('/MaterialExtra', express.static(path.join(__dirname, 'MaterialExtra')));

// ROTAS DA API

// Rota de login
app.post('/login', (req, res) => {
  const { login, password } = req.body;

  console.log('=== DEBUG LOGIN ===');
  console.log('Login recebido:', login);
  console.log('Password recebido:', password);
  console.log('Tipo do login:', typeof login);
  console.log('Tipo da password:', typeof password);

  if (!login || !password) {
    return res.status(400).json({ 
      success: false, 
      msg: 'Login e senha são obrigatórios' 
    });
  }

  // Buscar usuário no banco de dados - primeiro vamos listar todos os usuários para debug
  const debugQuery = 'SELECT cp_id, cp_login, cp_nome FROM cp_usuarios WHERE cp_excluido = 0';
  
  db.query(debugQuery, [], (debugErr, debugResults) => {
    if (!debugErr) {
      console.log('=== USUÁRIOS DISPONÍVEIS NO BANCO ===');
      debugResults.rows.forEach(user => {
        console.log(`ID: ${user.cp_id}, Login: "${user.cp_login}", Nome: "${user.cp_nome}"`);
      });
    }

    // Agora fazer a busca real
    const query = 'SELECT * FROM cp_usuarios WHERE cp_login = $1 AND cp_excluido = 0';
    
    console.log('Executando query:', query);
    console.log('Parâmetro:', login);
    
    db.query(query, [login], async (err, results) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ 
          success: false, 
          msg: 'Erro interno do servidor' 
        });
      }

      console.log('Resultados encontrados:', results.rows.length);
      
      if (results.rows.length === 0) {
        console.log('Usuário não encontrado:', login);
        
        // Vamos tentar busca case-insensitive
        const caseInsensitiveQuery = 'SELECT * FROM cp_usuarios WHERE LOWER(cp_login) = LOWER($1) AND cp_excluido = 0';
        db.query(caseInsensitiveQuery, [login], (err2, results2) => {
          if (!err2 && results2.rows.length > 0) {
            console.log('Usuário encontrado com busca case-insensitive:', results2.rows[0].cp_login);
          } else {
            console.log('Usuário não encontrado mesmo com busca case-insensitive');
          }
        });
        
        return res.status(401).json({ 
          success: false, 
          msg: 'Credenciais inválidas' 
        });
      }

      const user = results.rows[0];
      console.log('Usuário encontrado:', {
        id: user.cp_id,
        login: user.cp_login,
        nome: user.cp_nome,
        email: user.cp_email,
        senha_length: user.cp_password?.length,
        senha_start: user.cp_password?.substring(0, 10)
      });

      try {
        // Verificar senha - primeiro tenta bcrypt, depois senha direta
        let isPasswordValid = false;
        
        if (user.cp_password && user.cp_password.startsWith('$2')) {
          // Senha já está hasheada com bcrypt
          console.log('Verificando senha com bcrypt...');
          isPasswordValid = await bcrypt.compare(password, user.cp_password);
        } else {
          // Senha em texto plano ou outro formato
          console.log('Verificando senha em texto plano...');
          console.log('Password do usuário:', user.cp_password);
          console.log('Password informada:', password);
          isPasswordValid = (password === user.cp_password);
        }
        
        console.log('Senha válida:', isPasswordValid);
        
        if (!isPasswordValid) {
          return res.status(401).json({ 
            success: false, 
            msg: 'Credenciais inválidas' 
          });
        }

        // Gerar token JWT
        const tokenPayload = {
          id: user.cp_id,
          login: user.cp_login,
          nome: user.cp_nome,
          tipo: user.cp_tipo_user,
          escola_id: user.cp_escola_id,
          turma_id: user.cp_turma_id
        };
        
        console.log('Payload do token:', tokenPayload);
        
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
        
        console.log('Token gerado:', token.substring(0, 50) + '...');

        // Retornar dados no formato esperado pelo frontend
        const responseData = {
          success: true,
          msg: 'Usuário Logado com sucesso',
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
            foto_perfil: user.cp_foto_perfil
          }
        };
        
        console.log('Resposta de sucesso:', responseData);
        res.json(responseData);

      } catch (error) {
        console.error('Erro ao verificar senha:', error);
        return res.status(500).json({ 
          success: false, 
          msg: 'Erro interno do servidor' 
        });
      }
    });
  });
});

// Rota para verificar token
app.get('/verify-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Rota para buscar dados do usuário logado
app.get('/me', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM cp_usuarios WHERE cp_id = $1 AND cp_excluido = 0';
  
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar dados do usuário:', err);
      return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = results.rows[0];
    // Remover senha da resposta
    delete user.cp_password;
    
    res.json(user);
  });
});

// Rota para registro de usuários
app.post('/register', async (req, res) => {
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

  if (!cp_nome || !cp_email || !cp_login || !cp_password || !cp_cpf) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, email, login, senha e CPF' });
  }

  try {
    // Verificar se login já existe
    const checkQuery = 'SELECT cp_id FROM cp_usuarios WHERE cp_login = $1 OR cp_email = $2';
    db.query(checkQuery, [cp_login, cp_email], async (err, results) => {
      if (err) {
        console.error('Erro ao verificar usuário existente:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      if (results.rows.length > 0) {
        return res.status(400).json({ error: 'Login ou email já cadastrado' });
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
        cp_nome, cp_email, cp_login, hashedPassword, cp_tipo_user, cp_rg, cp_cpf,
        cp_datanascimento, cp_estadocivil, cp_cnpj, cp_ie, cp_whatsapp, cp_telefone,
        cp_empresaatuacao, cp_profissao, cp_end_cidade_estado, cp_end_rua, cp_end_num,
        cp_end_cep, cp_descricao, cp_escola_id, cp_turma_id
      ];

      db.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error('Erro ao cadastrar usuário:', err);
          return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
        }

        res.status(201).json({
          success: true,
          message: 'Usuário cadastrado com sucesso',
          userId: result.insertId
        });
      });
    });

  } catch (error) {
    console.error('Erro ao processar cadastro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 1. Rota para buscar todas as turmas
app.get('/turmas', (req, res) => {
  const query = `
    SELECT 
      t.*,
      u.cp_nome as nomeDoProfessor,
      e.cp_nome as nomeDaEscola
    FROM cp_turmas t
    LEFT JOIN cp_usuarios u ON t.cp_tr_id_professor = u.cp_id
    LEFT JOIN cp_escolas e ON t.cp_tr_id_escola = e.cp_id
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar turmas:', err);
      return res.status(500).json({ error: 'Erro ao buscar turmas' });
    }
    res.json(results);
  });
});

// 2. Rota para buscar turmas com alunos
app.get('/turmasComAlunos', (req, res) => {
  const query = `
    SELECT 
      t.*,
      u.cp_nome as nomeDoProfessor,
      e.cp_nome as nomeDaEscola
    FROM cp_turmas t
    LEFT JOIN cp_usuarios u ON t.cp_tr_id_professor = u.cp_id
    LEFT JOIN cp_escolas e ON t.cp_tr_id_escola = e.cp_id
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar turmas com alunos:', err);
      return res.status(500).json({ error: 'Erro ao buscar turmas com alunos' });
    }
    res.json(results);
  });
});

// 3. Rota para buscar alunos de uma turma específica
app.get('/turmas/:turmaId/alunos', (req, res) => {
  const { turmaId } = req.params;
  
  const query = `
    SELECT 
      u.*
    FROM cp_usuarios u
    INNER JOIN cp_turmas_alunos ta ON u.cp_id = ta.cp_aluno_id
    WHERE ta.cp_turma_id = ? AND u.cp_tipo = 5
  `;
  
  db.query(query, [turmaId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar alunos da turma:', err);
      return res.status(500).json({ error: 'Erro ao buscar alunos da turma' });
    }
    res.json(results);
  });
});

// 4. Rota para buscar curso por ID
app.get('/cursos/:cursoId', (req, res) => {
  const { cursoId } = req.params;
  
  const query = 'SELECT * FROM cp_cursos WHERE cp_id = ?';
  
  db.query(query, [cursoId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar curso:', err);
      return res.status(500).json({ error: 'Erro ao buscar curso' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    res.json(results[0]);
  });
});

// 5. Rota para buscar múltiplos cursos
app.post('/cursos/batch', (req, res) => {
  const { cursoIds } = req.body;
  
  if (!cursoIds || cursoIds.length === 0) {
    return res.json([]);
  }
  
  const placeholders = cursoIds.map(() => '?').join(',');
  const query = `SELECT * FROM cp_cursos WHERE cp_id IN (${placeholders})`;
  
  db.query(query, cursoIds, (err, results) => {
    if (err) {
      console.error('Erro ao buscar cursos em lote:', err);
      return res.status(500).json({ error: 'Erro ao buscar cursos em lote' });
    }
    res.json(results);
  });
});

// 6. Rota para deletar turma
app.delete('/delete-turma/:turmaId', authenticateToken, (req, res) => {
  const { turmaId } = req.params;
  
  const query = 'DELETE FROM cp_turmas WHERE cp_tr_id = ?';
  
  db.query(query, [turmaId], (err, result) => {
    if (err) {
      console.error('Erro ao deletar turma:', err);
      return res.status(500).json({ error: 'Erro ao deletar turma' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }
    
    res.json({ message: 'Turma deletada com sucesso' });
  });
});

// 7. Rota para buscar professores
app.get('/users-professores', (req, res) => {
  const query = 'SELECT * FROM cp_usuarios WHERE cp_tipo = 4';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar professores:', err);
      return res.status(500).json({ error: 'Erro ao buscar professores' });
    }
    res.json(results);
  });
});

// 8. Rota para buscar turmas de um professor
app.get('/cp_turmas/professor/:professorId', (req, res) => {
  const { professorId } = req.params;
  
  const query = 'SELECT * FROM cp_turmas WHERE cp_tr_id_professor = ?';
  
  db.query(query, [professorId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar turmas do professor:', err);
      return res.status(500).json({ error: 'Erro ao buscar turmas do professor' });
    }
    res.json(results);
  });
});

// 9. Rota para buscar todos os materiais
app.get('/materiais', (req, res) => {
  const query = 'SELECT * FROM cp_materiais_extra';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar materiais:', err);
      return res.status(500).json({ error: 'Erro ao buscar materiais' });
    }
    res.json(results);
  });
});

// 10. Rota para buscar materiais de uma turma específica
app.get('/materiais/:turmaID', (req, res) => {
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
    WHERE cp_res_turma_id = ?
  `;
  
  db.query(query, [turmaID], (err, results) => {
    if (err) {
      console.error('Erro ao buscar materiais da turma:', err);
      return res.status(500).json({ error: 'Erro ao buscar materiais da turma' });
    }
    res.json(results);
  });
});

// 11. Rota para salvar resumo
app.post('/resumos', materialUpload.single('arquivo'), (req, res) => {
  const { turmaId, resumo, data, hora, aula, link, linkYoutube } = req.body;
  const arquivo = req.file ? req.file.filename : null;

  const query = `
    INSERT INTO cp_resumos (cp_res_turma_id, cp_res_data, cp_res_hora, cp_res_resumo, cp_res_arquivo, cp_res_aula, cp_res_link, cp_res_link_youtube)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [turmaId, data, hora, resumo, arquivo, aula, link, linkYoutube];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao inserir resumo:", err);
      return res.status(500).json({ error: 'Erro ao salvar resumo' });
    }
    res.status(201).json({ message: 'Resumo salvo com sucesso' });
  });
});

// 12. Rota para buscar resumos por data e turma
app.get('/resumos/:data/:turmaId', (req, res) => {
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
    WHERE cp_res_data = ? AND cp_res_turma_id = ?
  `;

  db.query(query, [data, turmaId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar resumos:', err);
      return res.status(500).json({ error: 'Erro ao buscar resumos' });
    }
    res.json(results);
  });
});

// 13. Rota para buscar curso ID da turma
app.get('/curso-id-da-turma/:turmaId', (req, res) => {
  const { turmaId } = req.params;
  
  const query = 'SELECT cp_tr_curso_id FROM cp_turmas WHERE cp_tr_id = ?';
  
  db.query(query, [turmaId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar curso ID da turma:', err);
      return res.status(500).json({ error: 'Erro ao buscar curso ID da turma' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }
    
    res.json(results[0]);
  });
});

// 14. Rota para buscar material do curso
app.get('/curso-material/:cursoId', (req, res) => {
  const { cursoId } = req.params;
  
  const query = 'SELECT * FROM cp_materiais WHERE cp_mat_curso_id = ?';
  
  db.query(query, [cursoId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar material do curso:', err);
      return res.status(500).json({ error: 'Erro ao buscar material do curso' });
    }
    res.json(results);
  });
});

// 15. Rota para buscar áudios do curso
app.get('/audios-curso/:cursoId', (req, res) => {
  const { cursoId } = req.params;
  
  const query = 'SELECT * FROM cp_audios WHERE cp_audio_curso_id = ?';
  
  db.query(query, [cursoId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar áudios do curso:', err);
      return res.status(500).json({ error: 'Erro ao buscar áudios do curso' });
    }
    res.json(results);
  });
});

// 16. Rota para buscar áudios marcados pelo usuário
app.get('/audios-marcados/:userId', (req, res) => {
  const { userId } = req.params;
  
  const query = 'SELECT cp_audio_id FROM cp_visualizacoes_audio WHERE cp_usuario_id = ?';
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar áudios marcados:', err);
      return res.status(500).json({ error: 'Erro ao buscar áudios marcados' });
    }
    
    const audioIds = results.map(row => row.cp_audio_id);
    res.json(audioIds);
  });
});

// 17. Rota para registrar visualização de áudio
app.post('/registrar-visualizacao', (req, res) => {
  const { userId, audioId } = req.body;
  
  // Verificar se já existe
  const checkQuery = 'SELECT * FROM cp_visualizacoes_audio WHERE cp_usuario_id = ? AND cp_audio_id = ?';
  
  db.query(checkQuery, [userId, audioId], (err, results) => {
    if (err) {
      console.error('Erro ao verificar visualização:', err);
      return res.status(500).json({ error: 'Erro ao verificar visualização' });
    }
    
    if (results.length > 0) {
      return res.json({ message: 'Visualização já registrada' });
    }
    
    // Inserir nova visualização
    const insertQuery = 'INSERT INTO cp_visualizacoes_audio (cp_usuario_id, cp_audio_id, cp_data_visualizacao) VALUES (?, ?, NOW())';
    
    db.query(insertQuery, [userId, audioId], (err, result) => {
      if (err) {
        console.error('Erro ao registrar visualização:', err);
        return res.status(500).json({ error: 'Erro ao registrar visualização' });
      }
      res.json({ message: 'Visualização registrada com sucesso' });
    });
  });
});

// 18. Rota para buscar todos os cursos
app.get('/cursos', (req, res) => {
  const query = 'SELECT * FROM cp_cursos';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar cursos:', err);
      return res.status(500).json({ error: 'Erro ao buscar cursos' });
    }
    res.json(results);
  });
});

// 19. Rota para deletar curso
app.delete('/delete-curso/:cursoId', authenticateToken, (req, res) => {
  const { cursoId } = req.params;
  
  const query = 'DELETE FROM cp_cursos WHERE cp_curso_id = ?';
  
  db.query(query, [cursoId], (err, result) => {
    if (err) {
      console.error('Erro ao deletar curso:', err);
      return res.status(500).json({ error: 'Erro ao deletar curso' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    res.json({ message: 'Curso deletado com sucesso' });
  });
});

// 20. Rota para buscar material extra
app.get('/material-extra', (req, res) => {
  const query = 'SELECT * FROM cp_materiais_extra';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar material extra:', err);
      return res.status(500).json({ error: 'Erro ao buscar material extra' });
    }
    res.json(results);
  });
});

// 21. Rota para deletar material extra
app.delete('/material-extra/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM cp_materiais_extra WHERE cp_mat_extra_id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Erro ao deletar material extra:', err);
      return res.status(500).json({ error: 'Erro ao deletar material extra' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }
    
    res.json({ message: 'Material deletado com sucesso' });
  });
});

// 22. Rota proxy para download
app.get('/proxy-download', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }
  
  const filePath = path.join(__dirname, url);
  
  if (!filePath.startsWith(__dirname)) {
    return res.status(400).json({ error: 'Caminho inválido' });
  }
  
  res.download(filePath, (err) => {
    if (err) {
      console.error('Erro ao fazer download:', err);
      res.status(404).json({ error: 'Arquivo não encontrado' });
    }
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend2 rodando na porta ${PORT}`);
});

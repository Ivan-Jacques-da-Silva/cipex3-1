
const express = require('express');
require('dotenv').config();
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');


const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do banco de dados PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/cipex',
  ssl: false
});

// Conectar ao banco
db.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados PostgreSQL');
  release();
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
app.delete('/delete-turma/:turmaId', (req, res) => {
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
app.delete('/delete-curso/:cursoId', (req, res) => {
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
app.delete('/material-extra/:id', (req, res) => {
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

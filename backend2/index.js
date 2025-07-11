
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do banco de dados
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cipex'
});

// Conectar ao banco
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL');
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

const materialUpload = multer({ storage: materialStorage });

// Servir arquivos estáticos
app.use('/materialdeaula', express.static(path.join(__dirname, 'materialdeaula')));

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

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend2 rodando na porta ${PORT}`);
});

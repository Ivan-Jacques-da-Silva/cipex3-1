import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Configuração do banco de dados PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Configuração do multer para upload de áudios
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "AudiosCurso");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const audioUpload = multer({ storage: audioStorage });

// Buscar áudios do curso
router.get("/audios-curso/:cursoId", (req: Request, res: Response) => {
  const { cursoId } = req.params;

  console.log("=== DEBUG BUSCAR ÁUDIOS ===");
  console.log("Curso ID recebido:", cursoId);
  console.log("Tipo do cursoId:", typeof cursoId);

  if (!cursoId || cursoId === 'undefined') {
    console.log("Curso ID inválido ou undefined");
    return res.status(400).json({ error: "ID do curso é obrigatório" });
  }

  const query = "SELECT * FROM cp_audio WHERE cp_curso_id = $1 ORDER BY cp_nome_audio";

  console.log("Executando query:", query);
  console.log("Parâmetros:", [cursoId]);

  db.query(query, [cursoId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar áudios do curso:", err);
      return res.status(500).json({ error: "Erro ao buscar áudios do curso" });
    }

    console.log(`Encontrados ${results.rows.length} áudios para o curso ${cursoId}`);

    const audiosFormatados = results.rows.map((audio) => ({
      cp_audio_id: audio.cp_audio_id,
      cp_nome_audio: audio.cp_nome_audio,
      cp_arquivo_audio: audio.cp_arquivo_audio,
      cp_curso_id: audio.cp_curso_id,
      arquivo: audio.cp_arquivo_audio,
      url_audio: `${req.protocol}://${req.get("host")}/AudiosCurso/${audio.cp_arquivo_audio}`,
    }));

    console.log("Áudios formatados:", audiosFormatados);
    res.json(audiosFormatados);
  });
});

// Buscar todos os áudios (para admin - userType = 1)
router.get("/audios", (req: Request, res: Response) => {
  console.log("=== DEBUG BUSCAR TODOS OS ÁUDIOS ===");
  
  const query = `
    SELECT a.*, c.cp_nome_curso 
    FROM cp_audio a 
    LEFT JOIN cp_curso c ON a.cp_curso_id = c.cp_curso_id 
    ORDER BY c.cp_nome_curso, a.cp_nome_audio
  `;

  db.query(query, [], (err, results) => {
    if (err) {
      console.error("Erro ao buscar todos os áudios:", err);
      return res.status(500).json({ error: "Erro ao buscar áudios" });
    }

    console.log(`Encontrados ${results.rows.length} áudios no total`);

    const audiosFormatados = results.rows.map((audio) => ({
      cp_audio_id: audio.cp_audio_id,
      cp_nome_audio: audio.cp_nome_audio,
      cp_arquivo_audio: audio.cp_arquivo_audio,
      cp_curso_id: audio.cp_curso_id,
      cp_nome_curso: audio.cp_nome_curso,
      arquivo: audio.cp_arquivo_audio,
      url_audio: `${req.protocol}://${req.get("host")}/AudiosCurso/${audio.cp_arquivo_audio}`,
    }));

    res.json(audiosFormatados);
  });
});

// Buscar áudio específico por ID
router.get("/audio/:audioId", (req: Request, res: Response) => {
  const { audioId } = req.params;

  const query = "SELECT * FROM cp_audio WHERE cp_audio_id = $1";

  db.query(query, [audioId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar áudio:", err);
      return res.status(500).json({ error: "Erro ao buscar áudio" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Áudio não encontrado" });
    }

    const audio = results.rows[0];
    res.json({
      cp_audio_id: audio.cp_audio_id,
      cp_nome_audio: audio.cp_nome_audio,
      cp_arquivo_audio: audio.cp_arquivo_audio,
      cp_curso_id: audio.cp_curso_id,
      url_audio: `${req.protocol}://${req.get("host")}/AudiosCurso/${audio.cp_arquivo_audio}`,
    });
  });
});

// Cadastrar áudios de um curso existente
router.post("/register-audio/:cursoId", audioUpload.array("audios"), async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const audios = req.files as Express.Multer.File[];

  if (!audios || audios.length === 0) {
    return res.status(400).json({ error: "Nenhum áudio foi enviado" });
  }

  const invalidFiles = audios.filter((audio) => {
    const isValidMimeType = audio.mimetype.includes("audio") || audio.mimetype.includes("mpeg");
    const isValidExtension = audio.originalname.toLowerCase().endsWith(".mp3");
    return !isValidMimeType && !isValidExtension;
  });

  if (invalidFiles.length > 0) {
    return res.status(400).json({
      error: "Apenas arquivos de áudio .mp3 são permitidos",
      invalidFiles: invalidFiles.map((f) => f.originalname),
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    for (let i = 0; i < audios.length; i++) {
      const audio = audios[i];
      const query = `
        INSERT INTO cp_audio (cp_nome_audio, cp_arquivo_audio, cp_curso_id)
        VALUES ($1, $2, $3)
      `;
      const nomeAudio = audio.originalname.replace(/\.mp3$/i, "");
      const values = [nomeAudio, audio.filename, parseInt(cursoId)];

      await client.query(query, values);
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: `${audios.length} áudio(s) cadastrado(s) com sucesso`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao cadastrar áudios:", error);
    res.status(500).json({ error: "Erro ao cadastrar áudios" });
  } finally {
    client.release();
  }
});

// Adicionar novos áudios a um curso existente
router.put("/update-audio/:cursoId", audioUpload.array("audios"), (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const audios = req.files as Express.Multer.File[];

  if (!audios || audios.length === 0) {
    return res.status(200).json({
      success: true,
      message: "Nenhum áudio novo para adicionar",
    });
  }

  const invalidFiles = audios.filter(
    (audio) =>
      !audio.mimetype.includes("audio") &&
      !audio.originalname.toLowerCase().endsWith(".mp3"),
  );

  if (invalidFiles.length > 0) {
    return res.status(400).json({ error: "Apenas arquivos de áudio .mp3 são permitidos" });
  }

  const queries = audios.map((audio) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO cp_audio (cp_nome_audio, cp_arquivo_audio, cp_curso_id)
        VALUES ($1, $2, $3)
      `;
      const values = [
        audio.originalname.replace(".mp3", ""),
        audio.filename,
        parseInt(cursoId),
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
        message: `${audios.length} áudio(s) adicionado(s) com sucesso`,
      });
    })
    .catch((err) => {
      console.error("Erro ao adicionar áudios:", err);
      res.status(500).json({ error: "Erro ao adicionar áudios" });
    });
});

// Deletar áudio específico
router.delete("/audio/:audioId", authenticateToken, (req: Request, res: Response) => {
  const { audioId } = req.params;

  const query = "DELETE FROM cp_audio WHERE cp_audio_id = $1";

  db.query(query, [audioId], (err, result) => {
    if (err) {
      console.error("Erro ao deletar áudio:", err);
      return res.status(500).json({ error: "Erro ao deletar áudio" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Áudio não encontrado" });
    }

    res.json({ message: "Áudio deletado com sucesso" });
  });
});

// Buscar áudios marcados pelo usuário
router.get("/audios-marcados/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;

  // Por enquanto retorna array vazio pois não temos tabela de visualizações
  res.json([]);
});

// Registrar visualização de áudio
router.post("/registrar-visualizacao", (req: Request, res: Response) => {
  const { userId, audioId } = req.body;

  // Por enquanto apenas retorna sucesso
  res.json({ message: "Visualização registrada com sucesso" });
});

// Servir arquivo de áudio estático
router.get("/audio/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;
  const audioPath = path.join(__dirname, "../../AudiosCurso", filename);

  res.sendFile(audioPath, (err) => {
    if (err) {
      console.error("Erro ao servir áudio:", err);
      res.status(404).json({ error: "Áudio não encontrado" });
    }
  });
});

// Rota para buscar turmas por professor (necessária para o frontend)
router.get("/cp_turmas/professor/:professorId", (req: Request, res: Response) => {
  const { professorId } = req.params;

  const query = "SELECT * FROM cp_turmas WHERE cp_tr_professor_id = $1";

  db.query(query, [professorId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar turmas do professor:", err);
      return res.status(500).json({ error: "Erro ao buscar turmas do professor" });
    }

    res.json(results.rows);
  });
});

// Rota para buscar cursos em lote (batch) - necessária para o frontend
router.get("/cursos/batch", (req: Request, res: Response) => {
  const { cursoIds } = req.body;

  if (!cursoIds || !Array.isArray(cursoIds)) {
    return res.status(400).json({ error: "IDs dos cursos são obrigatórios" });
  }

  const placeholders = cursoIds.map((_, index) => `$${index + 1}`).join(',');
  const query = `SELECT * FROM cp_curso WHERE cp_curso_id IN (${placeholders})`;

  db.query(query, cursoIds, (err, results) => {
    if (err) {
      console.error("Erro ao buscar cursos em lote:", err);
      return res.status(500).json({ error: "Erro ao buscar cursos" });
    }

    res.json(results.rows);
  });
});

// Rota POST para buscar cursos em lote
router.post("/cursos/batch", (req: Request, res: Response) => {
  const { cursoIds } = req.body;

  if (!cursoIds || !Array.isArray(cursoIds)) {
    return res.status(400).json({ error: "IDs dos cursos são obrigatórios" });
  }

  const placeholders = cursoIds.map((_, index) => `$${index + 1}`).join(',');
  const query = `SELECT * FROM cp_curso WHERE cp_curso_id IN (${placeholders})`;

  db.query(query, cursoIds, (err, results) => {
    if (err) {
      console.error("Erro ao buscar cursos em lote:", err);
      return res.status(500).json({ error: "Erro ao buscar cursos" });
    }

    res.json(results.rows);
  });
});

export default router;
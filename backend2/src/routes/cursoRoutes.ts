
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

// Configuração do multer para uploads
const materialCursoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "MaterialCurso");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const materialCursoUpload = multer({ storage: materialCursoStorage });

// Configurar multer para aceitar áudios e PDFs juntos
const cursoCompleto = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "audios") {
        cb(null, path.join(__dirname, "../../../AudiosCurso"));
      } else if (file.fieldname.startsWith("pdf")) {
        cb(null, path.join(__dirname, "../../../MaterialCurso"));
      } else {
        cb(null, path.join(__dirname, "../../../MaterialCurso"));
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = timestamp + ext;
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 105,
    fieldSize: 10 * 1024 * 1024,
    fieldNameSize: 500,
    fields: 50
  }
});

// Buscar todos os cursos
router.get("/cursos", (req: Request, res: Response) => {
  const query = "SELECT cp_curso_id as cp_id_curso, cp_nome_curso, cp_youtube_link_curso, cp_pdf1_curso, cp_pdf2_curso, cp_pdf3_curso FROM cp_curso";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar cursos:", err);
      return res.status(500).json({ error: "Erro ao buscar cursos" });
    }
    res.json(results.rows);
  });
});

// Buscar cursos para migração
router.get("/cursos-migracao", (req: Request, res: Response) => {
  const query = "SELECT cp_curso_id, cp_nome_curso, cp_youtube_link_curso, cp_pdf1_curso, cp_pdf2_curso, cp_pdf3_curso FROM cp_curso ORDER BY cp_nome_curso";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar cursos:", err);
      return res.status(500).json({ error: "Erro ao buscar cursos" });
    }
    res.json(results.rows);
  });
});

// Buscar curso por ID
router.get("/cursos/:cursoId", (req: Request, res: Response) => {
  const { cursoId } = req.params;

  const query = "SELECT * FROM cp_curso WHERE cp_curso_id = $1";

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

// Buscar curso por ID para edição
router.get("/curso/:cursoId", (req: Request, res: Response) => {
  const { cursoId } = req.params;

  const query = "SELECT * FROM cp_curso WHERE cp_curso_id = $1";

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

// Buscar múltiplos cursos
router.post("/cursos/batch", (req: Request, res: Response) => {
  const { cursoIds } = req.body;

  if (!cursoIds || cursoIds.length === 0) {
    return res.json([]);
  }

  const placeholders = cursoIds.map((_: any, index: number) => `$${index + 1}`).join(",");
  const query = `SELECT cp_curso_id as cp_id_curso, cp_nome_curso, cp_youtube_link_curso, cp_pdf1_curso, cp_pdf2_curso, cp_pdf3_curso FROM cp_curso WHERE cp_curso_id IN (${placeholders})`;

  db.query(query, cursoIds, (err, results) => {
    if (err) {
      console.error("Erro ao buscar cursos em lote:", err);
      return res.status(500).json({ error: "Erro ao buscar cursos em lote" });
    }
    res.json(results.rows);
  });
});

// Cadastrar curso com áudios e PDFs
router.post("/cursos", cursoCompleto.fields([
  { name: "pdf1", maxCount: 1 },
  { name: "pdf2", maxCount: 1 },
  { name: "pdf3", maxCount: 1 },
  { name: "audios", maxCount: 100 },
]), async (req: Request, res: Response) => {
  try {
    let cp_nome_curso = req.body.cp_nome_curso;
    let cp_youtube_link_curso = req.body.cp_youtube_link_curso;
    
    if (Array.isArray(cp_nome_curso)) {
      cp_nome_curso = cp_nome_curso[0];
    }
    if (Array.isArray(cp_youtube_link_curso)) {
      cp_youtube_link_curso = cp_youtube_link_curso[0];
    }

    if (!cp_nome_curso || typeof cp_nome_curso !== 'string' || cp_nome_curso.trim() === '') {
      return res.status(400).json({ 
        error: "Nome do curso é obrigatório e deve ser uma string válida"
      });
    }

    const nomeCurso = cp_nome_curso.trim();
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const pdf1 = files?.pdf1?.[0]?.filename || null;
    const pdf2 = files?.pdf2?.[0]?.filename || null;
    const pdf3 = files?.pdf3?.[0]?.filename || null;
    const audios = files?.audios || [];

    const cursoQuery = `
      INSERT INTO cp_curso (cp_nome_curso, cp_youtube_link_curso, cp_pdf1_curso, cp_pdf2_curso, cp_pdf3_curso)
      VALUES ($1, $2, $3, $4, $5) RETURNING cp_curso_id
    `;
    
    const cursoValues = [
      nomeCurso,
      cp_youtube_link_curso || null,
      pdf1,
      pdf2,
      pdf3,
    ];
    
    const cursoResult = await new Promise<any>((resolve, reject) => {
      db.query(cursoQuery, cursoValues, (err, result) => {
        if (err) {
          console.error("Erro ao inserir curso:", err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    const cursoId = cursoResult.rows[0].cp_curso_id;
    let audiosInseridos = 0;
    
    if (audios.length > 0) {
      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        
        const isValidAudio = audio.mimetype.includes("audio") || 
                            audio.mimetype.includes("mpeg") ||
                            audio.originalname.toLowerCase().endsWith(".mp3");
        
        if (!isValidAudio) {
          continue;
        }
        
        const audioQuery = `
          INSERT INTO cp_audio (cp_nome_audio, cp_arquivo_audio, cp_curso_id)
          VALUES ($1, $2, $3)
        `;
        
        const nomeAudio = audio.originalname.replace(/\.mp3$/i, "");
        const audioValues = [nomeAudio, audio.filename, cursoId];
        
        await new Promise<any>((resolve, reject) => {
          db.query(audioQuery, audioValues, (err, result) => {
            if (err) {
              reject(err);
            } else {
              audiosInseridos++;
              resolve(result);
            }
          });
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Curso cadastrado com sucesso",
      data: {
        cursoId: cursoId,
        nomeCurso: nomeCurso,
        audiosCount: audiosInseridos,
        pdfsCount: [pdf1, pdf2, pdf3].filter(Boolean).length
      }
    });
    
  } catch (error) {
    console.error("Erro ao cadastrar curso:", error);
    res.status(500).json({
      error: "Erro interno do servidor ao cadastrar curso"
    });
  }
});

// Cadastro simples de curso
router.post("/cursos", authenticateToken, (req: Request, res: Response) => {
  const { cp_nome_curso, cp_descricao, cp_preco, cp_duracao_meses } = req.body;

  const query = `
    INSERT INTO cp_curso (cp_nome_curso)
    VALUES ($1) RETURNING *
  `;

  const values = [cp_nome_curso];

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

// Atualizar curso
router.put("/cursos/:cursoId", materialCursoUpload.fields([
  { name: "pdf1", maxCount: 1 },
  { name: "pdf2", maxCount: 1 },
  { name: "pdf3", maxCount: 1 },
]), (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const { cp_nome_curso, cp_youtube_link_curso } = req.body;

  if (!cp_nome_curso) {
    return res.status(400).json({ error: "Nome do curso é obrigatório" });
  }

  const getQuery = "SELECT cp_pdf1_curso, cp_pdf2_curso, cp_pdf3_curso FROM cp_curso WHERE cp_curso_id = $1";

  db.query(getQuery, [cursoId], (err, currentResult) => {
    if (err) {
      console.error("Erro ao buscar curso atual:", err);
      return res.status(500).json({ error: "Erro ao buscar curso" });
    }

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    const currentData = currentResult.rows[0];
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const pdf1 = files?.pdf1 ? files.pdf1[0].filename : currentData.cp_pdf1_curso;
    const pdf2 = files?.pdf2 ? files.pdf2[0].filename : currentData.cp_pdf2_curso;
    const pdf3 = files?.pdf3 ? files.pdf3[0].filename : currentData.cp_pdf3_curso;

    const updateQuery = `
      UPDATE cp_curso 
      SET cp_nome_curso = $1, cp_youtube_link_curso = $2, cp_pdf1_curso = $3, cp_pdf2_curso = $4, cp_pdf3_curso = $5
      WHERE cp_curso_id = $6 RETURNING *
    `;

    const values = [
      cp_nome_curso,
      cp_youtube_link_curso || null,
      pdf1,
      pdf2,
      pdf3,
      cursoId,
    ];

    db.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error("Erro ao atualizar curso:", err);
        return res.status(500).json({ error: "Erro ao atualizar curso" });
      }

      res.json({
        success: true,
        message: "Curso atualizado com sucesso",
        curso: result.rows[0],
      });
    });
  });
});

// Atualizar curso (rota duplicada mantida para compatibilidade)
router.put("/update-curso/:cursoId", materialCursoUpload.fields([
  { name: "pdf1", maxCount: 1 },
  { name: "pdf2", maxCount: 1 },
  { name: "pdf3", maxCount: 1 },
]), (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const { cp_nome_curso, cp_youtube_link_curso } = req.body;

  if (!cp_nome_curso) {
    return res.status(400).json({ error: "Nome do curso é obrigatório" });
  }

  const getQuery = "SELECT cp_pdf1_curso, cp_pdf2_curso, cp_pdf3_curso FROM cp_curso WHERE cp_curso_id = $1";

  db.query(getQuery, [cursoId], (err, currentResult) => {
    if (err) {
      console.error("Erro ao buscar curso atual:", err);
      return res.status(500).json({ error: "Erro ao buscar curso" });
    }

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    const currentData = currentResult.rows[0];
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const pdf1 = files?.pdf1 ? files.pdf1[0].filename : currentData.cp_pdf1_curso;
    const pdf2 = files?.pdf2 ? files.pdf2[0].filename : currentData.cp_pdf2_curso;
    const pdf3 = files?.pdf3 ? files.pdf3[0].filename : currentData.cp_pdf3_curso;

    const updateQuery = `
      UPDATE cp_curso 
      SET cp_nome_curso = $1, cp_youtube_link_curso = $2, cp_pdf1_curso = $3, cp_pdf2_curso = $4, cp_pdf3_curso = $5
      WHERE cp_curso_id = $6 RETURNING *
    `;

    const values = [
      cp_nome_curso,
      cp_youtube_link_curso || null,
      pdf1,
      pdf2,
      pdf3,
      cursoId,
    ];

    db.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error("Erro ao atualizar curso:", err);
        return res.status(500).json({ error: "Erro ao atualizar curso" });
      }

      res.json({
        success: true,
        message: "Curso atualizado com sucesso",
        curso: result.rows[0],
      });
    });
  });
});

// Editar curso (TypeScript)
router.put("/cursos/:id", authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const { cp_nome_curso, cp_descricao, cp_preco, cp_duracao_meses } = req.body;

  if (!cp_nome_curso) {
    return res.status(400).json({ error: "Nome do curso é obrigatório" });
  }

  const query = `
    UPDATE cp_curso 
    SET cp_nome_curso = $1
    WHERE cp_curso_id = $2 RETURNING *
  `;

  const values = [cp_nome_curso, id];

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

// Deletar curso
router.delete("/delete-curso/:cursoId", authenticateToken, (req: Request, res: Response) => {
  const { cursoId } = req.params;

  const query = "DELETE FROM cp_curso WHERE cp_curso_id = $1";

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

// Buscar material do curso
router.get("/curso-material/:cursoId", (req: Request, res: Response) => {
  const { cursoId } = req.params;

  const query = "SELECT * FROM cp_materiais WHERE cp_mat_curso_id = $1";

  db.query(query, [cursoId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar material do curso:", err);
      return res.status(500).json({ error: "Erro ao buscar material do curso" });
    }
    res.json(results.rows);
  });
});

export default router;

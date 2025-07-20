
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

// Configuração do multer para upload de materiais
const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "materialdeaula");
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
const materialExtraUpload = multer({ storage: materialExtraStorage });

// Buscar todos os materiais
router.get("/materiais", (req: Request, res: Response) => {
  const query = "SELECT * FROM cp_materiais_extra";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar materiais:", err);
      return res.status(500).json({ error: "Erro ao buscar materiais" });
    }
    res.json(results.rows);
  });
});

// Buscar materiais de uma turma específica
router.get("/materiais/:turmaID", (req: Request, res: Response) => {
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
      return res.status(500).json({ error: "Erro ao buscar materiais da turma" });
    }
    res.json(results.rows);
  });
});

// Buscar material extra
router.get("/material-extra", (req: Request, res: Response) => {
  const query = "SELECT * FROM cp_materiais_extra";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar material extra:", err);
      return res.status(500).json({ error: "Erro ao buscar material extra" });
    }
    res.json(results.rows);
  });
});

// Salvar resumo
router.post("/resumos", materialUpload.single("arquivo"), (req: Request, res: Response) => {
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

// Buscar resumos por data e turma
router.get("/resumos/:data/:turmaId", (req: Request, res: Response) => {
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

// Deletar material extra
router.delete("/material-extra/:id", authenticateToken, (req: Request, res: Response) => {
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

// Rota proxy para download
router.get("/proxy-download", (req: Request, res: Response) => {
  const { url } = req.query as { url: string };

  if (!url) {
    return res.status(400).json({ error: "URL é obrigatória" });
  }

  const filePath = path.join(__dirname, "../../../", url);

  if (!filePath.startsWith(path.join(__dirname, "../../../"))) {
    return res.status(400).json({ error: "Caminho inválido" });
  }

  res.download(filePath, (err) => {
    if (err) {
      console.error("Erro ao fazer download:", err);
      res.status(404).json({ error: "Arquivo não encontrado" });
    }
  });
});

export default router;

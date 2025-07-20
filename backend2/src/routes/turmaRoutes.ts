
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Configuração do banco de dados PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Buscar todas as turmas
router.get("/turmas", authenticateToken, (req: Request, res: Response) => {
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

// Buscar turmas com alunos
router.get("/turmasComAlunos", (req: Request, res: Response) => {
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
      return res.status(500).json({ error: "Erro ao buscar turmas com alunos" });
    }
    res.json(results.rows);
  });
});

// Buscar turma específica por ID
router.get("/turmas/:turmaId", (req: Request, res: Response) => {
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

// Buscar alunos de uma turma específica
router.get("/turmas/:turmaId/alunos", (req: Request, res: Response) => {
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

// Buscar alunos específicos de uma turma (duplicada mas mantida para compatibilidade)
router.get("/turmas/:turmaId/alunos", authenticateToken, (req: Request, res: Response) => {
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

// Cadastro de turma
router.post("/turmas", authenticateToken, async (req: Request, res: Response) => {
  const {
    cp_tr_nome,
    cp_tr_data,
    cp_tr_id_escola,
    cp_tr_id_professor,
    cp_tr_curso_id,
    cp_tr_dias_semana,
    cp_tr_horario_inicio,
    cp_tr_horario_fim,
    cp_tr_alunos,
  } = req.body;

  if (!cp_tr_nome || !cp_tr_id_escola) {
    return res.status(400).json({ error: "Nome da turma e escola são obrigatórios" });
  }

  try {
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

    const resultTurma = await new Promise<any>((resolve, reject) => {
      db.query(queryTurma, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const turmaId = resultTurma.rows[0].cp_tr_id;
    console.log("Turma cadastrada com ID:", turmaId);

    if (Array.isArray(cp_tr_alunos) && cp_tr_alunos.length > 0) {
      console.log("Atualizando alunos com IDs:", cp_tr_alunos);

      const queryUpdateAlunos = `
        UPDATE cp_usuarios 
        SET cp_turma_id = $1, updated_at = NOW() 
        WHERE cp_id = ANY($2) AND cp_tipo_user = 5
      `;

      await new Promise<any>((resolve, reject) => {
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

// Editar turma
router.put("/turmas/:id", authenticateToken, async (req: Request, res: Response) => {
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
    cp_tr_alunos,
  } = req.body;

  if (!cp_tr_nome || !cp_tr_id_escola) {
    return res.status(400).json({ error: "Nome da turma e escola são obrigatórios" });
  }

  try {
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

    const resultTurma = await new Promise<any>((resolve, reject) => {
      db.query(queryTurma, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (resultTurma.rowCount === 0) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    await new Promise<any>((resolve, reject) => {
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

    if (Array.isArray(cp_tr_alunos) && cp_tr_alunos.length > 0) {
      console.log("Atualizando alunos com IDs:", cp_tr_alunos);

      const queryUpdateAlunos = `
        UPDATE cp_usuarios 
        SET cp_turma_id = $1, updated_at = NOW() 
        WHERE cp_id = ANY($2) AND cp_tipo_user = 5
      `;

      await new Promise<any>((resolve, reject) => {
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

// Deletar turma
router.delete("/delete-turma/:turmaId", authenticateToken, (req: Request, res: Response) => {
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

// Buscar curso ID da turma
router.get("/curso-id-da-turma/:turmaId", (req: Request, res: Response) => {
  const { turmaId } = req.params;

  const query = "SELECT cp_tr_curso_id FROM cp_turmas WHERE cp_tr_id = $1";

  db.query(query, [turmaId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar curso ID da turma:", err);
      return res.status(500).json({ error: "Erro ao buscar curso ID da turma" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    res.json(results.rows[0]);
  });
});

// Buscar turmas de um professor
router.get("/cp_turmas/professor/:professorId", (req: Request, res: Response) => {
  const { professorId } = req.params;

  const query = "SELECT * FROM cp_turmas WHERE cp_tr_id_professor = $1";

  db.query(query, [professorId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar turmas do professor:", err);
      return res.status(500).json({ error: "Erro ao buscar turmas do professor" });
    }
    res.json(results.rows);
  });
});

export default router;

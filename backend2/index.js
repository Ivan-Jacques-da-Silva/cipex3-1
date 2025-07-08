
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { prisma, connectDatabase } = require('./lib/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'foto_perfil') {
      uploadPath += 'FotoPerfil/';
    } else if (file.fieldname === 'audio') {
      uploadPath += 'AudiosCurso/';
    } else if (file.fieldname === 'material_curso') {
      uploadPath += 'MaterialCurso/';
    } else if (file.fieldname === 'material_aula') {
      uploadPath += 'materialdeaula/';
    }

    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// ROTAS DE AUTENTICAÇÃO

// Login
app.post('/login', async (req, res) => {
  try {
    const { cp_email_usuario, cp_senha_usuario } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { cp_email_usuario }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(cp_senha_usuario, usuario.cp_senha_usuario);
    
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { 
        cp_usuario_id: usuario.cp_usuario_id,
        cp_email_usuario: usuario.cp_email_usuario,
        cp_tipo_usuario: usuario.cp_tipo_usuario
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: {
        cp_usuario_id: usuario.cp_usuario_id,
        cp_nome_usuario: usuario.cp_nome_usuario,
        cp_email_usuario: usuario.cp_email_usuario,
        cp_tipo_usuario: usuario.cp_tipo_usuario,
        cp_foto_perfil: usuario.cp_foto_perfil
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTAS DE USUÁRIOS

// Listar usuários
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        cp_usuario_id: true,
        cp_nome_usuario: true,
        cp_email_usuario: true,
        cp_telefone_usuario: true,
        cp_data_nascimento: true,
        cp_tipo_usuario: true,
        cp_foto_perfil: true,
        cp_data_criacao: true,
        cp_status_usuario: true,
        cp_sexo: true,
        cp_cpf: true,
        cp_endereco: true,
        cp_cidade: true,
        cp_estado: true,
        cp_cep: true
      },
      orderBy: { cp_nome_usuario: 'asc' }
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar usuário por ID
app.get('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuario.findUnique({
      where: { cp_usuario_id: parseInt(id) },
      select: {
        cp_usuario_id: true,
        cp_nome_usuario: true,
        cp_email_usuario: true,
        cp_telefone_usuario: true,
        cp_data_nascimento: true,
        cp_tipo_usuario: true,
        cp_foto_perfil: true,
        cp_status_usuario: true,
        cp_sexo: true,
        cp_cpf: true,
        cp_endereco: true,
        cp_cidade: true,
        cp_estado: true,
        cp_cep: true,
        cp_nome_pai: true,
        cp_nome_mae: true,
        cp_telefone_emergencia: true,
        cp_observacoes: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar usuário
app.post('/usuarios', upload.single('foto_perfil'), async (req, res) => {
  try {
    const {
      cp_nome_usuario,
      cp_email_usuario,
      cp_senha_usuario,
      cp_telefone_usuario,
      cp_data_nascimento,
      cp_tipo_usuario,
      cp_sexo,
      cp_cpf,
      cp_endereco,
      cp_cidade,
      cp_estado,
      cp_cep,
      cp_nome_pai,
      cp_nome_mae,
      cp_telefone_emergencia,
      cp_observacoes
    } = req.body;

    // Criptografar senha
    const senhaHash = await bcrypt.hash(cp_senha_usuario, 10);

    const dadosUsuario = {
      cp_nome_usuario,
      cp_email_usuario,
      cp_senha_usuario: senhaHash,
      cp_telefone_usuario,
      cp_data_nascimento: cp_data_nascimento ? new Date(cp_data_nascimento) : null,
      cp_tipo_usuario,
      cp_sexo,
      cp_cpf,
      cp_endereco,
      cp_cidade,
      cp_estado,
      cp_cep,
      cp_nome_pai,
      cp_nome_mae,
      cp_telefone_emergencia,
      cp_observacoes
    };

    if (req.file) {
      dadosUsuario.cp_foto_perfil = req.file.path;
    }

    const novoUsuario = await prisma.usuario.create({
      data: dadosUsuario,
      select: {
        cp_usuario_id: true,
        cp_nome_usuario: true,
        cp_email_usuario: true,
        cp_tipo_usuario: true
      }
    });

    res.status(201).json(novoUsuario);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar usuário
app.put('/usuarios/:id', upload.single('foto_perfil'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cp_nome_usuario,
      cp_email_usuario,
      cp_telefone_usuario,
      cp_data_nascimento,
      cp_tipo_usuario,
      cp_sexo,
      cp_cpf,
      cp_endereco,
      cp_cidade,
      cp_estado,
      cp_cep,
      cp_nome_pai,
      cp_nome_mae,
      cp_telefone_emergencia,
      cp_observacoes,
      cp_status_usuario
    } = req.body;

    const dadosAtualizacao = {
      cp_nome_usuario,
      cp_email_usuario,
      cp_telefone_usuario,
      cp_data_nascimento: cp_data_nascimento ? new Date(cp_data_nascimento) : null,
      cp_tipo_usuario,
      cp_sexo,
      cp_cpf,
      cp_endereco,
      cp_cidade,
      cp_estado,
      cp_cep,
      cp_nome_pai,
      cp_nome_mae,
      cp_telefone_emergencia,
      cp_observacoes,
      cp_status_usuario
    };

    if (req.file) {
      dadosAtualizacao.cp_foto_perfil = req.file.path;
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { cp_usuario_id: parseInt(id) },
      data: dadosAtualizacao,
      select: {
        cp_usuario_id: true,
        cp_nome_usuario: true,
        cp_email_usuario: true,
        cp_tipo_usuario: true
      }
    });

    res.json(usuarioAtualizado);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar usuário
app.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.usuario.delete({
      where: { cp_usuario_id: parseInt(id) }
    });

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTAS DE ESCOLAS

// Listar escolas
app.get('/escolas', async (req, res) => {
  try {
    const escolas = await prisma.escola.findMany({
      include: {
        responsavel: {
          select: {
            cp_usuario_id: true,
            cp_nome_usuario: true
          }
        }
      },
      orderBy: { cp_nome_escola: 'asc' }
    });
    res.json(escolas);
  } catch (error) {
    console.error('Erro ao buscar escolas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar escola
app.post('/escolas', async (req, res) => {
  try {
    const {
      cp_nome_escola,
      cp_endereco_escola,
      cp_telefone_escola,
      cp_email_escola,
      cp_cnpj_escola,
      cp_responsavel_id
    } = req.body;

    const novaEscola = await prisma.escola.create({
      data: {
        cp_nome_escola,
        cp_endereco_escola,
        cp_telefone_escola,
        cp_email_escola,
        cp_cnpj_escola,
        cp_responsavel_id: cp_responsavel_id ? parseInt(cp_responsavel_id) : null
      }
    });

    res.status(201).json(novaEscola);
  } catch (error) {
    console.error('Erro ao criar escola:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTAS DE CURSOS

// Listar cursos
app.get('/cursos', async (req, res) => {
  try {
    const cursos = await prisma.curso.findMany({
      include: {
        escola: {
          select: {
            cp_escola_id: true,
            cp_nome_escola: true
          }
        }
      },
      orderBy: { cp_nome_curso: 'asc' }
    });
    res.json(cursos);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar cursos por IDs
app.post('/cursos/batch', async (req, res) => {
  try {
    const { cursoIds } = req.body;
    const cursos = await prisma.curso.findMany({
      where: {
        cp_curso_id: {
          in: cursoIds.map(id => parseInt(id))
        }
      },
      orderBy: { cp_nome_curso: 'asc' }
    });
    res.json(cursos);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar curso por ID
app.get('/cursos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await prisma.curso.findUnique({
      where: { cp_curso_id: parseInt(id) },
      include: {
        escola: true
      }
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    res.json(curso);
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar curso
app.post('/cursos', async (req, res) => {
  try {
    const {
      cp_nome_curso,
      cp_descricao_curso,
      cp_duracao_curso,
      cp_preco_curso,
      cp_escola_id,
      cp_categoria_curso,
      cp_nivel_curso,
      cp_carga_horaria,
      cp_modalidade
    } = req.body;

    const novoCurso = await prisma.curso.create({
      data: {
        cp_nome_curso,
        cp_descricao_curso,
        cp_duracao_curso: cp_duracao_curso ? parseInt(cp_duracao_curso) : null,
        cp_preco_curso: cp_preco_curso ? parseFloat(cp_preco_curso) : null,
        cp_escola_id: cp_escola_id ? parseInt(cp_escola_id) : null,
        cp_categoria_curso,
        cp_nivel_curso,
        cp_carga_horaria: cp_carga_horaria ? parseInt(cp_carga_horaria) : null,
        cp_modalidade
      }
    });

    res.status(201).json(novoCurso);
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTAS DE TURMAS

// Listar turmas
app.get('/turmas', async (req, res) => {
  try {
    const turmas = await prisma.turma.findMany({
      include: {
        curso: {
          select: {
            cp_curso_id: true,
            cp_nome_curso: true
          }
        },
        escola: {
          select: {
            cp_escola_id: true,
            cp_nome_escola: true
          }
        },
        responsavel: {
          select: {
            cp_usuario_id: true,
            cp_nome_usuario: true
          }
        }
      },
      orderBy: { cp_nome_turma: 'asc' }
    });
    res.json(turmas);
  } catch (error) {
    console.error('Erro ao buscar turmas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar turmas por usuário
app.get('/turmas-usuario/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const matriculas = await prisma.matricula.findMany({
      where: { 
        cp_usuario_id: parseInt(userId),
        cp_status_matricula: 'ativa'
      },
      include: {
        turma: {
          include: {
            curso: true
          }
        }
      }
    });

    const turmas = matriculas.map(m => m.turma).filter(t => t !== null);
    res.json(turmas);
  } catch (error) {
    console.error('Erro ao buscar turmas do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar turma
app.post('/turmas', async (req, res) => {
  try {
    const {
      cp_nome_turma,
      cp_descricao_turma,
      cp_data_inicio,
      cp_data_fim,
      cp_horario_inicio,
      cp_horario_fim,
      cp_dias_semana,
      cp_capacidade,
      cp_curso_id,
      cp_escola_id,
      cp_responsavel_id
    } = req.body;

    const novaTurma = await prisma.turma.create({
      data: {
        cp_nome_turma,
        cp_descricao_turma,
        cp_data_inicio: new Date(cp_data_inicio),
        cp_data_fim: new Date(cp_data_fim),
        cp_horario_inicio,
        cp_horario_fim,
        cp_dias_semana,
        cp_capacidade: cp_capacidade ? parseInt(cp_capacidade) : null,
        cp_curso_id: cp_curso_id ? parseInt(cp_curso_id) : null,
        cp_escola_id: cp_escola_id ? parseInt(cp_escola_id) : null,
        cp_responsavel_id: cp_responsavel_id ? parseInt(cp_responsavel_id) : null
      }
    });

    res.status(201).json(novaTurma);
  } catch (error) {
    console.error('Erro ao criar turma:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTAS DE MATRÍCULAS

// Listar matrículas
app.get('/matriculas', async (req, res) => {
  try {
    const matriculas = await prisma.matricula.findMany({
      include: {
        usuario: {
          select: {
            cp_usuario_id: true,
            cp_nome_usuario: true,
            cp_email_usuario: true
          }
        },
        curso: {
          select: {
            cp_curso_id: true,
            cp_nome_curso: true
          }
        },
        turma: {
          select: {
            cp_turma_id: true,
            cp_nome_turma: true
          }
        }
      },
      orderBy: { cp_data_matricula: 'desc' }
    });
    res.json(matriculas);
  } catch (error) {
    console.error('Erro ao buscar matrículas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar matrículas por usuário
app.get('/matriculas-usuario/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const matriculas = await prisma.matricula.findMany({
      where: { cp_usuario_id: parseInt(userId) },
      include: {
        curso: true,
        turma: true
      }
    });
    res.json(matriculas);
  } catch (error) {
    console.error('Erro ao buscar matrículas do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar matrícula
app.post('/matriculas', async (req, res) => {
  try {
    const {
      cp_usuario_id,
      cp_curso_id,
      cp_turma_id,
      cp_valor_matricula,
      cp_forma_pagamento,
      cp_numero_parcelas,
      cp_valor_parcela,
      cp_data_vencimento,
      cp_observacoes
    } = req.body;

    const novaMatricula = await prisma.matricula.create({
      data: {
        cp_usuario_id: parseInt(cp_usuario_id),
        cp_curso_id: parseInt(cp_curso_id),
        cp_turma_id: cp_turma_id ? parseInt(cp_turma_id) : null,
        cp_valor_matricula: cp_valor_matricula ? parseFloat(cp_valor_matricula) : null,
        cp_forma_pagamento,
        cp_numero_parcelas: cp_numero_parcelas ? parseInt(cp_numero_parcelas) : null,
        cp_valor_parcela: cp_valor_parcela ? parseFloat(cp_valor_parcela) : null,
        cp_data_vencimento: cp_data_vencimento ? new Date(cp_data_vencimento) : null,
        cp_observacoes
      }
    });

    res.status(201).json(novaMatricula);
  } catch (error) {
    console.error('Erro ao criar matrícula:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTAS DE CHAMADAS

// Listar chamadas
app.get('/chamadas', async (req, res) => {
  try {
    const chamadas = await prisma.chamada.findMany({
      include: {
        turma: {
          include: {
            curso: true
          }
        }
      },
      orderBy: { cp_data_chamada: 'desc' }
    });
    res.json(chamadas);
  } catch (error) {
    console.error('Erro ao buscar chamadas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar chamadas por turma
app.get('/chamadas-turma/:turmaId', async (req, res) => {
  try {
    const { turmaId } = req.params;
    const chamadas = await prisma.chamada.findMany({
      where: { cp_turma_id: parseInt(turmaId) },
      include: {
        presencas: {
          include: {
            usuario: {
              select: {
                cp_usuario_id: true,
                cp_nome_usuario: true
              }
            }
          }
        }
      },
      orderBy: { cp_data_chamada: 'desc' }
    });
    res.json(chamadas);
  } catch (error) {
    console.error('Erro ao buscar chamadas da turma:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar chamada
app.post('/chamadas', async (req, res) => {
  try {
    const {
      cp_turma_id,
      cp_data_chamada,
      cp_horario_inicio,
      cp_horario_fim,
      cp_conteudo,
      cp_observacoes,
      presencas
    } = req.body;

    const novaChamada = await prisma.chamada.create({
      data: {
        cp_turma_id: parseInt(cp_turma_id),
        cp_data_chamada: new Date(cp_data_chamada),
        cp_horario_inicio,
        cp_horario_fim,
        cp_conteudo,
        cp_observacoes
      }
    });

    // Criar presenças se fornecidas
    if (presencas && presencas.length > 0) {
      const dadosPresencas = presencas.map(p => ({
        cp_chamada_id: novaChamada.cp_chamada_id,
        cp_usuario_id: parseInt(p.cp_usuario_id),
        cp_matricula_id: parseInt(p.cp_matricula_id),
        cp_presente: p.cp_presente === true || p.cp_presente === 'true',
        cp_justificativa: p.cp_justificativa
      }));

      await prisma.presenca.createMany({
        data: dadosPresencas
      });
    }

    res.status(201).json(novaChamada);
  } catch (error) {
    console.error('Erro ao criar chamada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTAS DE RESUMOS

// Listar resumos
app.get('/resumos', async (req, res) => {
  try {
    const resumos = await prisma.resumo.findMany({
      include: {
        chamada: {
          include: {
            turma: {
              include: {
                curso: true
              }
            }
          }
        },
        usuario: {
          select: {
            cp_usuario_id: true,
            cp_nome_usuario: true
          }
        }
      },
      orderBy: { cp_data_criacao: 'desc' }
    });
    res.json(resumos);
  } catch (error) {
    console.error('Erro ao buscar resumos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar resumos por chamada
app.get('/resumos-chamada/:chamadaId', async (req, res) => {
  try {
    const { chamadaId } = req.params;
    const resumos = await prisma.resumo.findMany({
      where: { cp_chamada_id: parseInt(chamadaId) },
      include: {
        usuario: {
          select: {
            cp_usuario_id: true,
            cp_nome_usuario: true
          }
        }
      },
      orderBy: { cp_data_criacao: 'desc' }
    });
    res.json(resumos);
  } catch (error) {
    console.error('Erro ao buscar resumos da chamada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar resumo
app.post('/resumos', async (req, res) => {
  try {
    const {
      cp_chamada_id,
      cp_usuario_id,
      cp_conteudo
    } = req.body;

    const novoResumo = await prisma.resumo.create({
      data: {
        cp_chamada_id: parseInt(cp_chamada_id),
        cp_usuario_id: parseInt(cp_usuario_id),
        cp_conteudo
      }
    });

    res.status(201).json(novoResumo);
  } catch (error) {
    console.error('Erro ao criar resumo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTAS DE ÁUDIOS

// Listar áudios por curso
app.get('/audios-curso/:cursoId', async (req, res) => {
  try {
    const { cursoId } = req.params;
    const audios = await prisma.audioCurso.findMany({
      where: { cp_curso_id: parseInt(cursoId) },
      orderBy: { cp_data_upload: 'desc' }
    });
    res.json(audios);
  } catch (error) {
    console.error('Erro ao buscar áudios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload de áudio
app.post('/audios', upload.single('audio'), async (req, res) => {
  try {
    const {
      cp_curso_id,
      cp_nome_audio,
      cp_duracao
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo de áudio é obrigatório' });
    }

    const novoAudio = await prisma.audioCurso.create({
      data: {
        cp_curso_id: parseInt(cp_curso_id),
        cp_nome_audio: cp_nome_audio || req.file.originalname,
        cp_caminho_audio: req.file.path,
        cp_duracao,
        cp_tamanho: req.file.size
      }
    });

    res.status(201).json(novoAudio);
  } catch (error) {
    console.error('Erro ao fazer upload de áudio:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTAS DE MATERIAIS

// Listar materiais de curso
app.get('/materiais-curso/:cursoId', async (req, res) => {
  try {
    const { cursoId } = req.params;
    const materiais = await prisma.materialCurso.findMany({
      where: { cp_curso_id: parseInt(cursoId) },
      orderBy: { cp_data_upload: 'desc' }
    });
    res.json(materiais);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar materiais de aula
app.get('/materiais-aula', async (req, res) => {
  try {
    const materiais = await prisma.materialAula.findMany({
      orderBy: { cp_data_upload: 'desc' }
    });
    res.json(materiais);
  } catch (error) {
    console.error('Erro ao buscar materiais de aula:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload de material de curso
app.post('/materiais-curso', upload.single('material_curso'), async (req, res) => {
  try {
    const {
      cp_curso_id,
      cp_nome_material,
      cp_tipo_material,
      cp_descricao
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo é obrigatório' });
    }

    const novoMaterial = await prisma.materialCurso.create({
      data: {
        cp_curso_id: parseInt(cp_curso_id),
        cp_nome_material: cp_nome_material || req.file.originalname,
        cp_caminho_material: req.file.path,
        cp_tipo_material: cp_tipo_material || path.extname(req.file.originalname),
        cp_tamanho: req.file.size,
        cp_descricao
      }
    });

    res.status(201).json(novoMaterial);
  } catch (error) {
    console.error('Erro ao fazer upload de material:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload de material de aula
app.post('/materiais-aula', upload.single('material_aula'), async (req, res) => {
  try {
    const {
      cp_nome_material,
      cp_tipo_material,
      cp_descricao
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo é obrigatório' });
    }

    const novoMaterial = await prisma.materialAula.create({
      data: {
        cp_nome_material: cp_nome_material || req.file.originalname,
        cp_caminho_material: req.file.path,
        cp_tipo_material: cp_tipo_material || path.extname(req.file.originalname),
        cp_tamanho: req.file.size,
        cp_descricao
      }
    });

    res.status(201).json(novoMaterial);
  } catch (error) {
    console.error('Erro ao fazer upload de material de aula:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar diretórios necessários
const directories = [
  'uploads/FotoPerfil',
  'uploads/AudiosCurso',
  'uploads/MaterialCurso',
  'uploads/materialdeaula'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Inicializar servidor
async function startServer() {
  try {
    await connectDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 Acesso local: http://localhost:${PORT}`);
      console.log(`🌐 Acesso externo: http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Desconectando do banco de dados...');
  await prisma.$disconnect();
  console.log('✅ Servidor encerrado graciosamente');
  process.exit(0);
});

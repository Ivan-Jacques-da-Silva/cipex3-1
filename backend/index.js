const express = require('express');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const util = require('util');


// Lista de origens permitidas
const allowedOrigins = [
  'https://portal.cipex.com.br',
  'http://portal.cipex.com.br',
  'https://www.portal.cipex.com.br',
  'http://www.portal.cipex.com.br',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://192.168.2.3:3000',
  'portal.cipex.com.br'
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('Origin:', origin);
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('Not allowed by CORS');
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
//app.use(cors()); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request Headers:', req.headers);
  next();
});

// Configuração da conexão com o banco de dados

// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'ivanjacques_portal',
//   password: 'hTWTV00k4OWc',
//   database: 'ivanjacques_cipex' // Nome do banco de   dados
//});

//const db = mysql.createConnection({
// host: 'localhost',
//  user: 'root',
//  password: 'admin',
//  database: 'c1p3x' // Nome do banco de   dados
//});

// Conectar ao banco de dados
// db.connect((err) => {
//   if (err) {
//     console.error('Erro ao conectar ao banco de dados:', err);
//     throw err;
//   }
//   console.log('Conexão ao banco de dados MySQL estabelecida');
// });

// Configuração da conexão com o banco de dados
let db;

function handleDisconnect() {
  db = mysql.createConnection({
    host: 'localhost',
    user: 'ivanjacques_portal',
    password: 'hTWTV00k4OWc',
    database: 'ivanjacques_cipex'
  });

  // Conectar ao banco de dados
  db.connect((err) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
      setTimeout(handleDisconnect, 2000); // Tenta reconectar após 2 segundos
    } else {
      console.log('Conexão ao banco de dados MySQL estabelecida');
    }
  });

  db.on('error', (err) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Conexão com o banco de dados foi perdida:', err);
      handleDisconnect(); // Reconecta automaticamente
    } else {
      throw err; // Se for outro erro, joga a exceção
    }
  });
}

// Inicializa a conexão
handleDisconnect();


// Função de log para gravar erros em um arquivo de log
const logError = (error) => {
  const logFilePath = 'error.log'; // Caminho para o arquivo de log
  const errorMessage = `${new Date().toISOString()} - ${error.stack}\n`; // Formato da mensagem de erro
  fs.appendFile(logFilePath, errorMessage, (err) => {
    if (err) {
      console.error('Erro ao gravar no arquivo de log:', err);
    }
  });
};


// Rota para login
app.post('/login', (req, res) => {
  const login = req.body.login;
  const password = req.body.password;

  // Consulta SQL para verificar o login e obter o tipo de usuário, nome, ID e o endereço da foto do perfil
  db.query('SELECT cp_id, cp_tipo_user, cp_nome, cp_foto_perfil, cp_escola_id, cp_turma_id FROM cp_usuarios WHERE cp_login = ? AND cp_password = ?', [login, password], (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro no servidor' });
    } else if (result.length > 0) {
      res.send({
        msg: 'Usuário Logado com sucesso',
        userId: result[0].cp_id, // Inclui o ID do usuário na resposta
        userType: result[0].cp_tipo_user,
        userName: result[0].cp_nome,
        userProfilePhoto: result[0].cp_foto_perfil,
        schoolId: result[0].cp_escola_id,
        turmaID: result[0].cp_turma_id
      });
    } else {
      res.send({ msg: 'Usuário ou senha incorretos' });
    }
  });
});

app.delete('/delete-user/:userId', (req, res) => {
  const userId = req.params.userId;
  // console.log('UserID Banco:', userId); 
  db.query('UPDATE cp_usuarios SET cp_excluido = 1 WHERE cp_id = ?', userId, (err, result) => {
    if (err) {
      console.error('Erro ao desativar usuário:', err); // Adicione esta linha para registrar o erro no console do servidor
      res.status(500).json({ error: 'Erro ao desativar usuário', details: err.message }); // Retorna detalhes do erro
    } else {
      if (result.affectedRows > 0) {
        res.json({ message: 'Usuário desativado com sucesso' });
      } else {
        res.status(404).json({ error: 'Usuário não encontrado' });
      }
    }
  });
});


app.get('/users', (req, res) => {
  db.query('SELECT cp_id, cp_nome, cp_email, cp_datanascimento, cp_tipo_user, cp_excluido, cp_escola_id FROM cp_usuarios', (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro no servidor' });
    } else {
      res.send(result); // Envia os dados dos usuários como resposta
    }
  });
});


//configuração para salvar foto do perfil
const storageProfilePhoto = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define o caminho base para armazenar as fotos de perfil
    cb(null, 'FotoPerfil');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    // Salva os arquivos com nome único na pasta definida anteriormente
    cb(null, uniqueSuffix);
  }
});

const profilePhotoUpload = multer({ storage: storageProfilePhoto });

// Rota para lidar com o upload da foto de perfil e atualização no banco de dados
app.post('/uploadProfilePhoto', profilePhotoUpload.single('cp_foto_perfil'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhuma foto de perfil enviada' });
  }

  const filePath = `/FotoPerfil/${req.file.filename}`;
  const userId = req.body.userId;

  db.query(
    'UPDATE cp_usuarios SET cp_foto_perfil = ? WHERE cp_id = ?',
    [filePath, userId],
    (err, result) => {
      if (err) {
        console.error('Erro ao atualizar a foto de perfil:', err);
        return res.status(500).json({ error: 'Erro ao atualizar a foto de perfil' });
      }

      res.json({ success: true, filePath });
    }
  );
});

// Rota para o cadastro de usuários com associação à escola
app.post('/register', profilePhotoUpload.single('cp_foto_perfil'), (req, res) => {
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
    cp_escola_id
  } = req.body;

  // if (cp_nome === 'joão123987') {
  //   const error = new Error('Nome de usuário não permitido');
  //   console.error('Erro ao cadastrar usuário:', error);
  //   logError(error);
  //   return res.status(400).send({ msg: 'Nome de usuário não permitido' });
  // }

  const filePath = req.file ? `/FotoPerfil/${req.file.filename}` : `/FotoPerfil/default.png`;

  console.log('Iniciando verificação de usuário existente...');

  db.query('SELECT * FROM cp_usuarios WHERE cp_rg = ? OR cp_cpf = ?', [cp_rg, cp_cpf], (err, result) => {
    if (err) {
      console.error('Erro ao verificar usuário:', err);
      logError(err); // Adiciona log do erro
      return res.status(500).send({ msg: 'Erro no servidor ao verificar usuário' });
    }

    if (result.length > 0) {
      console.log('Usuário já cadastrado:', result);
      return res.send({ exists: true, msg: 'Usuário já cadastrado' });
    }

    console.log('Novo usuário. Inserindo no banco de dados...');

    const newUser = {
      cp_nome,
      cp_email,
      cp_login,
      cp_password,
      cp_tipo_user,
      cp_rg: cp_rg || null,
      cp_cpf,
      cp_datanascimento,
      cp_estadocivil: cp_estadocivil || null,
      cp_cnpj: cp_cnpj || null,
      cp_ie: cp_ie || null,
      cp_whatsapp: cp_whatsapp || null,
      cp_telefone: cp_telefone || null,
      cp_empresaatuacao: cp_empresaatuacao || null,
      cp_profissao: cp_profissao || null,
      cp_end_cidade_estado: cp_end_cidade_estado || null,
      cp_end_rua: cp_end_rua || null,
      cp_end_num: cp_end_num || null,
      cp_end_cep: cp_end_cep || null,
      cp_descricao: cp_descricao || null,
      cp_escola_id: cp_escola_id || null,
      cp_foto_perfil: filePath
    };

    db.query('INSERT INTO cp_usuarios SET ?', newUser, (err, result) => {
      if (err) {
        console.error('Erro ao registrar novo usuário:', err);
        logError(err); // Adiciona log do erro

        if (req.file) {
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Erro ao excluir imagem:', unlinkErr);
              logError(unlinkErr); // Adiciona log do erro
            }
            console.log('Imagem excluída devido a erro no registro do usuário');
          });
        }

        return res.status(500).send({ msg: 'Erro ao registrar novo usuário' });
      }

      console.log('Usuário registrado com sucesso:', result);
      res.send({ exists: false, msg: 'Usuário registrado com sucesso' });
    });
  });
});






// Rota para servir as fotos de perfil
app.use('/FotoPerfil', express.static(path.join(__dirname, 'FotoPerfil')));


// Rota para atualizar um usuário existente

const tipoUsuarioMap = {
  'Gestor': 1,
  'Diretor': 2,
  'Secretária': 3,
  'Professor': 4,
  'Aluno': 5
};

app.get('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  db.query('SELECT * FROM cp_usuarios WHERE cp_id = ?', userId, (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro ao buscar dados do usuário' });
    } else if (result.length > 0) {
      res.send(result[0]); // Envia os dados do usuário como resposta
    } else {
      res.status(404).send({ msg: 'Usuário não encontrado' });
    }
  });
});


app.put('/edit-user/:userId', (req, res) => {
  const userId = req.params.userId;
  const updatedUser = req.body;

  db.query('UPDATE cp_usuarios SET ? WHERE cp_id = ?', [updatedUser, userId], (err, result) => {
    if (err) {
      console.error('Erro ao editar usuário:', err);
      res.status(500).json({ error: 'Erro ao editar usuário' });
      return;
    }
    res.status(200).json({ message: 'Usuário editado com sucesso' });
  });
});


/* ESCOLA */

// Buscar todas as escolas não excluídas
app.get('/escolas', (req, res) => {
  db.query('SELECT * FROM cp_escolas WHERE cp_ec_excluido = 0', (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro no servidor' });
    } else {
      res.send(result); // Envia os dados das escolas não excluídas como resposta
    }
  });
});


// Buscar uma escola específica pelo ID
app.get('/escolas/:escolaId', (req, res) => {
  const escolaId = req.params.escolaId;
  db.query('SELECT * FROM cp_escolas WHERE cp_ec_id = ?', escolaId, (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro no servidor' });
    } else if (result.length === 0) {
      res.status(404).send({ msg: 'Escola não encontrada' });
    } else {
      res.send(result[0]); // Envia os dados da escola como resposta
    }
  });
});


// Excluir uma escola pelo ID
app.delete('/escolas/:escolaId', (req, res) => {
  const escolaId = req.params.escolaId;
  db.query('DELETE FROM cp_escolas WHERE cp_ec_id = ?', escolaId, (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro ao excluir escola' });
    } else {
      res.send({ msg: 'Escola excluída com sucesso' });
    }
  });
});

// Excluir uma escola pelo ID
app.delete('/delete-escola/:escolaId', (req, res) => {
  const escolaId = req.params.escolaId;
  const updateQuery = 'UPDATE cp_escolas SET cp_ec_excluido = 1 WHERE cp_ec_id = ?';

  db.query(updateQuery, escolaId, (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro ao marcar escola como excluída' });
    } else {
      if (result.affectedRows === 0) {
        res.status(404).send({ msg: 'Escola não encontrada' });
      } else {
        res.send({ msg: 'Escola marcada como excluída com sucesso' });
      }
    }
  });
});

app.put('/edit-escola/:escolaId', (req, res) => {
  const escolaId = req.params.escolaId;
  const updatedEscola = req.body;

  db.query('UPDATE cp_escolas SET ? WHERE cp_ec_id = ?', [updatedEscola, escolaId], (err, result) => {
    if (err) {
      console.error('Erro ao editar escola:', err);
      res.status(500).json({ error: 'Erro ao editar escola' });
      return;
    }
    res.status(200).json({ message: 'Escola editada com sucesso' });
  });
});

app.post('/register-escola', (req, res) => {
    console.log("Recebendo requisição de cadastro:", req.body);

    const { 
        cp_ec_nome, 
        cp_ec_responsavel, 
        cp_ec_data_cadastro, 
        cp_ec_endereco_rua, 
        cp_ec_endereco_numero, 
        cp_ec_endereco_cidade, 
        cp_ec_endereco_bairro, 
        cp_ec_endereco_estado, 
        cp_ec_descricao,
        cp_ec_excluido = 0 // Se não enviado, assume 0
    } = req.body;

    const newEscola = {
        cp_ec_nome,
        cp_ec_responsavel,
        cp_ec_data_cadastro,
        cp_ec_endereco_rua,
        cp_ec_endereco_numero,
        cp_ec_endereco_cidade,
        cp_ec_endereco_bairro,
        cp_ec_endereco_estado,
        cp_ec_descricao: cp_ec_descricao || null,
        cp_ec_excluido // Garante que está sempre sendo enviado
    };

    db.query('INSERT INTO cp_escolas SET ?', newEscola, (err, result) => {
        if (err) {
            console.error("Erro ao registrar escola:", err);
            res.status(500).json({ msg: 'Erro ao registrar nova escola', error: err });
        } else {
            res.status(200).json({ msg: 'Escola registrada com sucesso' });
        }
    });
});


app.get('/users-escolas', (req, res) => {
  db.query('SELECT * FROM cp_usuarios WHERE cp_tipo_user = 2', (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro no servidor' });
    } else {
      res.send(result);
    }
  });
});

/* FIM ESCOLA */

/* TURMA */

// Rota para cadastrar uma nova turma
app.post('/register-turma', async (req, res) => {
  const { cp_tr_nome, cp_tr_data, cp_tr_id_professor, cp_tr_id_escola, cp_tr_curso_id, cp_tr_alunos } = req.body;

  try {
    // Inicia uma transação para garantir consistência
    await db.beginTransaction();

    // Insere os dados da turma na tabela cp_turmas
    const newTurma = {
      cp_tr_nome,
      cp_tr_data,
      cp_tr_id_professor,
      cp_tr_id_escola,
      cp_tr_curso_id
    };

    db.query('INSERT INTO cp_turmas SET ?', newTurma, async (err, resultTurma) => {
      if (err) {
        console.error('Erro ao registrar turma:', err);
        res.status(500).json({ msg: 'Erro ao registrar turma' });
        return await db.rollback();
      }

      if (resultTurma.affectedRows === 1 && resultTurma.insertId) {
        const turmaId = resultTurma.insertId;
        console.log("Turma ID:", turmaId);

        // Atualiza cp_turma_id para os alunos selecionados na tabela cp_usuarios
        const updatePromises = cp_tr_alunos.map(async (alunoId) => {
          await db.query('UPDATE cp_usuarios SET cp_turma_id = ? WHERE cp_id = ?', [turmaId, alunoId]);
        });

        await Promise.all(updatePromises);

        await db.commit();

        res.status(200).json({ msg: 'Turma registrada com sucesso', turmaId });
      } else {
        await db.rollback();
        console.error('Erro ao registrar turma: Não foi possível recuperar o ID da turma');
        res.status(500).json({ msg: 'Erro ao registrar turma' });
      }
    });
  } catch (error) {
    await db.rollback();

    console.error('Erro ao registrar turma:', error);
    res.status(500).json({ msg: 'Erro ao registrar turma' });
  }
});




// Rota para associar alunos a uma turma e editar turma
app.put('/update-turma/:turmaId', async (req, res) => {
  const turmaId = req.params.turmaId;
  const { cp_tr_nome, cp_tr_data, cp_tr_id_professor, cp_tr_id_escola, cp_tr_curso_id, cp_tr_alunos } = req.body;

  try {
    // Inicia a transação
    await db.beginTransaction();

    // Atualiza os dados da turma
    const updateTurma = {
      cp_tr_nome,
      cp_tr_data,
      cp_tr_id_professor,
      cp_tr_id_escola,
      cp_tr_curso_id
    };

    db.query('UPDATE cp_turmas SET ? WHERE cp_tr_id = ?', [updateTurma, turmaId], async (err, result) => {
      if (err) {
        console.error('Erro ao atualizar turma:', err);
        res.status(500).json({ msg: 'Erro ao atualizar turma' });
        return await db.rollback();
      }

      if (result.affectedRows > 0) {
        console.log("Turma Atualizada:", turmaId);

        // Remove todos os alunos dessa turma antes de adicionar os novos
        await db.query('UPDATE cp_usuarios SET cp_turma_id = NULL WHERE cp_turma_id = ?', [turmaId]);

        // Atualiza cp_turma_id para os alunos selecionados na tabela cp_usuarios
        if (Array.isArray(cp_tr_alunos) && cp_tr_alunos.length > 0) {
          const updatePromises = cp_tr_alunos.map(async (alunoId) => {
            await db.query('UPDATE cp_usuarios SET cp_turma_id = ? WHERE cp_id = ?', [turmaId, alunoId]);
          });
        
          await Promise.all(updatePromises);
        }

        await db.commit();

        res.status(200).json({ msg: 'Turma atualizada com sucesso', turmaId });
      } else {
        await db.rollback();
        console.error('Erro ao atualizar turma: Nenhuma linha afetada');
        res.status(500).json({ msg: 'Erro ao atualizar turma' });
      }
    });
  } catch (error) {
    await db.rollback();
    console.error('Erro ao atualizar turma:', error);
    res.status(500).json({ msg: 'Erro ao atualizar turma' });
  }
});


// Rota para excluir uma turma pelo ID
app.delete('/delete-turma/:turmaId', (req, res) => {
  const turmaId = req.params.turmaId;

  // 1. Atualiza a tabela cp_usuarios: para todos os registros onde cp_turma_id for igual ao id da turma,
  //    define cp_turma_id como NULL.
  db.query(
    'UPDATE cp_usuarios SET cp_turma_id = NULL WHERE cp_turma_id = ?',
    [turmaId],
    (err, result) => {
      if (err) {
        console.error('Erro ao atualizar cp_usuarios:', err);
        return res.status(500).send({ msg: 'Erro ao atualizar cp_usuarios' });
      }

      // 2. Após atualizar os usuários, exclui a turma da tabela cp_turmas.
      db.query(
        'DELETE FROM cp_turmas WHERE cp_tr_id = ?',
        [turmaId],
        (err, result) => {
          if (err) {
            console.error('Erro ao excluir turma:', err);
            return res.status(500).send({ msg: 'Erro ao excluir turma' });
          }
          console.log('Turma excluída com sucesso e cp_usuarios atualizado');
          res.send({ msg: 'Turma excluída com sucesso' });
        }
      );
    }
  );
});


// Rota para buscar todas as turmas
app.get('/turmas', (req, res) => {
  db.query('SELECT t.*, u.cp_nome AS nomeDoProfessor, e.cp_ec_nome AS nomeDaEscola FROM cp_turmas t JOIN cp_usuarios u ON t.cp_tr_id_professor = u.cp_id JOIN cp_escolas e ON t.cp_tr_id_escola = e.cp_ec_id', (err, result) => {
    if (err) {
      console.error('Erro ao buscar as turmas:', err);
      res.status(500).send({ msg: 'Erro ao buscar as turmas' });
    } else {
      res.send(result);
    }
  });
});

// Rota para buscar uma turma específica pelo ID
app.get('/turmas/:turmaId', (req, res) => {
  const turmaId = req.params.turmaId;

  db.query('SELECT * FROM cp_turmas WHERE cp_tr_id = ?', turmaId, (err, result) => {
    if (err) {
      console.error('Erro ao buscar a turma:', err);
      res.status(500).send({ msg: 'Erro ao buscar a turma' });
    } else if (result.length === 0) {
      res.status(404).send({ msg: 'Turma não encontrada' });
    } else {
      res.send(result[0]);
    }
  });
});


// Rota para buscar apenas os professores
app.get('/users-professores', (req, res) => {
  db.query('SELECT cp_id, cp_nome, cp_email, cp_tipo_user FROM cp_usuarios WHERE cp_tipo_user = 4', (err, result) => {
    if (err) {
      console.error('Erro ao buscar os professores:', err);
      res.status(500).send({ msg: 'Erro no servidor ao buscar os professores' });
    } else {
      res.send(result); // Envia os dados dos professores como resposta
    }
  });
});

app.get('/escola/alunos/:id', (req, res) => {
  const escolaId = req.params.id;

  db.query(
    'SELECT * FROM cp_usuarios WHERE cp_escola_id = ? AND cp_tipo_user = 5 AND cp_excluido != 1',
    [escolaId],
    (err, result) => {
      if (err) {
        console.error('Erro ao buscar alunos associados à escola:', err);
        res.status(500).send({ msg: 'Erro no servidor' });
      } else {
        if (result.length > 0) {
          res.send(result);
        } else {
          res.status(404).send({ msg: 'Nenhum aluno cadastrado nesta escola.' });
        }
      }
    }
  );
});


/* FIM TURMA */

// CADASTRO CURSO //

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, 'AudiosCurso'));
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.originalname); // Mantém o nome original do arquivo
//   }
// });

// const upload = multer({ storage });


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'AudiosCurso')); // Define a pasta onde os áudios serão salvos
  },
  filename: (req, file, cb) => {
      
    cb(null, file.originalname);

    // Código de renomeação comentado:
    /*
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname;
    const fileExtension = originalName.substring(originalName.lastIndexOf('.')); // Pega a extensão do arquivo
    const fileNameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')); // Nome sem extensão
    cb(null, fileNameWithoutExt + '-' + uniqueSuffix + fileExtension); // Nome + sufixo + extensão (criptografado)
    */
  }
});

const upload = multer({ storage });





// Rota para lidar com o upload de arquivos de áudio
app.post('/register-audio/:cursoId', upload.array('audios'), async (req, res) => {
  const cursoId = req.params.cursoId; // Obtém o ID do curso dos parâmetros da rota
  const audios = req.files; // Obtém os arquivos de áudio enviados

  // Verifica se existem arquivos na requisição
  if (!audios || audios.length === 0) {
    return res.status(400).send('Nenhum arquivo de áudio enviado.');
  }

  try {
    const audioPromises = audios.map(async audio => {
      const nomeArquivo = audio.originalname; // Obtém o nome original do arquivo

      const newAudio = {
        cp_curso_id: cursoId,
        cp_nome_audio: nomeArquivo, // Salva o nome do arquivo na tabela
        cp_arquivo_audio: `/AudiosCurso/${nomeArquivo}` // Salva o caminho relativo como "/AudiosCurso/nomeDoArquivo"
      };


      // Retorna uma promessa para cada inserção de áudio no banco de dados
      return new Promise((resolve, reject) => {
        db.query('INSERT INTO cp_audio SET ?', newAudio, (err, result) => {
          if (err) {
            console.error('Erro ao registrar novo áudio:', err);
            reject(err); // Rejeita a promessa em caso de erro
          } else {
            console.log('Áudio registrado com sucesso');
            resolve(result); // Resolve a promessa em caso de sucesso
          }
        });
      });
    });

    // Aguarda o término de todas as consultas ao banco de dados
    await Promise.all(audioPromises);

    // Envia a resposta após a conclusão de todas as inserções no banco de dados
    res.send({ msg: 'Áudio(s) registrado(s) com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar arquivo(s) de áudio:', error);
    res.status(500).send({ msg: 'Erro ao salvar arquivo(s) de áudio' });
  }
});

// Rota para atualizar os áudios de um curso, removendo os existentes e adicionando novos (somente se novos forem enviados)




app.put('/update-curso/:cursoId', upload.array('audios'), async (req, res) => {
  const cursoId = req.params.cursoId;
  const novosAudios = req.files; 
  const { cp_youtube_link_curso } = req.body; 

  try {
    const updatedCurso = { cp_youtube_link_curso };

    // Atualiza as informações do curso no banco de dados
    db.query('UPDATE cp_curso SET ? WHERE cp_curso_id = ?', [updatedCurso, cursoId], async (err, result) => {
      if (err) {
        console.error('Erro ao atualizar o curso:', err);
        return res.status(500).send({ msg: 'Erro ao atualizar o curso' });
      }

      console.log('Curso atualizado com sucesso.');

      // Apagar os áudios antigos e inserir novos áudios
      try {
        const audioRecords = await new Promise((resolve, reject) => {
          db.query('SELECT cp_audio_id, cp_arquivo_audio FROM cp_audio WHERE cp_curso_id = ?', [cursoId], (err, results) => {
            if (err) {
              console.error('Erro ao buscar áudios antigos:', err);
              reject(err);
            } else {
              resolve(results);
            }
          });
        });

        const audioIds = audioRecords.map(audio => audio.cp_audio_id);

        if (audioIds.length > 0) {
          await new Promise((resolve, reject) => {
            db.query('DELETE FROM cp_vizu_aud_usuarios WHERE cp_id_audio IN (?)', [audioIds], (err) => {
              if (err) {
                console.error('Erro ao excluir visualizações de áudios antigos:', err);
                reject(err);
              } else {
                console.log('Visualizações de áudios antigos excluídas com sucesso.');
                resolve();
              }
            });
          });
        }

        const deletePromises = audioRecords.map((audio) => {
          const filePath = path.join(__dirname, audio.cp_arquivo_audio);
          return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Arquivo não encontrado ou erro ao excluir: ${filePath}`, err);
                resolve();
              } else {
                console.log(`Arquivo excluído: ${filePath}`);
                resolve();
              }
            });
          });
        });

        await Promise.all(deletePromises);

        await new Promise((resolve, reject) => {
          db.query('DELETE FROM cp_audio WHERE cp_curso_id = ?', [cursoId], (err) => {
            if (err) {
              console.error('Erro ao excluir áudios antigos do banco de dados:', err);
              reject(err);
            } else {
              console.log('Registros de áudios antigos excluídos do banco de dados.');
              resolve();
            }
          });
        });

        if (novosAudios && novosAudios.length > 0) {
          await inserirNovosAudios(novosAudios, cursoId, res);
        } else {
          res.send({ msg: 'Curso atualizado com sucesso, sem novos áudios.' });
        }

      } catch (error) {
        console.error('Erro ao excluir ou inserir áudios:', error);
        return res.status(500).send({ msg: 'Erro ao excluir ou inserir áudios' });
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar o curso ou áudios:', error);
    res.status(500).send({ msg: 'Erro ao atualizar o curso ou áudios' });
  }
});



const inserirNovosAudios = async (novosAudios, cursoId, res) => {
  try {
    const audioPromises = novosAudios.map(async (audio) => {
      const nomeArquivoOriginal = audio.originalname; 
      const filePath = `AudiosCurso/${nomeArquivoOriginal}`; 

      const newAudio = {
        cp_curso_id: cursoId,
        cp_nome_audio: nomeArquivoOriginal,  
        cp_arquivo_audio: filePath           
      };

      // Inserir o novo áudio no banco de dados
      return new Promise((resolve, reject) => {
        db.query('INSERT INTO cp_audio SET ?', newAudio, (err, result) => {
          if (err) {
            console.error('Erro ao registrar novo áudio:', err);
            reject(err);
          } else {
            console.log('Novo áudio registrado com sucesso:', nomeArquivoOriginal);
            resolve(result);
          }
        });
      });
    });

    await Promise.all(audioPromises);
    res.send({ msg: 'Curso e áudios atualizados com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar novos áudios:', error);
    res.status(500).send({ msg: 'Erro ao registrar novos áudios' });
  }
};


















// Rota para cadastrar um novo curso
app.post('/register-curso', (req, res) => {
  const { cp_nome_curso } = req.body;

  const newCurso = {
    cp_nome_curso
  };

  db.query('INSERT INTO cp_curso SET ?', newCurso, (err, result) => {
    if (err) {
      console.error('Erro ao registrar novo curso:', err);
      res.status(500).send({ msg: 'Erro ao registrar novo curso' });
    } else {
      console.log('Curso registrado com sucesso');
      const cursoId = result.insertId; // Obtém o ID do curso recém-cadastrado
      res.send({ msg: 'Curso registrado com sucesso', cursoId }); // Retorna o ID do curso
    }
  });
});


// Rota para buscar todos os cursos
app.get('/cursos', (req, res) => {
  db.query('SELECT * FROM cp_curso', (err, result) => {
    if (err) {
      console.error('Erro ao buscar os cursos:', err);
      res.status(500).send({ msg: 'Erro ao buscar os cursos' });
    } else {
      res.send(result);
    }
  });
});

// Rota para buscar um curso pelo ID
app.get('/cursos/:cursoId', (req, res) => {
  const cursoId = req.params.cursoId;

  db.query('SELECT * FROM cp_curso WHERE cp_curso_id = ?', cursoId, (err, result) => {
    if (err) {
      console.error('Erro ao buscar o curso:', err);
      res.status(500).send({ msg: 'Erro ao buscar o curso' });
    } else {
      if (result.length > 0) {
        res.send(result[0]); // Retorna o primeiro curso encontrado (deve haver apenas um)
      } else {
        res.status(404).send({ msg: 'Curso não encontrado' });
      }
    }
  });
});

// Configuração do armazenamento para PDFs
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'MaterialCurso')); // Pasta de PDFs
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Nome do arquivo com timestamp
  }
});

const uploadPDF = multer({ storage: pdfStorage }).fields([
  { name: 'pdf1', maxCount: 1 },
  { name: 'pdf2', maxCount: 1 },
  { name: 'pdf3', maxCount: 1 }
]);

// Servindo arquivos estáticos da pasta 'MaterialCurso'
app.use('/MaterialCurso', express.static(path.join(__dirname, 'MaterialCurso')));

// Rota para cadastrar um novo curso com upload de PDFs
app.post('/cursos', uploadPDF, (req, res) => {
  const { cp_nome_curso, cp_youtube_link_curso } = req.body;

  // Verificar se os arquivos foram enviados corretamente
  console.log("Arquivos recebidos:", req.files);
  console.log("Dados recebidos no corpo:", req.body);

  const pdf1 = req.files['pdf1'] ? req.files['pdf1'][0].filename : null;
  const pdf2 = req.files['pdf2'] ? req.files['pdf2'][0].filename : null;
  const pdf3 = req.files['pdf3'] ? req.files['pdf3'][0].filename : null;

  const newCurso = {
    cp_nome_curso,
    cp_youtube_link_curso,
    cp_pdf1_curso: pdf1 ? `/MaterialCurso/${pdf1}` : null,
    cp_pdf2_curso: pdf2 ? `/MaterialCurso/${pdf2}` : null,
    cp_pdf3_curso: pdf3 ? `/MaterialCurso/${pdf3}` : null,

  };

  // Inserir o novo curso no banco de dados
  db.query('INSERT INTO cp_curso SET ?', newCurso, (err, result) => {
    if (err) {
      console.error('Erro ao registrar novo curso:', err);
      res.status(500).send({ msg: 'Erro ao registrar novo curso' });
    } else {
      const cursoId = result.insertId; // Obtém o ID do curso recém-inserido
      console.log('Curso registrado com sucesso, ID:', cursoId);
      res.send({ msg: 'Curso registrado com sucesso', cursoId });
    }
  });
});


// Rota para buscar materiais do curso (YouTube e PDFs) a partir do ID do curso (cursoId)
app.get('/curso-material/:cursoId', (req, res) => {
  const { cursoId } = req.params;

  const query = `
  SELECT
    cp_youtube_link_curso,
    cp_pdf1_curso,
    cp_pdf2_curso,
    cp_pdf3_curso
  FROM cp_curso
  WHERE cp_curso_id = ?
`;


  db.query(query, [cursoId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar materiais do curso:', err);
      return res.status(500).json({ error: 'Erro ao buscar materiais do curso' });
    }

    if (result.length > 0) {
      // Adicione um console.log para depuração
      console.log('Resultados do banco de dados:', result[0]);

      // Construa as URLs dos PDFs somente se os resultados não forem nulos ou indefinidos
      const responseData = {
        cp_youtube_link_curso: result[0].cp_youtube_link_curso,
        cp_pdf1_curso: result[0].cp_pdf1_curso ? `https://testes.cursoviolaocristao.com.br${result[0].cp_pdf1_curso}` : null,
        cp_pdf2_curso: result[0].cp_pdf2_curso ? `https://testes.cursoviolaocristao.com.br${result[0].cp_pdf2_curso}` : null,
        cp_pdf3_curso: result[0].cp_pdf3_curso ? `https://testes.cursoviolaocristao.com.br${result[0].cp_pdf3_curso}` : null,
      };


      res.status(200).json(responseData); // Retorna os dados formatados com URLs completas
    } else {
      res.status(404).json({ error: 'Materiais não encontrados para este curso' });
    }
  });
});


app.get('/curso-id-da-turma/:turmaId', (req, res) => {
  const turmaId = req.params.turmaId;

  db.query('SELECT cp_tr_curso_id FROM cp_turmas WHERE cp_tr_id = ?', [turmaId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar curso:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    } else if (results.length === 0) {
      res.status(404).json({ error: 'Turma não encontrada.' });
    } else {
      res.json(results[0]);
    }
  });
});

// Rota para buscar todos os áudios associados a um curso específico
app.get('/audios-curso/:cursoId', (req, res) => {
  const cursoId = req.params.cursoId;

  db.query('SELECT * FROM cp_audio WHERE cp_curso_id = ?', cursoId, (err, result) => {
    if (err) {
      console.error('Erro ao buscar os áudios do curso:', err);
      res.status(500).send({ msg: 'Erro ao buscar os áudios do curso' });
    } else {
      res.send(result);
    }
  });
});

app.delete('/delete-curso/:cursoId', async (req, res) => {
  const cursoId = req.params.cursoId;

  try {
    // Exclui os áudios associados ao curso
    await db.query('DELETE FROM cp_audio WHERE cp_curso_id = ?', cursoId);

    // Em seguida, exclui o curso
    await db.query('DELETE FROM cp_curso WHERE cp_curso_id = ?', cursoId);

    res.send({ msg: 'Curso e áudios associados excluídos com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir curso e áudios associados:', error);
    res.status(500).send({ msg: 'Erro ao excluir curso e áudios associados' });
  }
});


// Servir os arquivos estáticos da pasta AudiosCurso
app.use('/audios', express.static(path.join(__dirname, 'AudiosCurso')));

// Rota para cadastrar perguntas associadas a um curso
app.post('/cursos/:cursoId/perguntas', async (req, res) => {
  const cursoId = req.params.cursoId;
  const { perguntas } = req.body;

  try {
    await db.beginTransaction(); // Inicia uma nova transação

    for (const p of perguntas) {
      const [result] = await db.query(
        'INSERT INTO cp_pergunta (cp_curso_id, tipo, texto) VALUES (?, ?, ?)',
        [cursoId, p.tipoPergunta, p.pergunta]
      );
      const perguntaId = result.insertId;

      if (p.tipoPergunta === 'marcar') {
        for (const opcao of p.opcoes) {
          await db.query(
            'INSERT INTO cp_opcao (cp_pergunta_id, texto) VALUES (?, ?)',
            [perguntaId, opcao]
          );
        }
      }
    }

    await db.commit(); // Confirma a transação
    res.status(201).send({ success: true, message: 'Perguntas cadastradas com sucesso' });
  } catch (error) {
    await db.rollback(); // Reverte a transação em caso de erro
    console.error('Erro ao cadastrar perguntas:', error);
    res.status(500).send({ success: false, message: 'Erro ao cadastrar perguntas' });
  }
});

app.get('/cp_turmas/professor/:professorId', (req, res) => {
  const professorId = req.params.professorId;

  db.query('SELECT * FROM cp_turmas WHERE cp_tr_id_professor = ?', professorId, (err, result) => {
    if (err) {
      console.error('Erro ao buscar turmas:', err);
      res.status(500).send({ msg: 'Erro ao buscar turmas' });
    } else {
      res.send(result);
    }
  });
});

app.post('/cursos/batch', (req, res) => {
  const cursoIds = req.body.cursoIds; // Assume que o body contém um array de IDs

  const placeholders = cursoIds.map(() => '?').join(',');
  const query = `SELECT * FROM cp_curso WHERE cp_curso_id IN (${placeholders})`;

  db.query(query, cursoIds, (err, result) => {
    if (err) {
      console.error('Erro ao buscar cursos:', err);
      res.status(500).send({ msg: 'Erro ao buscar cursos' });
    } else {
      res.send(result);
    }
  });
});



/* Fim curso */

// Rota para buscar os alunos de uma turma específica
app.get('/turmas/:turmaId/alunos', (req, res) => {
  const turmaId = req.params.turmaId;

  db.query('SELECT * FROM cp_usuarios WHERE cp_turma_id = ? AND cp_excluido = 0', turmaId, (err, result) => {
    if (err) {
      console.error('Erro ao buscar os alunos:', err);
      res.status(500).send({ msg: 'Erro ao buscar os alunos' });
    } else if (result.length === 0) {
      res.status(404).send({ msg: 'Nenhum aluno encontrado para esta turma.' });
    } else {
      res.send(result);
    }
  });
});

// Rota para salvar uma chamada
app.post('/chamadas', (req, res) => {
  const { turmaId, alunoId, data, hora, status } = req.body;

  // Log dos dados recebidos
  console.log('Dados recebidos:', req.body);

  // Consulta SQL simplificada
  const query = `
    INSERT INTO cp_chamadas (cp_ch_turma_id, cp_ch_aluno_id, cp_ch_data, cp_ch_hora, cp_ch_status)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [turmaId, alunoId, data, hora, status];

  // Log da consulta e dos valores
  console.log('Query:', query);
  console.log('Values:', values);

  // Execução da consulta
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Erro ao salvar chamada:', err);
      res.status(500).send({ msg: 'Erro ao salvar chamada' });
    } else {
      console.log('Resultado da inserção:', result);
      res.send({
        msg: 'Chamada salva com sucesso',
        dadosSalvos: { turmaId, alunoId, data, hora, status }
      });
    }
  });
});


// Rota para buscar histórico de chamadas de uma turma
app.get('/chamadas/turma/:turmaId', (req, res) => {
  const turmaId = req.params.turmaId;

  const query = `
    SELECT c.cp_ch_id, c.cp_ch_data, c.cp_ch_hora, u.cp_nome AS cp_nome_aluno, c.cp_ch_status
    FROM cp_chamadas c
    JOIN cp_usuarios u ON c.cp_ch_aluno_id = u.cp_id
    WHERE c.cp_ch_turma_id = ?
    ORDER BY c.cp_ch_data DESC, c.cp_ch_hora DESC
  `;

  db.query(query, [turmaId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar histórico de chamadas:', err);
      res.status(500).send({ msg: 'Erro ao buscar histórico de chamadas' });
    } else {
      res.send(result);
    }
  });
});



// Rota para buscar todas as turmas com alunos
app.get('/turmasComAlunos', (req, res) => {
  const query = `
    SELECT DISTINCT t.*, u.cp_nome AS nomeDoProfessor, e.cp_ec_nome AS nomeDaEscola
    FROM cp_turmas t
    JOIN cp_usuarios u ON t.cp_tr_id_professor = u.cp_id
    JOIN cp_escolas e ON t.cp_tr_id_escola = e.cp_ec_id
    JOIN cp_usuarios alunos ON alunos.cp_turma_id = t.cp_tr_id
    WHERE alunos.cp_excluido = 0
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Erro ao buscar as turmas:', err);
      res.status(500).send({ msg: 'Erro ao buscar as turmas' });
    } else {
      res.send(result);
    }
  });
});

// Atualizar chamada específica
app.put('/chamadas/:id', (req, res) => {
  const chamadaId = req.params.id;
  const { data, hora, status } = req.body;

  if (!status || typeof status !== 'string') {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  const updatedChamada = {
    cp_ch_data: data,
    cp_ch_hora: hora,
    cp_ch_status: status
  };

  db.query('UPDATE cp_chamadas SET ? WHERE cp_ch_id = ?', [updatedChamada, chamadaId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar chamada:', err);
      res.status(500).json({ error: 'Erro ao atualizar chamada.' });
      return;
    }

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Chamada não encontrada.' });
      return;
    }

    res.status(200).json({ message: 'Chamada atualizada com sucesso.' });
  });
});



// Deletar chamada específica
app.delete('/chamadas/:id', async (req, res) => {
  const chamadaId = req.params.id;

  const query = 'DELETE FROM cp_chamadas WHERE cp_ch_id = ?';

  db.query(query, [chamadaId], (err, result) => {
    if (err) {
      console.error('Erro ao deletar chamada:', err);
      res.status(500).json({ error: 'Erro ao deletar chamada.' });
    } else {
      res.json({ message: 'Chamada deletada com sucesso.' });
    }
  });
});


const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'materialdeaula'); // Diretório onde os arquivos serão armazenados
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const materialUpload = multer({ storage: materialStorage });

// Adicione essa linha para servir arquivos estáticos da pasta 'materialdeaula'
app.use('/materialdeaula', express.static(path.join(__dirname, 'materialdeaula')));

// Rota para salvar resumo de aula com upload de material
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
      console.error("Erro ao inserir resumo no banco de dados:", err);
      return res.status(500).json({ error: 'Erro ao salvar resumo' });
    }

    res.status(201).json({ message: 'Resumo salvo com sucesso' });
  });
});


//Rota para buscar resumos com base na data e na turma
app.get('/resumos/:data/:turmaId', (req, res) => {
  const { data, turmaId } = req.params;

  const query = `
    SELECT cp_res_id, cp_res_turma_id, cp_res_data, cp_res_hora, cp_res_resumo, cp_res_arquivo, cp_res_aula, cp_res_link, cp_res_link_youtube
    FROM cp_resumos
    WHERE cp_res_data = ? AND cp_res_turma_id = ?
  `;
  const values = [data, turmaId];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("Erro ao buscar resumos no banco de dados:", err);
      return res.status(500).json({ error: 'Erro ao buscar resumos' });
    }

    const resumos = results.map(resumo => ({
      ...resumo,
      cp_res_arquivo: resumo.cp_res_arquivo ? `https://testes.cursoviolaocristao.com.br/materialdeaula/${resumo.cp_res_arquivo}` : null
    }));

    res.status(200).json(resumos);
  });
});


app.get('/resumos/:turmaId', (req, res) => {
  const { turmaId } = req.params;

  const query = `
    SELECT cp_res_id, cp_res_turma_id, cp_res_data, cp_res_hora, cp_res_resumo, cp_res_arquivo, cp_res_aula, cp_res_link, cp_res_link_youtube
    FROM cp_resumos
    WHERE cp_res_turma_id = ?
    ORDER BY cp_res_data DESC
  `;
  const values = [turmaId];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("Erro ao buscar resumos no banco de dados:", err);
      return res.status(500).json({ error: 'Erro ao buscar resumos' });
    }

    const resumos = results.map(resumo => ({
      ...resumo,
      cp_res_arquivo: resumo.cp_res_arquivo ? `https://testes.cursoviolaocristao.com.br/materialdeaula/${resumo.cp_res_arquivo}` : null
    }));

    res.status(200).json(resumos);
  });
});


/* edição e exclusão dos remusos */

// app.put('/resumos/:id', materialUpload.single('arquivo'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { resumo, aula, link, linkYoutube } = req.body;
//     const arquivo = req.file ? req.file.filename : null;

//     // Construir a consulta dinamicamente
//     let query = `
//       UPDATE cp_resumos 
//       SET cp_res_resumo = ?, cp_res_aula = ?, cp_res_link = ?, cp_res_link_youtube = ?
//     `;
//     const values = [resumo, aula, link, linkYoutube];

//     // Se houver um novo arquivo, adicionar à consulta
//     if (arquivo) {
//       query += `, cp_res_arquivo = ?`;
//       values.push(arquivo);
//     }

//     query += ` WHERE cp_res_id = ?`;
//     values.push(id);

//     // Usando uma função `promisified` para lidar com a query
//     await db.query(query, values);

//     res.status(200).json({ message: 'Resumo editado com sucesso' });
//   } catch (err) {
//     console.error("Erro ao editar resumo no banco de dados:", err);
//     res.status(500).json({ error: 'Erro ao editar resumo' });
//   }
// });

app.put('/resumos/:id', materialUpload.single('arquivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { resumo, aula, link, linkYoutube } = req.body;
    const arquivo = req.file ? req.file.filename : null;

    let query = `
      UPDATE cp_resumos 
      SET cp_res_resumo = ?, cp_res_aula = ?, cp_res_link = ?, cp_res_link_youtube = ?
    `;
    const values = [resumo, aula, link, linkYoutube];

    if (arquivo) {
      query += `, cp_res_arquivo = ?`;
      values.push(arquivo);
    }

    query += ` WHERE cp_res_id = ?`;
    values.push(id);

    await db.query(query, values);

    res.status(200).json({ message: 'Resumo editado com sucesso' });
  } catch (err) {
    console.error("Erro ao editar resumo no banco de dados:", err);
    res.status(500).json({ error: 'Erro ao editar resumo' });
  }
});


app.delete('/resumos/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    DELETE FROM cp_resumos WHERE cp_res_id = ?
  `;
  const values = [id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao excluir resumo no banco de dados:", err);
      return res.status(500).json({ error: 'Erro ao excluir resumo' });
    }

    res.status(200).json({ message: 'Resumo excluído com sucesso' });
  });
});



// rotas material

const URL_MATERIAL_AULA = 'https://testes.cursoviolaocristao.com.br/materialdeaula/'

app.get('/materiais/:turmaID', async (req, res) => {
  const turmaID = req.params.turmaID;

  try {
    console.log(`Buscando materiais para a turmaID: ${turmaID}`);

    // Consulta SQL para selecionar resumos com o turmaID especificado, incluindo os links
    db.query(
      'SELECT cp_res_id, cp_res_turma_id, cp_res_data, cp_res_hora, cp_res_resumo, cp_res_arquivo, cp_res_aula, cp_res_link, cp_res_link_youtube FROM cp_resumos WHERE cp_res_turma_id = ?',
      [turmaID],
      (error, results) => {
        if (error) {
          console.error('Erro ao buscar resumos:', error);
          logError(error);
          return res.status(500).send('Erro ao buscar resumos');
        }

        console.log(`Materiais encontrados: ${JSON.stringify(results)}`);

        res.json(results);
      }
    );
  } catch (error) {
    console.error('Erro ao buscar resumos:', error);
    logError(error);
    res.status(500).send('Erro ao buscar resumos');
  }
});


// Rota para obter os dados dos usuários
app.get('/certificado/matricula', (req, res) => {
  const query = 'SELECT cp_mt_id AS id, cp_mt_nome_usuario AS nome, cp_mt_curso AS curso, cp_mt_valor_curso AS cargaHoraria FROM cp_matriculas WHERE cp_mt_excluido = 0';

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});



// Rota materiais treinamento

// Configurações do multer para rota de treinamento
const treinamentoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'treinamento/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadTreinamento = multer({ storage: treinamentoStorage });

app.get('/materiais', (req, res) => {
  const query = 'SELECT * FROM cp_mat_materiais';

  db.query(query, (err, result) => {
    if (err) {
      console.error('Erro ao buscar materiais:', err);
      res.status(500).json({ error: 'Erro ao buscar materiais' });
    } else {
      const materiais = result.map(material => ({
        ...material,
        cp_mat_miniatura: material.cp_mat_miniatura ? `https://testes.cursoviolaocristao.com.br/${material.cp_mat_miniatura}` : null,
        cp_mat_arquivoPdf: material.cp_mat_arquivoPdf ? `https://testes.cursoviolaocristao.com.br/${material.cp_mat_arquivoPdf}` : null,
        cp_mat_extra_pdf2: material.cp_mat_extra_pdf2 ? `https://testes.cursoviolaocristao.com.br/${material.cp_mat_extra_pdf2}` : null,
        cp_mat_extra_pdf3: material.cp_mat_extra_pdf3 ? `https://testes.cursoviolaocristao.com.br/${material.cp_mat_extra_pdf3}` : null,
        cp_mat_permitirDownload: material.cp_mat_permitirDownload, // Adicionando o campo
      }));
      console.log('Materiais retornados do banco de dados:', materiais);
      res.json(materiais);
    }
  });
});

app.post('/materiais', uploadTreinamento.fields([
  { name: 'miniatura', maxCount: 1 },
  { name: 'arquivoPdf1', maxCount: 1 },
  { name: 'arquivoPdf2', maxCount: 1 },
  { name: 'arquivoPdf3', maxCount: 1 }
]), async (req, res) => {
  const {
    titulo,
    descricao,
    data,
    linkYoutube,
    categorias,
    permitirDownload
  } = req.body;

  const miniatura = req.files['miniatura'] ? req.files['miniatura'][0].path : null;
  const arquivoPdf1 = req.files['arquivoPdf1'] ? req.files['arquivoPdf1'][0].path : null;
  const arquivoPdf2 = req.files['arquivoPdf2'] ? req.files['arquivoPdf2'][0].path : null;
  const arquivoPdf3 = req.files['arquivoPdf3'] ? req.files['arquivoPdf3'][0].path : null;

  try {
    await db.query(
      'INSERT INTO cp_mat_materiais (cp_mat_titulo, cp_mat_descricao, cp_mat_extra_date, cp_mat_extra_categories, cp_mat_linkYoutube, cp_mat_miniatura, cp_mat_arquivoPdf, cp_mat_extra_pdf2, cp_mat_extra_pdf3, cp_mat_permitirDownload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [titulo, descricao, data, categorias, linkYoutube, miniatura, arquivoPdf1, arquivoPdf2, arquivoPdf3, permitirDownload || 0] // Incluir permitirDownload
    );
    res.status(201).json({ message: 'Material cadastrado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/materiais/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM cp_mat_materiais WHERE cp_mat_id = ?', [id]);
    res.status(200).json({ message: 'Material excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// rota de edição matreiais treinamento

app.put(
  '/materiais/:id',
  uploadTreinamento.fields([
    { name: 'miniatura', maxCount: 1 },
    { name: 'arquivoPdf1', maxCount: 1 },
    { name: 'arquivoPdf2', maxCount: 1 },
    { name: 'arquivoPdf3', maxCount: 1 },
  ]),
  async (req, res) => {
    const { id } = req.params;
    const {
      titulo,
      descricao,
      data,
      linkYoutube,
      categorias,
      permitirDownload,
    } = req.body;

    const miniatura = req.files['miniatura']
      ? `treinamento/${req.files['miniatura'][0].filename}`
      : null;
    const arquivoPdf1 = req.files['arquivoPdf1']
      ? `treinamento/${req.files['arquivoPdf1'][0].filename}`
      : null;
    const arquivoPdf2 = req.files['arquivoPdf2']
      ? `treinamento/${req.files['arquivoPdf2'][0].filename}`
      : null;
    const arquivoPdf3 = req.files['arquivoPdf3']
      ? `treinamento/${req.files['arquivoPdf3'][0].filename}`
      : null;

    try {
      const query = `
         UPDATE cp_mat_materiais
  SET 
    cp_mat_titulo = ?,
    cp_mat_descricao = ?,
    cp_mat_extra_date = ?,
    cp_mat_extra_categories = ?,
    cp_mat_linkYoutube = ?,
    cp_mat_miniatura = COALESCE(?, cp_mat_miniatura),
    cp_mat_arquivoPdf = COALESCE(?, cp_mat_arquivoPdf),
    cp_mat_extra_pdf2 = COALESCE(?, cp_mat_extra_pdf2),
    cp_mat_extra_pdf3 = COALESCE(?, cp_mat_extra_pdf3),
    cp_mat_permitirDownload = ?
  WHERE cp_mat_id = ?`;

      await db.query(query, [
  titulo,
  descricao,
  data,
  categorias,
  linkYoutube,
  miniatura,
  arquivoPdf1,
  arquivoPdf2,
  arquivoPdf3,
  permitirDownload || 0,
  id,
]);

      res.status(200).json({ message: 'Material atualizado com sucesso' });
    } catch (err) {
      console.error('Erro ao atualizar material:', err);
      res.status(500).json({ error: 'Erro ao atualizar material' });
    }
  }
);



// Servindo arquivos estáticos na pasta 'treinamento'
app.use('/treinamento', express.static(path.join(__dirname, 'treinamento')));

// Rota para baixar arquivos através de um proxy
app.get('/proxy-download', async (req, res) => {
  const filePath = req.query.url; // Caminho do arquivo passado como query param (apenas o caminho dentro da pasta 'treinamento')
  const fullPath = path.join(__dirname, filePath); // Caminho completo no servidor

  try {
    // Verifica se o arquivo existe
    if (fs.existsSync(fullPath)) {
      // Define o cabeçalho para forçar o download
      res.setHeader('Content-Disposition', `attachment; filename=${path.basename(fullPath)}`);
      // Envia o arquivo como resposta
      res.download(fullPath);
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao baixar o arquivo:', error);
    res.status(500).json({ error: 'Erro ao baixar o arquivo' });
  }
});





// INICIO REGISTRAR VIZUALIZAÇÃO //

// Rota para registrar ou atualizar a visualização de um áudio por um usuário
app.post('/registrar-visualizacao', (req, res) => {
  const { userId, audioId } = req.body;

  // Verifica se os dados necessários foram fornecidos
  if (!userId || !audioId) {
    res.status(400).json({ error: 'É necessário fornecer userId e audioId' });
    return;
  }

  // Verifica se já existe um registro para userId e audioId
  db.query('SELECT * FROM cp_vizu_aud_usuarios WHERE cp_id_usuario = ? AND cp_id_audio = ?', [userId, audioId], (err, results) => {
    if (err) {
      console.error('Erro ao verificar registro existente:', err);
      res.status(500).json({ error: 'Erro ao verificar registro existente' });
      return;
    }

    if (results.length > 0) {
      // Já existe um registro, então atualiza o existente
      db.query('UPDATE cp_vizu_aud_usuarios SET data_visualizacao = CURRENT_TIMESTAMP WHERE cp_id_usuario = ? AND cp_id_audio = ?', [userId, audioId], (err, result) => {
        if (err) {
          console.error('Erro ao atualizar visualização de áudio:', err);
          res.status(500).json({ error: 'Erro ao atualizar visualização de áudio' });
          return;
        }
        res.status(200).json({ message: 'Visualização de áudio atualizada com sucesso' });
      });
    } else {
      // Não existe um registro, então insere um novo
      db.query('INSERT INTO cp_vizu_aud_usuarios (cp_id_usuario, cp_id_audio) VALUES (?, ?)', [userId, audioId], (err, result) => {
        if (err) {
          console.error('Erro ao registrar visualização de áudio:', err);
          res.status(500).json({ error: 'Erro ao registrar visualização de áudio' });
          return;
        }
        res.status(200).json({ message: 'Visualização de áudio registrada com sucesso' });
      });
    }
  });
});

// Rota para buscar os áudios marcados como ouvidos pelo usuário
app.get('/audios-marcados/:userId', (req, res) => {
  const userId = req.params.userId;

  // Consulta SQL para buscar os cp_audio_id marcados como ouvidos pelo usuário
  db.query('SELECT cp_id_audio FROM cp_vizu_aud_usuarios WHERE cp_id_usuario = ?', [userId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar áudios marcados como ouvidos:', err);
      res.status(500).json({ error: 'Erro ao buscar áudios marcados como ouvidos' });
      return;
    }

    // Extrai os cp_audio_id dos resultados
    const audiosMarcados = results.map(row => row.cp_id_audio);
    res.status(200).json(audiosMarcados);
  });
});


// FIM CADASTRO CURSO // 

// MATERIAL EXTRA //

// Configuração do multer para upload de arquivos
const materialExtraStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'materialExtra/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadMaterialExtra = multer({ storage: materialExtraStorage });

// Rota para buscar todas as turmas com alunos
app.get('/material-extra', (req, res) => {
  const query = 'SELECT * FROM cp_mat_extra';

  db.query(query, (err, result) => {
    if (err) {
      console.error('Erro ao buscar materiais:', err);
      res.status(500).json({ error: 'Erro ao buscar materiais' });
    } else {
      const materiais = result.map(material => ({
        ...material,
        cp_mat_extra_thumbnail: material.cp_mat_extra_thumbnail ? `https://testes.cursoviolaocristao.com.br/${material.cp_mat_extra_thumbnail}` : null,
        cp_mat_extra_pdf1: material.cp_mat_extra_pdf1 ? `https://testes.cursoviolaocristao.com.br/${material.cp_mat_extra_pdf1}` : null,
        cp_mat_extra_pdf2: material.cp_mat_extra_pdf2 ? `https://testes.cursoviolaocristao.com.br/${material.cp_mat_extra_pdf2}` : null,
        cp_mat_extra_pdf3: material.cp_mat_extra_pdf3 ? `https://testes.cursoviolaocristao.com.br/${material.cp_mat_extra_pdf3}` : null,
        cp_mat_extra_permitirDownload: material.cp_mat_extra_permitirDownload
      }));

      res.json(materiais);
    }
  });
});


app.post('/material-extra', uploadMaterialExtra.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'pdf1', maxCount: 1 },
  { name: 'pdf2', maxCount: 1 },
  { name: 'pdf3', maxCount: 1 }
]), async (req, res) => {
  console.log("Arquivos recebidos:", req.files); // Adicione este log
  console.log("Dados recebidos:", req.body); // Adicione este log

  const {
    title,
    description,
    date,
    youtube_url,
    categories,
    permitirDownload
  } = req.body;

  const thumbnail = req.files['thumbnail'] ? req.files['thumbnail'][0].path : null;
  const pdf1 = req.files['pdf1'] ? req.files['pdf1'][0].path : null;
  const pdf2 = req.files['pdf2'] ? req.files['pdf2'][0].path : null;
  const pdf3 = req.files['pdf3'] ? req.files['pdf3'][0].path : null;

  try {
    await db.query(
      'INSERT INTO cp_mat_extra (cp_mat_extra_thumbnail, cp_mat_extra_title, cp_mat_extra_description, cp_mat_extra_date, cp_mat_extra_youtube_url, cp_mat_extra_pdf1, cp_mat_extra_pdf2, cp_mat_extra_pdf3, cp_mat_extra_categories, cp_mat_extra_permitirDownload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [thumbnail, title, description, date, youtube_url, pdf1, pdf2, pdf3, categories, permitirDownload || 0]
    );
    res.status(201).json({ message: 'Material cadastrado com sucesso' });
  } catch (err) {
    console.error('Erro ao cadastrar material:', err);
    res.status(500).json({ error: 'Erro ao cadastrar material' });
  }
});


app.put(
  '/material-extra/:id',
  uploadMaterialExtra.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'pdf1', maxCount: 1 },
    { name: 'pdf2', maxCount: 1 },
    { name: 'pdf3', maxCount: 1 },
  ]),
  async (req, res) => {
    const { id } = req.params; // ID do material a ser atualizado
    console.log("Arquivos recebidos:", req.files); // Adicione este log para debug
    console.log("Dados recebidos:", req.body); // Adicione este log para debug

    const {
      title,
      description,
      date,
      youtube_url,
      categories,
      permitirDownload,
    } = req.body;

    const thumbnail = req.files['thumbnail'] ? req.files['thumbnail'][0].path : null;
    const pdf1 = req.files['pdf1'] ? req.files['pdf1'][0].path : null;
    const pdf2 = req.files['pdf2'] ? req.files['pdf2'][0].path : null;
    const pdf3 = req.files['pdf3'] ? req.files['pdf3'][0].path : null;

    try {
      // Atualizar os dados no banco de dados
      await db.query(
        `UPDATE cp_mat_extra
         SET cp_mat_extra_thumbnail = COALESCE(?, cp_mat_extra_thumbnail),
             cp_mat_extra_title = ?,
             cp_mat_extra_description = ?,
             cp_mat_extra_date = ?,
             cp_mat_extra_youtube_url = ?,
             cp_mat_extra_pdf1 = COALESCE(?, cp_mat_extra_pdf1),
             cp_mat_extra_pdf2 = COALESCE(?, cp_mat_extra_pdf2),
             cp_mat_extra_pdf3 = COALESCE(?, cp_mat_extra_pdf3),
             cp_mat_extra_categories = ?,
             cp_mat_extra_permitirDownload = ?
         WHERE cp_mat_extra_id = ?`,
        [
          thumbnail,
          title,
          description,
          date,
          youtube_url,
          pdf1,
          pdf2,
          pdf3,
          categories,
          permitirDownload || 0,
          id,
        ]
      );

      res.status(200).json({ message: 'Material atualizado com sucesso' });
    } catch (err) {
      console.error('Erro ao atualizar material:', err);
      res.status(500).json({ error: 'Erro ao atualizar material' });
    }
  }
);



app.delete('/material-extra/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM cp_mat_extra WHERE cp_mat_extra_id = ?', [id]);
    res.status(200).json({ message: 'Material excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir material' });
  }
});



// FIM MATERIAL EXTRA //

// INICIO MATRICULA //

// Buscar todos os usuários do tipo cp_tipo_user = 5 para a matrícula
app.get('/buscarusermatricula', (req, res) => {
  const buscarUsuariosQuery = 'SELECT * FROM cp_usuarios WHERE cp_tipo_user = 5 AND cp_excluido = 0';
  // const buscarUsuariosQuery = 'SELECT cp_id, cp_nome, cp_cpf, cp_datanascimento, cp_profissao, cp_estadocivil, cp_end_cidade_estado, cp_end_rua, cp_end_num, cp_whatsapp, cp_telefone, cp_email FROM cp_usuarios WHERE cp_tipo_user = 5';

  db.query(buscarUsuariosQuery, (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro no servidor' });
    } else if (result.length === 0) {
      res.status(404).send({ msg: 'Nenhum usuário encontrado' });
    } else {
      res.send(result);
    }
  });
});

// Buscar um usuário do tipo cp_tipo_user = 5 para a matrícula
app.get('/buscarusermatricula/:id', (req, res) => {
  const userId = req.params.id;
  const buscarUsuarioQuery = 'SELECT * FROM cp_usuarios WHERE cp_tipo_user = 5 AND cp_excluido = 0 AND cp_id = ? LIMIT 1';

  db.query(buscarUsuarioQuery, [userId], (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro no servidor' });
    } else if (result.length === 0) {
      res.status(404).send({ msg: 'Usuário não encontrado' });
    } else {
      res.send(result[0]); // Retorna apenas o primeiro usuário encontrado
    }
  });
});

// Buscar todos os usuários do tipo cp_tipo_user = 5 para a matrícula
// Rota para buscar as matrículas
app.get('/relatoriomatricula', (req, res) => {
  const query = 'SELECT * FROM cp_matriculas'; // Consulta SQL para selecionar todas as matrículas
  db.query(query, (err, result) => {
    if (err) {
      res.status(500).send({ error: 'Erro ao buscar matrículas' });
      return;
    }
    res.send(result); // Retorna as matrículas encontradas
  });
});

// Buscar CPF do usuário com base no ID
app.get('/buscarcpfusuario/:id', (req, res) => {
  const { id } = req.params;
  const buscarCpfUsuarioQuery = 'SELECT cp_cpf FROM cp_usuarios WHERE cp_id = ?';

  db.query(buscarCpfUsuarioQuery, [id], (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro no servidor' });
    } else if (result.length === 0) {
      res.status(404).send({ msg: 'CPF do usuário não encontrado' });
    } else {
      res.send(result[0]);
    }
  });
});


// app.post('/cadastrar-matricula', async (req, res) => {
//   console.log('Dados recebidos no backend:', req.body);

//   const {
//     cursoId: cp_mt_curso,
//     usuarioId: cp_mt_usuario,
//     cpfUsuario: cp_mt_cadastro_usuario,
//     valorCurso: cp_mt_valor_curso,
//     numeroParcelas: cp_mt_quantas_parcelas,
//     status: cp_status_matricula,
//     escolaId: cp_mt_escola,
//     escolaridade: cp_mt_escolaridade,
//     localNascimento: cp_mt_local_nascimento,
//     redeSocial: cp_mt_rede_social,
//     nomePai: cp_mt_nome_pai,
//     contatoPai: cp_mt_contato_pai,
//     nomeMae: cp_mt_nome_mae,
//     contatoMae: cp_mt_contato_mae,
//     horarioInicio: cp_mt_horario_inicio,
//     horarioFim: cp_mt_horario_fim,
//     nivelIdioma: cp_mt_nivel,
//     primeiraDataPagamento: cp_mt_primeira_parcela,
//     nomeUsuario: cp_mt_nome_usuario,
//   } = req.body;

//   const newMatricula = {
//     cp_mt_curso,
//     cp_mt_usuario,
//     cp_mt_cadastro_usuario,
//     cp_mt_valor_curso,
//     cp_mt_quantas_parcelas,
//     cp_mt_parcelas_pagas: 0,
//     cp_status_matricula,
//     cp_mt_escola,
//     cp_mt_escolaridade,
//     cp_mt_nivel,
//     cp_mt_local_nascimento,
//     cp_mt_rede_social,
//     cp_mt_nome_pai,
//     cp_mt_contato_pai,
//     cp_mt_nome_mae,
//     cp_mt_contato_mae,
//     cp_mt_horario_inicio,
//     cp_mt_horario_fim,
//     cp_mt_excluido: 0,
//     cp_mt_primeira_parcela,
//     cp_mt_nome_usuario,
//   };

//   try {
//     // Inicia uma transação
//     db.beginTransaction(async (err) => {
//       if (err) {
//         console.error('Erro ao iniciar transação:', err);
//         res.status(500).send({ msg: 'Erro ao cadastrar matrícula' });
//         return;
//       }

//       // Insere os dados da matrícula no banco de dados
//       db.query('INSERT INTO cp_matriculas SET ?', newMatricula, async (err, result) => {
//         if (err) {
//           console.error('Erro ao cadastrar matrícula:', err);
//           db.rollback(() => {
//             res.status(500).send({ msg: 'Erro ao cadastrar matrícula' });
//           });
//           return;
//         }

//         const matriculaId = result.insertId;
//         console.log('Matrícula cadastrada com sucesso, ID:', matriculaId);

//         // Calcula e insere as parcelas
//         const parcelas = [];
//         const valorParcela = parseFloat((cp_mt_valor_curso / cp_mt_quantas_parcelas).toFixed(2));

//         // Data da primeira parcela
//         let dataParcela = new Date(cp_mt_primeira_parcela);

//         // Insere as parcelas
//         for (let i = 1; i <= cp_mt_quantas_parcelas; i++) {
//           parcelas.push([
//             matriculaId,
//             dataParcela,
//             'à vencer', // Status padrão
//             valorParcela,
//           ]);

//           // Calcula a data da próxima parcela (mês a mês)
//           dataParcela.setMonth(dataParcela.getMonth() + 1);
//         }

//         // Insere as parcelas no banco de dados
//         const query = 'INSERT INTO cp_matriculaParcelas (cp_mt_id, cp_mtPar_dataParcela, cp_mtPar_status, cp_mtPar_valorParcela) VALUES ?';
//         db.query(query, [parcelas], (err, results) => {
//           if (err) {
//             console.error('Erro ao cadastrar parcelas:', err);
//             db.rollback(() => {
//               res.status(500).send({ msg: 'Erro ao cadastrar matrícula' });
//             });
//           } else {
//             console.log('Parcelas cadastradas com sucesso');
//             // Commit da transação
//             db.commit((err) => {
//               if (err) {
//                 console.error('Erro ao realizar commit da transação:', err);
//                 db.rollback(() => {
//                   res.status(500).send({ msg: 'Erro ao cadastrar matrícula' });
//                 });
//               } else {
//                 res.send({ msg: 'Matrícula cadastrada com sucesso', matriculaId });
//               }
//             });
//           }
//         });
//       });
//     });
//   } catch (error) {
//     console.error('Erro ao cadastrar matrícula:', error);
//     res.status(500).send({ msg: 'Erro ao cadastrar matrícula' });
//   }
// });

app.post('/cadastrar-matricula', async (req, res) => {
  console.log('Dados recebidos no backend:', req.body);

  const {
    cursoId: cp_mt_curso,
    usuarioId: cp_mt_usuario,
    cpfUsuario: cp_mt_cadastro_usuario,
    valorCurso: cp_mt_valor_curso,
    numeroParcelas: cp_mt_quantas_parcelas,
    status: cp_status_matricula,
    escolaId: cp_mt_escola,
    escolaridade: cp_mt_escolaridade,
    localNascimento: cp_mt_local_nascimento,
    redeSocial: cp_mt_rede_social,
    nomePai: cp_mt_nome_pai,
    contatoPai: cp_mt_contato_pai,
    nomeMae: cp_mt_nome_mae,
    contatoMae: cp_mt_contato_mae,
    horarioInicio: cp_mt_horario_inicio,
    horarioFim: cp_mt_horario_fim,
    nivelIdioma: cp_mt_nivel,
    primeiraDataPagamento: cp_mt_primeira_parcela,
    nomeUsuario: cp_mt_nome_usuario,
  } = req.body;

  const newMatricula = {
    cp_mt_curso,
    cp_mt_usuario,
    cp_mt_cadastro_usuario,
    cp_mt_valor_curso,
    cp_mt_quantas_parcelas,
    cp_mt_parcelas_pagas: 0,
    cp_status_matricula,
    cp_mt_escola,
    cp_mt_escolaridade,
    cp_mt_nivel,
    cp_mt_local_nascimento,
    cp_mt_rede_social,
    cp_mt_nome_pai,
    cp_mt_contato_pai,
    cp_mt_nome_mae,
    cp_mt_contato_mae,
    cp_mt_horario_inicio,
    cp_mt_horario_fim,
    cp_mt_excluido: 0,
    cp_mt_primeira_parcela,
    cp_mt_nome_usuario,
  };

  try {
    // Inicia uma transação
    db.beginTransaction(async (err) => {
      if (err) {
        console.error('Erro ao iniciar transação:', err);
        res.status(500).send({ msg: 'Erro ao cadastrar matrícula' });
        return;
      }

      // Insere os dados da matrícula no banco de dados
      db.query('INSERT INTO cp_matriculas SET ?', newMatricula, async (err, result) => {
        if (err) {
          console.error('Erro ao cadastrar matrícula:', err);
          db.rollback(() => {
            res.status(500).send({ msg: 'Erro ao cadastrar matrícula' });
          });
          return;
        }

        const matriculaId = result.insertId;
        console.log('Matrícula cadastrada com sucesso, ID:', matriculaId);

        // Calcula e insere as parcelas
        const parcelas = [];
        const valorParcela = parseFloat((cp_mt_valor_curso / cp_mt_quantas_parcelas).toFixed(2));

        // Data da primeira parcela
        let dataParcela = new Date(cp_mt_primeira_parcela);

        // Insere as parcelas
        for (let i = 1; i <= cp_mt_quantas_parcelas; i++) {
          parcelas.push([
            matriculaId,
            new Date(dataParcela), // Copia a data atual da parcela
            'à vencer', // Status padrão
            valorParcela,
          ]);

          // Incrementa o mês da data da próxima parcela
          dataParcela.setMonth(dataParcela.getMonth() + 1);
        }

        // Insere as parcelas no banco de dados
        const query = 'INSERT INTO cp_matriculaParcelas (cp_mt_id, cp_mtPar_dataParcela, cp_mtPar_status, cp_mtPar_valorParcela) VALUES ?';
        db.query(query, [parcelas], (err, results) => {
          if (err) {
            console.error('Erro ao cadastrar parcelas:', err);
            db.rollback(() => {
              res.status(500).send({ msg: 'Erro ao cadastrar matrícula' });
            });
          } else {
            console.log('Parcelas cadastradas com sucesso');
            // Commit da transação
            db.commit((err) => {
              if (err) {
                console.error('Erro ao realizar commit da transação:', err);
                db.rollback(() => {
                  res.status(500).send({ msg: 'Erro ao cadastrar matrícula' });
                });
              } else {
                res.send({ msg: 'Matrícula cadastrada com sucesso', matriculaId });
              }
            });
          }
        });
      });
    });
  } catch (error) {
    console.error('Erro ao cadastrar matrícula:', error);
    res.status(500).send({ msg: 'Erro ao cadastrar matrícula' });
  }
});




// Buscar todas as matrículas
app.get('/matriculas', (req, res) => {
  const buscarMatriculasQuery = 'SELECT * FROM cp_matriculas';

  db.query(buscarMatriculasQuery, (err, result) => {
    if (err) {
      console.error('Erro ao buscar matrículas:', err);
      res.status(500).send({ msg: 'Erro ao buscar matrículas' });
    } else {
      res.send(result);
    }
  });
});

// Buscar uma matrícula específica pelo ID
app.get('/matriculas/:matriculaId', (req, res) => {
  const matriculaId = req.params.matriculaId;
  const buscarMatriculaQuery = 'SELECT * FROM cp_matriculas WHERE cp_mt_id = ?';

  db.query(buscarMatriculaQuery, [matriculaId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar matrícula:', err);
      res.status(500).send({ msg: 'Erro ao buscar matrícula' });
    } else if (result.length === 0) {
      res.status(404).send({ msg: 'Matrícula não encontrada' });
    } else {
      res.send(result[0]);
    }
  });
});

// app.get('/matricula/:userId', (req, res) => {
//   const userId = req.params.userId;
//   db.query('SELECT cp_nome, cp_cpf FROM cp_usuarios WHERE cp_id = ?', userId, (err, result) => {
//     if (err) {
//       res.status(500).send({ msg: 'Erro ao buscar dados do usuário' });
//     } else if (result.length > 0) {
//       const userData = {
//         nomeUsuario: result[0].cp_nome,
//         cpfUsuario: result[0].cp_cpf,
//       };
//       res.send(userData); // Envia nome e CPF do usuário como resposta
//     } else {
//       res.status(404).send({ msg: 'Usuário não encontrado' });
//     }
//   });
// });

app.get('/matricula/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT 
      cp_nome, 
      cp_cpf, 
      cp_datanascimento, 
      cp_profissao, 
      cp_estadocivil, 
      cp_end_cidade_estado, 
      cp_end_rua, 
      cp_end_num, 
      cp_whatsapp, 
      cp_telefone, 
      cp_email, 
      cp_escola_id 
    FROM cp_usuarios 
    WHERE cp_id = ?
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro ao buscar dados do usuário' });
    } else if (result.length > 0) {
      const userData = {
        nomeUsuario: result[0].cp_nome,
        cpfUsuario: result[0].cp_cpf,
        dataNascimento: result[0].cp_datanascimento,
        profissao: result[0].cp_profissao,
        estadoCivil: result[0].cp_estadocivil,
        endereco: `${result[0].cp_end_cidade_estado}, ${result[0].cp_end_rua}, ${result[0].cp_end_num}`,
        whatsapp: result[0].cp_whatsapp,
        telefone: result[0].cp_telefone,
        email: result[0].cp_email,
        escolaId: result[0].cp_escola_id
      };
      res.send(userData);
    } else {
      res.status(404).send({ msg: 'Usuário não encontrado' });
    }
  });
});



// Editar uma matrícula existente

app.put('/editar-matricula/:matriculaId', async (req, res) => {
  const matriculaId = req.params.matriculaId;

  // Extrair os dados do corpo da requisição
  const {
    cursoId,
    usuarioId,
    cpfUsuario,
    valorCurso,
    numeroParcelas,
    status,
    escolaId,
    escolaridade,
    localNascimento,
    redeSocial,
    nomePai,
    contatoPai,
    nomeMae,
    contatoMae,
    horarioInicio,
    horarioFim,
    nivelIdioma,
    primeiraDataPagamento,
    nomeUsuario,
  } = req.body;

  try {
    // Verificar se a matrícula existe
    db.query('SELECT * FROM cp_matriculas WHERE cp_mt_id = ?', [matriculaId], (err, result) => {
      if (err) {
        console.error('Erro ao buscar matrícula:', err);
        res.status(500).send({ msg: 'Erro ao buscar matrícula' });
      } else if (result.length === 0) {
        res.status(404).send({ msg: 'Matrícula não encontrada' });
      } else {
        // Matrícula encontrada, prosseguir com a atualização
        const updateMatriculaQuery = `
          UPDATE cp_matriculas 
          SET 
            cp_mt_curso = ?,
            cp_mt_usuario = ?,
            cp_mt_cadastro_usuario = ?,
            cp_mt_valor_curso = ?,
            cp_mt_quantas_parcelas = ?,
            cp_status_matricula = ?,
            cp_mt_escola = ?,
            cp_mt_escolaridade = ?,
            cp_mt_nivel = ?,
            cp_mt_local_nascimento = ?,
            cp_mt_rede_social = ?,
            cp_mt_nome_pai = ?,
            cp_mt_contato_pai = ?,
            cp_mt_nome_mae = ?,
            cp_mt_contato_mae = ?,
            cp_mt_horario_inicio = ?,
            cp_mt_horario_fim = ?,
            cp_mt_primeira_parcela = ?,
            cp_mt_nome_usuario = ?
          WHERE cp_mt_id = ?
        `;

        // Executar a atualização no banco de dados
        db.query(
          updateMatriculaQuery,
          [
            cursoId,
            usuarioId,
            cpfUsuario,
            valorCurso,
            numeroParcelas,
            status,
            escolaId,
            escolaridade,
            nivelIdioma,
            localNascimento,
            redeSocial,
            nomePai,
            contatoPai,
            nomeMae,
            contatoMae,
            horarioInicio,
            horarioFim,
            primeiraDataPagamento,
            nomeUsuario,
            matriculaId
          ],
          (err, result) => {
            if (err) {
              console.error('Erro ao editar matrícula:', err);
              res.status(500).send({ msg: 'Erro ao editar matrícula' });
            } else {
              console.log('Matrícula editada com sucesso');
              res.send({ msg: 'Matrícula editada com sucesso' });
            }
          }
        );
      }
    });
  } catch (error) {
    console.error('Erro ao editar matrícula:', error);
    res.status(500).send({ msg: 'Erro ao editar matrícula' });
  }
});


// Excluir uma matrícula pelo ID
app.delete('/excluir-matricula/:matriculaId', (req, res) => {
  const matriculaId = req.params.matriculaId;
  const excluirParcelasQuery = 'DELETE FROM cp_matriculaParcelas WHERE cp_mt_id = ?';
  const excluirMatriculaQuery = 'DELETE FROM cp_matriculas WHERE cp_mt_id = ?';

  // Iniciar uma transação para garantir que ambas as operações ocorram juntas
  db.beginTransaction((err) => {
    if (err) {
      console.error('Erro ao iniciar transação:', err);
      return res.status(500).send({ msg: 'Erro ao iniciar transação' });
    }

    // Primeiro, excluir todas as parcelas relacionadas
    db.query(excluirParcelasQuery, [matriculaId], (err, result) => {
      if (err) {
        console.error('Erro ao excluir parcelas:', err);
        return db.rollback(() => {
          res.status(500).send({ msg: 'Erro ao excluir parcelas' });
        });
      }

      // Em seguida, excluir a matrícula
      db.query(excluirMatriculaQuery, [matriculaId], (err, result) => {
        if (err) {
          console.error('Erro ao excluir matrícula:', err);
          return db.rollback(() => {
            res.status(500).send({ msg: 'Erro ao excluir matrícula' });
          });
        }

        // Confirmar a transação
        db.commit((err) => {
          if (err) {
            console.error('Erro ao confirmar transação:', err);
            return db.rollback(() => {
              res.status(500).send({ msg: 'Erro ao confirmar transação' });
            });
          }

          console.log('Matrícula e parcelas excluídas com sucesso');
          res.send({ msg: 'Matrícula e parcelas excluídas com sucesso' });
        });
      });
    });
  });
});


// Rota para realizar a correção
app.get('/corrigir-escolas', (req, res) => {
  const query = `
    UPDATE cp_matriculas m
    JOIN cp_usuarios u ON m.cp_mt_usuario = u.cp_id
    SET m.cp_mt_escola = u.cp_escola_id
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Erro ao executar a query:', err);
      res.status(500).send('Erro interno ao tentar corrigir as escolas');
    } else {
      console.log('Correção realizada com sucesso');
      res.status(200).send('Correção realizada com sucesso');
    }
  });
});


// Rota para selecionar todos os campos da tabela cp_matriculaParcelas
app.get('/financeira', (req, res) => {
  // Execute a query SQL para selecionar todos os campos da tabela cp_matriculaParcelas
  db.query('SELECT * FROM cp_matriculaParcelas', (err, rows) => {
    if (err) {
      console.error('Erro ao selecionar parcelas:', err);
      return res.status(500).json({ error: 'Erro ao selecionar parcelas' });
    }

    res.json(rows); // Retorna os resultados como JSON
  });
});


// Rota para buscar informações específicas baseado no cp_mt_id
app.get('/financeira/:id', (req, res) => {
  const { id } = req.params;

  // Consulta SQL para selecionar campos específicos baseado no cp_mt_id
  const query = `
    SELECT cp_mt_escola, cp_mt_nome_usuario, cp_status_matricula
    FROM cp_matriculas
    WHERE cp_mt_id = ?
  `;

  // Executa a query SQL com o ID fornecido
  db.query(query, [id], (err, rows) => {
    if (err) {
      console.error('Erro ao selecionar informações:', err);
      return res.status(500).json({ error: 'Erro ao selecionar informações' });
    }

    res.json(rows); // Retorna os resultados como JSON
  });
});

// Rota para atualizar o status da parcela
app.put('/update-status/:parcelaId', (req, res) => {
  const parcelaId = req.params.parcelaId;
  const newStatus = req.body.status;

  if (newStatus !== "Pago" && newStatus !== "à vencer") {
    return res.status(400).json({ error: "Status inválido" });
  }

  db.query(
    'UPDATE cp_matriculaParcelas SET cp_mtPar_status = ? WHERE cp_mtPar_id = ?',
    [newStatus, parcelaId],
    (err, result) => {
      if (err) {
        console.error('Erro ao atualizar o status da parcela:', err);
        res.status(500).json({ error: 'Erro ao atualizar o status da parcela' });
        return;
      }
      res.status(200).json({ message: 'Status da parcela atualizado com sucesso' });
    }
  );
});




// FIM MATRICULA //
// rotas de testes //


// Rota para atualizar os nomes na tabela cp_matriculas
app.get('/atualizar-nomes', (req, res) => {
  db.query('SELECT cp_id, cp_nome FROM cp_usuarios', (err, usuarios) => {
    if (err) {
      console.error('Erro ao consultar cp_usuarios:', err);
      return res.status(500).send('Erro ao consultar usuários');
    }

    let totalUsuarios = usuarios.length;
    let atualizados = 0;
    let erros = 0;

    usuarios.forEach(usuario => {
      const { cp_id, cp_nome } = usuario;
      db.query(
        'UPDATE cp_matriculas SET cp_mt_nome_usuario = ? WHERE cp_mt_usuario = ?',
        [cp_nome, cp_id],
        (err, result) => {
          if (err) {
            console.error(`Erro ao atualizar cp_matriculas para o usuário ${cp_id}:`, err);
            erros++;
          } else {
            atualizados += result.affectedRows;
          }

          if (atualizados + erros === totalUsuarios) {
            res.send(`Atualização concluída: ${atualizados} registros atualizados, ${erros} erros`);
          }
        }
      );
    });
  });
});

// Rota para Agenda

app.get('/aniversariantes', (req, res) => {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1; // Os meses começam do 0
  const currentDate = `${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`; // MM-DD

  const query = `
    SELECT cp_nome, cp_datanascimento, cp_escola_id
    FROM cp_usuarios
    WHERE DATE_FORMAT(cp_datanascimento, '%m-%d') BETWEEN ? AND ?
    AND cp_excluido = 0
    ORDER BY cp_datanascimento
  `;

  const startDate = currentDate;
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 5);
  const endDay = endDate.getDate();
  const endMonth = endDate.getMonth() + 1;
  const endFormatted = `${endMonth < 10 ? '0' + endMonth : endMonth}-${endDay < 10 ? '0' + endDay : endDay}`; // MM-DD

  db.query(query, [startDate, endFormatted], (err, result) => {
    if (err) {
      res.status(500).send({ msg: 'Erro no servidor' });
    } else {
      res.send(result);
    }
  });
});





const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
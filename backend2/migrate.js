const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// URL do backend online onde estão os dados antigos
const BACKEND_URL = "https://testes.cursoviolaocristao.com.br";

// Função para fazer requisições HTTP para buscar dados do backend online
async function fetchData(endpoint) {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar dados de ${endpoint}:`, error);
    throw error;
  }
}

// Função para converter data MySQL para PostgreSQL
function convertDate(mysqlDate) {
  if (!mysqlDate || mysqlDate === "0000-00-00 00:00:00") {
    return new Date();
  }
  return new Date(mysqlDate);
}

// Função para extrair os dados dos usuários

// Função para criptografar senha (usando MD5 como no sistema original)
// function encryptPassword(password) {
//   const crypto = require("crypto");
//   return crypto.createHash("md5").update(password).digest("hex");
// }

// Função para migrar usuários
async function migrateUsuarios() {
  try {
    const users = await fetchData("/usuarios-migracao");

    if (users.length === 0) return;

    let migratedCount = 0;

    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    for (const user of users) {
      try {
        // Usar a senha original sem criptografar
        const originalPassword = user.cp_password || "escolacipex@123"; // senha padrão se estiver vazia

        await prisma.cp_usuarios.upsert({
          where: {
            cp_id: user.cp_id,
          },
          update: {},
          create: {
            cp_id: user.cp_id,
            cp_nome: user.cp_nome || "",
            cp_email: user.cp_email || "",
            cp_login: user.cp_login || "",
            cp_password: originalPassword,
            cp_tipo_user: parseInt(user.cp_tipo_user) || 5,
            cp_rg: user.cp_rg || "",
            cp_cpf: user.cp_cpf || "",
            cp_datanascimento:
              user.cp_datanascimento && user.cp_datanascimento !== "0000-00-00"
                ? new Date(user.cp_datanascimento)
                : new Date("2000-01-01"),

            cp_telefone: user.cp_telefone || "",
            cp_escola_id: user.cp_escola_id || 1,
            cp_foto_perfil: user.cp_foto_perfil || "/FotoPerfil/default.png",
            cp_excluido: parseInt(user.cp_excluido) || 0,

            // campos opcionais convertidos corretamente
            cp_estadocivil: user.cp_estadocivil || null,
            cp_cnpj: user.cp_cnpj ? BigInt(user.cp_cnpj) : null,
            cp_ie: user.cp_ie ? BigInt(user.cp_ie) : null,
            cp_whatsapp: user.cp_whatsapp || null,
            cp_empresaatuacao: user.cp_empresaatuacao || null,
            cp_profissao: user.cp_profissao || null,
            cp_end_cidade_estado: user.cp_end_cidade_estado || null,
            cp_end_rua: user.cp_end_rua || null,
            cp_end_num: user.cp_end_num ? String(user.cp_end_num) : null,
            cp_end_cep: user.cp_end_cep ? String(user.cp_end_cep) : null,
            cp_descricao: user.cp_descricao || null,
            cp_turma_id: user.cp_turma_id || null,

            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        await delay(100);
        migratedCount++;
      } catch (error) {
        console.error(`Erro ao migrar usuário ${user.cp_id}: ${error.message}`);
      }
    }

    console.log(`✓ Migrados ${migratedCount} usuários`);
  } catch (error) {
    console.log(`✗ Erro ao migrar usuários`);
  }
}

// Função para migrar escolas
async function migrateEscolas() {
  try {
    const escolas = await fetchData("/escolas");

    for (const escola of escolas) {
      await prisma.cp_escolas.create({
        data: {
          cp_ec_id: escola.cp_ec_id,
          cp_ec_nome: escola.cp_ec_nome || "",
          cp_ec_telefone: escola.cp_ec_telefone || "",
          cp_ec_email: escola.cp_ec_email || "",
          cp_ec_endereco: escola.cp_ec_endereco || "",
          cp_ec_excluido: escola.cp_ec_excluido || 0,
          created_at: convertDate(escola.created_at),
          updated_at: convertDate(escola.updated_at),
        },
      });
    }

    console.log(`✓ Migradas ${escolas.length} escolas`);
  } catch (error) {
    console.log(`✗ Erro ao migrar escolas`);
  }
}

// Função para migrar cursos
async function migrateCursos() {
  try {
    const cursos = await fetchData("/cursos");

    for (const curso of cursos) {
      await prisma.cp_cursos.create({
        data: {
          cp_id_curso: curso.cp_id_curso,
          cp_nome_curso: curso.cp_nome_curso || "",
          cp_descricao_curso: curso.cp_descricao_curso,
          cp_preco_curso: parseFloat(curso.cp_preco_curso) || 0,
          cp_duracao_meses: parseInt(curso.cp_duracao_meses) || 0,
          cp_excluido: curso.cp_excluido || 0,
          created_at: convertDate(curso.created_at),
          updated_at: convertDate(curso.updated_at),
        },
      });
    }

    console.log(`✓ Migrados ${cursos.length} cursos`);
  } catch (error) {
    console.log(`✗ Erro ao migrar cursos`);
  }
}

// Função para migrar turmas
async function migrateTurmas() {
  try {
    const turmas = await fetchData("/turmas-migracao");

    if (!turmas || turmas.length === 0) {
      console.log(`✓ Migradas 0 turmas`);
      return;
    }

    let migratedCount = 0;

    for (const turma of turmas) {
      try {
        await prisma.cp_turmas.create({
          data: {
            cp_tr_id: turma.cp_tr_id,
            cp_tr_nome: turma.cp_tr_nome || "",
            cp_tr_data: turma.cp_tr_data && turma.cp_tr_data !== "0000-00-00"
              ? convertDate(turma.cp_tr_data)
              : new Date("2000-01-01"),
            cp_tr_id_professor: turma.cp_tr_id_professor || 0,
            cp_tr_id_escola: turma.cp_tr_id_escola || 0,
            cp_tr_curso_id: turma.cp_tr_curso_id || 0,
          },
        });
        migratedCount++;
      } catch (turmaError) {
        console.error(`Erro ao migrar turma ${turma.cp_tr_id}:`, turmaError.message);
      }
    }

    console.log(`✓ Migradas ${migratedCount} turmas`);
  } catch (error) {
    console.error(`✗ Erro ao migrar turmas:`, error.message);
  }
}

// Função para migrar matrículas
async function migrateMatriculas() {
  try {
    const matriculas = await fetchData("/matriculas");

    for (const matricula of matriculas) {
      await prisma.cp_matriculas.create({
        data: {
          cp_mt_id: matricula.cp_mt_id,
          cp_mt_curso: parseInt(matricula.cp_mt_curso) || 0,
          cp_mt_usuario_id: matricula.cp_mt_usuario_id || 0,
          cp_mt_escola_id: matricula.cp_mt_escola_id || 0,
          cp_mt_nome_usuario: matricula.cp_mt_nome_usuario || "",
          cp_mt_cpf_usuario: matricula.cp_mt_cpf_usuario || "",
          cp_mt_valor_curso: parseFloat(matricula.cp_mt_valor_curso) || 0,
          cp_mt_numero_parcelas: parseInt(matricula.cp_mt_numero_parcelas) || 0,
          cp_mt_primeira_data_pagamento:
            matricula.cp_mt_primeira_data_pagamento || "",
          cp_mt_status: matricula.cp_mt_status || "",
          cp_mt_nivel_idioma: matricula.cp_mt_nivel_idioma,
          cp_mt_horario_inicio: matricula.cp_mt_horario_inicio,
          cp_mt_horario_fim: matricula.cp_mt_horario_fim,
          cp_mt_local_nascimento: matricula.cp_mt_local_nascimento,
          cp_mt_escolaridade: matricula.cp_mt_escolaridade,
          cp_mt_rede_social: matricula.cp_mt_rede_social,
          cp_mt_nome_pai: matricula.cp_mt_nome_pai,
          cp_mt_contato_pai: matricula.cp_mt_contato_pai,
          cp_mt_nome_mae: matricula.cp_mt_nome_mae,
          cp_mt_contato_mae: matricula.cp_mt_contato_mae,
          cp_mt_nome_emergencia: matricula.cp_mt_nome_emergencia,
          cp_mt_contato_emergencia: matricula.cp_mt_contato_emergencia,
          cp_mt_excluido: matricula.cp_mt_excluido || 0,
          created_at: convertDate(matricula.created_at),
          updated_at: convertDate(matricula.updated_at),
        },
      });
    }

    console.log(`✓ Migradas ${matriculas.length} matrículas`);
  } catch (error) {
    console.log(`✗ Erro ao migrar matrículas`);
  }
}

// Função para migrar áudios
async function migrateAudios() {
  try {
    const audios = await fetchData("/audio-migracao");

    if (!audios || audios.length === 0) {
      console.log(`✓ Migrados 0 áudios`);
      return;
    }

    let totalAudios = 0;

    for (const audio of audios) {
      try {
        await prisma.cp_audios.create({
          data: {
            cp_aud_id: audio.cp_audio_id,
            cp_aud_titulo: audio.cp_nome_audio || "",
            cp_aud_descricao: null,
            cp_aud_arquivo: audio.cp_arquivo_audio || "",
            cp_aud_curso_id: audio.cp_curso_id,
            cp_aud_excluido: 0,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        totalAudios++;
      } catch (audioError) {
        // Erro silencioso
      }
    }

    console.log(`✓ Migrados ${totalAudios} áudios`);
  } catch (error) {
    console.log(`✗ Erro ao migrar áudios`);
  }
}

// Função para migrar material extra
async function migrateMatExtra() {
  try {
    const materiais = await fetchData("/material-extra");

    for (const material of materiais) {
      await prisma.cp_mat_extra.create({
        data: {
          cp_mat_extra_id: material.cp_mat_extra_id,
          cp_mat_extra_title: material.cp_mat_extra_title || "",
          cp_mat_extra_category: material.cp_mat_extra_category || "",
          cp_mat_extra_desc: material.cp_mat_extra_desc,
          cp_mat_extra_file: material.cp_mat_extra_file || "",
          cp_mat_extra_categories: material.cp_mat_extra_categories,
          cp_mat_extra_codigos: material.cp_mat_extra_codigos,
          cp_mat_extra_thumbnail: material.cp_mat_extra_thumbnail,
          cp_mat_extra_pdf1: material.cp_mat_extra_pdf1,
          cp_mat_extra_pdf2: material.cp_mat_extra_pdf2,
          cp_mat_extra_pdf3: material.cp_mat_extra_pdf3,
          cp_mat_extra_permitirDownload: material.cp_mat_extra_permitirDownload,
          cp_mat_extra_excluido: material.cp_mat_extra_excluido || 0,
          created_at: convertDate(material.created_at),
          updated_at: convertDate(material.updated_at),
        },
      });
    }

    console.log(`✓ Migrados ${materiais.length} materiais extra`);
  } catch (error) {
    console.log(`✗ Erro ao migrar materiais extra`);
  }
}

// Função para migrar materiais
async function migrateMateriais() {
  try {
    const materiais = await fetchData("/materiais");

    for (const material of materiais) {
      await prisma.cp_mat_materiais.create({
        data: {
          cp_mat_id: material.cp_mat_id,
          cp_mat_titulo: material.cp_mat_titulo || "",
          cp_mat_descricao: material.cp_mat_descricao,
          cp_mat_extra_date: convertDate(material.cp_mat_extra_date),
          cp_mat_linkYoutube: material.cp_mat_linkYoutube,
          cp_mat_miniatura: material.cp_mat_miniatura,
          cp_mat_arquivoPdf: material.cp_mat_arquivoPdf,
          cp_mat_extra_pdf2: material.cp_mat_extra_pdf2,
          cp_mat_extra_pdf3: material.cp_mat_extra_pdf3,
          cp_mat_extra_categories: material.cp_mat_extra_categories,
          cp_mat_permitirDownload: material.cp_mat_permitirDownload,
          cp_mat_extra_excluido: material.cp_mat_extra_excluido || 0,
          created_at: convertDate(material.created_at),
          updated_at: convertDate(material.updated_at),
        },
      });
    }

    console.log(`✓ Migrados ${materiais.length} materiais`);
  } catch (error) {
    console.log(`✗ Erro ao migrar materiais`);
  }
}

// Função para migrar resumos
async function migrateResumos() {
  try {
    const turmas = await fetchData("/turmas");
    let totalResumos = 0;

    for (const turma of turmas) {
      try {
        const resumos = await fetchData(`/resumos/${turma.cp_tr_id}`);

        for (const resumo of resumos) {
          await prisma.cp_resumos.create({
            data: {
              cp_res_id: resumo.cp_res_id,
              cp_res_turma_id: resumo.cp_res_turma_id || 0,
              cp_res_data: convertDate(resumo.cp_res_data),
              cp_res_hora: resumo.cp_res_hora || "",
              cp_res_resumo: resumo.cp_res_resumo,
              cp_res_arquivo: resumo.cp_res_arquivo,
              cp_res_aula: resumo.cp_res_aula,
              cp_res_link: resumo.cp_res_link,
              cp_res_link_youtube: resumo.cp_res_link_youtube,
              cp_res_excluido: resumo.cp_res_excluido || 0,
              created_at: convertDate(resumo.created_at),
              updated_at: convertDate(resumo.updated_at),
            },
          });
          totalResumos++;
        }
      } catch (error) {
        // Erro silencioso
      }
    }

    console.log(`✓ Migrados ${totalResumos} resumos`);
  } catch (error) {
    console.log(`✗ Erro ao migrar resumos`);
  }
}

// Função para migrar registro de aulas (placeholder - endpoint não encontrado)
async function migrateRegistroAulas() {
  console.log(`✓ Migrados 0 registros de aulas`);
}

// Função para migrar histórico de chamadas
async function migrateHistoricoChamadas() {
  try {
    const turmas = await fetchData("/turmas");
    let totalChamadas = 0;

    for (const turma of turmas) {
      try {
        const chamadas = await fetchData(`/chamadas/turma/${turma.cp_tr_id}`);

        for (const chamada of chamadas) {
          await prisma.cp_historico_chamadas.create({
            data: {
              cp_hist_id: chamada.cp_ch_id,
              cp_hist_aluno_id: chamada.cp_ch_aluno_id || 0,
              cp_hist_turma_id: turma.cp_tr_id,
              cp_hist_data: chamada.cp_ch_data || "",
              cp_hist_presente: chamada.cp_ch_status === "Presente",
              cp_hist_observacao: chamada.cp_ch_observacao,
              cp_hist_excluido: 0,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
          totalChamadas++;
        }
      } catch (error) {
        // Erro silencioso
      }
    }

    console.log(`✓ Migradas ${totalChamadas} chamadas`);
  } catch (error) {
    console.log(`✗ Erro ao migrar chamadas`);
  }
}

// Função principal de migração
async function runMigration() {
  console.log("🚀 Iniciando migração Backend Online → PostgreSQL");

  try {
    await migrateUsuarios();
    await migrateEscolas();
    await migrateCursos();
    await migrateTurmas();
    await migrateMatriculas();
    await migrateAudios();
    await migrateMatExtra();
    await migrateMateriais();
    await migrateResumos();
    await migrateRegistroAulas();
    await migrateHistoricoChamadas();

    console.log("✅ Migração concluída!");
  } catch (error) {
    console.log("❌ Erro durante a migração");
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
runMigration();

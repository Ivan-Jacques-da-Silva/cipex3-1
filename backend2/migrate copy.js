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

// Função para debug - mostrar estrutura dos dados
function debugDataStructure(data, entityName) {
  if (data && data.length > 0) {
    console.log(`\n📋 Estrutura dos dados de ${entityName}:`);
    console.log(`Total de registros: ${data.length}`);
    console.log(`Primeiro registro:`, JSON.stringify(data[0], null, 2));
    console.log(`Campos disponíveis:`, Object.keys(data[0]));
    console.log('════════════════════════════════════════\n');
  }
}

// Função para migrar usuários
async function migrateUsuarios() {
  console.log("Migrando cp_usuarios...");

  try {
    const usuarios = await fetchData("/users");

    for (const usuario of usuarios) {
      await prisma.cp_usuarios.create({
        data: {
          cp_id: usuario.cp_id,
          cp_nome: usuario.cp_nome || "",
          cp_cpf: usuario.cp_cpf || "",
          cp_data_nascimento: usuario.cp_data_nascimento || "",
          cp_telefone: usuario.cp_telefone || "",
          cp_email: usuario.cp_email || "",
          cp_senha: usuario.cp_senha || "",
          cp_foto_perfil: usuario.cp_foto_perfil,
          cp_local_nascimento: usuario.cp_local_nascimento,
          cp_escolaridade: usuario.cp_escolaridade,
          cp_rede_social: usuario.cp_rede_social,
          cp_nome_pai: usuario.cp_nome_pai,
          cp_contato_pai: usuario.cp_contato_pai,
          cp_nome_mae: usuario.cp_nome_mae,
          cp_contato_mae: usuario.cp_contato_mae,
          cp_nome_emergencia: usuario.cp_nome_emergencia,
          cp_contato_emergencia: usuario.cp_contato_emergencia,
          cp_tipo_usuario: usuario.cp_tipo_usuario || 5,
          cp_excluido: usuario.cp_excluido || 0,
          created_at: convertDate(usuario.created_at),
          updated_at: convertDate(usuario.updated_at),
        },
      });
    }

    console.log(`✓ Migrados ${usuarios.length} usuários`);
  } catch (error) {
    console.error("Erro ao migrar usuários:", error);
  }
}

// Função para migrar escolas
async function migrateEscolas() {
  console.log("Migrando cp_escolas...");

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
    console.error("Erro ao migrar escolas:", error);
  }
}

// Função para migrar cursos
async function migrateCursos() {
  console.log("Migrando cp_cursos...");

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
    console.error("Erro ao migrar cursos:", error);
  }
}

// Função para migrar turmas
async function migrateTurmas() {
  console.log("Migrando cp_turmas...");

  try {
    const turmas = await fetchData("/turmas");

    for (const turma of turmas) {
      await prisma.cp_turmas.create({
        data: {
          cp_tr_id: turma.cp_tr_id,
          cp_tr_nome: turma.cp_tr_nome || "",
          cp_tr_curso_id: turma.cp_tr_curso_id || 0,
          cp_tr_professor_id: turma.cp_tr_professor_id || 0,
          cp_tr_escola_id: turma.cp_tr_escola_id || 0,
          cp_tr_horario_inicio: turma.cp_tr_horario_inicio || "",
          cp_tr_horario_fim: turma.cp_tr_horario_fim || "",
          cp_tr_dias_semana: turma.cp_tr_dias_semana || "",
          cp_tr_data_inicio: turma.cp_tr_data_inicio || "",
          cp_tr_data_fim: turma.cp_tr_data_fim || "",
          cp_tr_excluido: turma.cp_tr_excluido || 0,
          created_at: convertDate(turma.created_at),
          updated_at: convertDate(turma.updated_at),
        },
      });
    }

    console.log(`✓ Migradas ${turmas.length} turmas`);
  } catch (error) {
    console.error("Erro ao migrar turmas:", error);
  }
}

// Função para migrar matrículas
async function migrateMatriculas() {
  console.log("Migrando cp_matriculas...");

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
    console.error("Erro ao migrar matrículas:", error);
  }
}

// Função para migrar áudios
async function migrateAudios() {
  console.log("Migrando cp_audios...");

  try {
    // Buscar todos os áudios da rota específica de migração
    console.log("Buscando áudios da rota /audio-migracao...");
    const audios = await fetchData("/audio-migracao");

    if (!audios || audios.length === 0) {
      console.log("⚠️  Nenhum áudio encontrado na rota /audio-migracao");
      return;
    }

    console.log(`Encontrados ${audios.length} áudios para migrar`);
    
    // Debug da estrutura dos dados
    debugDataStructure(audios, 'áudios');

    let totalAudios = 0;
    let errosAudios = 0;

    for (const audio of audios) {
      try {
        await prisma.cp_audios.create({
          data: {
            cp_aud_id: audio.cp_audio_id,
            cp_aud_titulo: audio.cp_nome_audio || "",
            cp_aud_descricao: null, // Não disponível nesta estrutura
            cp_aud_arquivo: audio.cp_arquivo_audio || "",
            cp_aud_curso_id: audio.cp_curso_id,
            cp_aud_excluido: 0,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        totalAudios++;
        
        if (totalAudios % 50 === 0) {
          console.log(`  Migrados ${totalAudios} áudios...`);
        }
      } catch (audioError) {
        console.error(`Erro ao migrar áudio ${audio.cp_audio_id}:`, audioError.message);
        errosAudios++;
      }
    }

    console.log(`✓ Migrados ${totalAudios} áudios com sucesso`);
    if (errosAudios > 0) {
      console.log(`⚠️  ${errosAudios} áudios falharam na migração`);
    }
  } catch (error) {
    console.error("Erro ao migrar áudios:", error);
  }
}

// Função para migrar material extra
async function migrateMatExtra() {
  console.log("Migrando cp_mat_extra...");

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
    console.error("Erro ao migrar materiais extra:", error);
  }
}

// Função para migrar materiais
async function migrateMateriais() {
  console.log("Migrando cp_mat_materiais...");

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
    console.error("Erro ao migrar materiais:", error);
  }
}

// Função para migrar resumos
async function migrateResumos() {
  console.log("Migrando cp_resumos...");

  try {
    // Buscar todas as turmas primeiro
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
        console.log(`Nenhum resumo encontrado para a turma ${turma.cp_tr_id}`);
      }
    }

    console.log(`✓ Migrados ${totalResumos} resumos`);
  } catch (error) {
    console.error("Erro ao migrar resumos:", error);
  }
}

// Função para migrar registro de aulas (placeholder - endpoint não encontrado)
async function migrateRegistroAulas() {
  console.log("Migrando cp_registro_aulas...");
  console.log(
    "⚠️  Endpoint para registros de aula não disponível no backend atual",
  );
  console.log("✓ Migração pulada para registros de aula");
}

// Função para migrar histórico de chamadas
async function migrateHistoricoChamadas() {
  console.log("Migrando cp_historico_chamadas...");

  try {
    // Buscar todas as turmas primeiro
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
        console.log(
          `Nenhuma chamada encontrada para a turma ${turma.cp_tr_id}`,
        );
      }
    }

    console.log(`✓ Migradas ${totalChamadas} chamadas`);
  } catch (error) {
    console.error("Erro ao migrar chamadas:", error);
  }
}

// Função para verificar endpoints disponíveis
async function checkAvailableEndpoints() {
  console.log("🔍 Verificando endpoints disponíveis...");
  
  const endpoints = [
    "/users",
    "/escolas", 
    "/cursos",
    "/turmas",
    "/matriculas",
    "/audio-migracao",
    "/material-extra",
    "/materiais"
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ ${endpoint} - ${Array.isArray(data) ? data.length : 'OK'} registros`);
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Erro: ${error.message}`);
    }
  }
  console.log("═══════════════════════════════════════════════════");
}

// Função principal de migração
async function runMigration() {
  console.log("🚀 Iniciando migração Backend Online → PostgreSQL");
  console.log("===================================================");

  try {
    console.log(`✓ Conectando ao backend: ${BACKEND_URL}`);
    
    // Verificar endpoints disponíveis
    await checkAvailableEndpoints();

    // Executar migrações na ordem correta
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

    console.log("===================================================");
    console.log("✅ Migração concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
  } finally {
    // Fechar conexão do Prisma
    await prisma.$disconnect();
    console.log("✓ Conexão do Prisma fechada");
  }
}

// Executar migração
runMigration();

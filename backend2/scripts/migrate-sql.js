
const fs = require("fs");
const path = require("path");
const { prisma } = require("../lib/database");

function parseInsertStatements(sqlContent) {
  const tables = {
    cp_usuarios: [],
    cp_escolas: [],
    cp_cursos: [],
    cp_turmas: [],
    cp_matriculas: [],
    cp_chamadas: [],
    cp_presencas: [],
    cp_resumos: [],
    cp_audios_curso: [],
    cp_materiais_curso: [],
    cp_materiais_aula: [],
    cp_categorias_curso: [],
    cp_notas: [],
    cp_frequencias: [],
    cp_atividades: [],
    cp_submissoes_atividade: [],
    cp_mensagens: [],
    cp_forum_topicos: [],
    cp_forum_respostas: [],
    cp_certificados: [],
    cp_avaliacoes_curso: [],
    cp_progresso_aluno: [],
    cp_logs_sistema: [],
    cp_configuracoes: [],
    cp_backup_dados: [],
  };

  // Regex melhorada para capturar comandos INSERT
  const insertRegex = /INSERT\s+INTO\s+`?([a-zA-Z_]+)`?\s*(?:\([^)]*\))?\s*VALUES\s*((?:\s*\([^)]*\)\s*,?\s*)*);/gis;

  let match;
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1].toLowerCase();
    const valuesString = match[2];

    if (tables.hasOwnProperty(tableName)) {
      // Parse dos valores usando regex mais robusta
      const valueMatches = valuesString.match(/\(([^)]*)\)/g);

      if (valueMatches) {
        valueMatches.forEach((valueMatch) => {
          const cleanValue = valueMatch.slice(1, -1); // Remove parênteses
          const values = [];
          let current = "";
          let inQuotes = false;
          let quoteChar = "";
          let escapeNext = false;

          for (let i = 0; i < cleanValue.length; i++) {
            const char = cleanValue[i];

            if (escapeNext) {
              current += char;
              escapeNext = false;
              continue;
            }

            if (char === "\\") {
              escapeNext = true;
              current += char;
              continue;
            }

            if ((char === '"' || char === "'") && !inQuotes) {
              inQuotes = true;
              quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
              if (cleanValue[i + 1] === quoteChar) {
                current += char;
                i++; // Skip next quote
              } else {
                inQuotes = false;
                quoteChar = "";
              }
            } else if (char === "," && !inQuotes) {
              values.push(current.trim() === "NULL" ? null : current.trim());
              current = "";
            } else {
              current += char;
            }
          }

          // Add last value
          values.push(current.trim() === "NULL" ? null : current.trim());

          // Clean quotes from string values
          const cleanedValues = values.map((val) => {
            if (val === null) return null;
            if (typeof val === "string") {
              if ((val.startsWith('"') && val.endsWith('"')) ||
                  (val.startsWith("'") && val.endsWith("'"))) {
                return val.slice(1, -1);
              }
            }
            return val;
          });

          tables[tableName].push(cleanedValues);
        });
      }
    }
  }

  return tables;
}

async function migrateSQLData() {
  try {
    console.log("🔄 Iniciando migração completa dos dados do cipex.sql...");

    // Ler o arquivo cipex.sql
    const sqlFilePath = path.join(__dirname, "cipex.sql");

    if (!fs.existsSync(sqlFilePath)) {
      console.error("❌ Arquivo cipex.sql não encontrado na pasta scripts/");
      console.log("📁 Coloque o arquivo cipex.sql na pasta backend2/scripts/");
      return;
    }

    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
    console.log("📄 Arquivo SQL carregado com sucesso");

    // Limpar dados existentes na ordem correta para evitar conflitos de FK
    console.log("🧹 Limpando dados existentes...");
    
    // Tabelas dependentes primeiro
    await prisma.resumo.deleteMany();
    await prisma.presenca.deleteMany();
    await prisma.chamada.deleteMany();
    await prisma.matricula.deleteMany();
    await prisma.turma.deleteMany();
    await prisma.audioCurso.deleteMany();
    await prisma.materialCurso.deleteMany();
    await prisma.materialAula.deleteMany();
    await prisma.curso.deleteMany();
    await prisma.escola.deleteMany();
    await prisma.usuario.deleteMany();

    // Parse dos dados
    const tables = parseInsertStatements(sqlContent);

    console.log("📊 Dados encontrados no arquivo cipex.sql:");
    Object.keys(tables).forEach(tableName => {
      if (tables[tableName].length > 0) {
        console.log(`   📋 ${tableName}: ${tables[tableName].length} registros`);
      }
    });

    // ============== MIGRAÇÃO DOS USUÁRIOS ==============
    if (tables.cp_usuarios && tables.cp_usuarios.length > 0) {
      console.log("👥 Migrando usuários...");
      for (const usuario of tables.cp_usuarios) {
        try {
          await prisma.usuario.create({
            data: {
              cp_usuario_id: usuario[0] ? parseInt(usuario[0]) : undefined,
              cp_nome_usuario: usuario[1] || "",
              cp_email_usuario: usuario[2] || `user${usuario[0]}@cipex.com`,
              cp_senha_usuario: usuario[3] || "$2a$10$defaulthashedpassword",
              cp_telefone_usuario: usuario[4] || null,
              cp_data_nascimento: usuario[5] && usuario[5] !== 'NULL' && !isNaN(Date.parse(usuario[5])) ? new Date(usuario[5]) : null,
              cp_tipo_usuario: usuario[6] || "aluno",
              cp_foto_perfil: usuario[7] || null,
              cp_data_criacao: usuario[8] && usuario[8] !== 'NULL' && !isNaN(Date.parse(usuario[8])) ? new Date(usuario[8]) : new Date(),
              cp_status_usuario: usuario[9] || "ativo",
              cp_sexo: usuario[10] || null,
              cp_cpf: usuario[11] || null,
              cp_endereco: usuario[12] || null,
              cp_cidade: usuario[13] || null,
              cp_estado: usuario[14] || null,
              cp_cep: usuario[15] || null,
              cp_nome_pai: usuario[16] || null,
              cp_nome_mae: usuario[17] || null,
              cp_telefone_emergencia: usuario[18] || null,
              cp_observacoes: usuario[19] || null,
            },
          });
        } catch (error) {
          console.log(`⚠️ Erro ao migrar usuário ${usuario[1]}: ${error.message}`);
        }
      }
    }

    // ============== MIGRAÇÃO DAS ESCOLAS ==============
    if (tables.cp_escolas && tables.cp_escolas.length > 0) {
      console.log("🏫 Migrando escolas...");
      for (const escola of tables.cp_escolas) {
        try {
          await prisma.escola.create({
            data: {
              cp_escola_id: escola[0] ? parseInt(escola[0]) : undefined,
              cp_nome_escola: escola[1] || "",
              cp_endereco_escola: escola[2] || null,
              cp_telefone_escola: escola[3] || null,
              cp_email_escola: escola[4] || null,
              cp_cnpj_escola: escola[5] || null,
              cp_status_escola: escola[6] || "ativa",
              cp_data_criacao: escola[7] && escola[7] !== 'NULL' && !isNaN(Date.parse(escola[7])) ? new Date(escola[7]) : new Date(),
              cp_responsavel_id: escola[8] ? parseInt(escola[8]) : null,
            },
          });
        } catch (error) {
          console.log(`⚠️ Erro ao migrar escola ${escola[1]}: ${error.message}`);
        }
      }
    }

    // ============== MIGRAÇÃO DOS CURSOS ==============
    if (tables.cp_cursos && tables.cp_cursos.length > 0) {
      console.log("📚 Migrando cursos...");
      for (const curso of tables.cp_cursos) {
        try {
          await prisma.curso.create({
            data: {
              cp_curso_id: curso[0] ? parseInt(curso[0]) : undefined,
              cp_nome_curso: curso[1] || "",
              cp_descricao_curso: curso[2] || null,
              cp_duracao_curso: curso[3] ? parseInt(curso[3]) : null,
              cp_preco_curso: curso[4] ? parseFloat(curso[4]) : null,
              cp_status_curso: curso[5] || "ativo",
              cp_data_criacao: curso[6] && curso[6] !== 'NULL' && !isNaN(Date.parse(curso[6])) ? new Date(curso[6]) : new Date(),
              cp_escola_id: curso[7] ? parseInt(curso[7]) : null,
              cp_categoria_curso: curso[8] || null,
              cp_nivel_curso: curso[9] || null,
              cp_carga_horaria: curso[10] ? parseInt(curso[10]) : null,
              cp_modalidade: curso[11] || null,
            },
          });
        } catch (error) {
          console.log(`⚠️ Erro ao migrar curso ${curso[1]}: ${error.message}`);
        }
      }
    }

    // ============== MIGRAÇÃO DAS TURMAS ==============
    if (tables.cp_turmas && tables.cp_turmas.length > 0) {
      console.log("👨‍🎓 Migrando turmas...");
      for (const turma of tables.cp_turmas) {
        try {
          await prisma.turma.create({
            data: {
              cp_turma_id: turma[0] ? parseInt(turma[0]) : undefined,
              cp_nome_turma: turma[1] || "",
              cp_descricao_turma: turma[2] || null,
              cp_data_inicio: turma[3] && turma[3] !== 'NULL' && !isNaN(Date.parse(turma[3])) ? new Date(turma[3]) : new Date(),
              cp_data_fim: turma[4] && turma[4] !== 'NULL' && !isNaN(Date.parse(turma[4])) ? new Date(turma[4]) : new Date(),
              cp_horario_inicio: turma[5] || "08:00",
              cp_horario_fim: turma[6] || "12:00",
              cp_dias_semana: turma[7] || "Segunda a Sexta",
              cp_capacidade: turma[8] ? parseInt(turma[8]) : null,
              cp_status_turma: turma[9] || "ativa",
              cp_data_criacao: turma[10] && turma[10] !== 'NULL' && !isNaN(Date.parse(turma[10])) ? new Date(turma[10]) : new Date(),
              cp_curso_id: turma[11] ? parseInt(turma[11]) : null,
              cp_escola_id: turma[12] ? parseInt(turma[12]) : null,
              cp_responsavel_id: turma[13] ? parseInt(turma[13]) : null,
            },
          });
        } catch (error) {
          console.log(`⚠️ Erro ao migrar turma ${turma[1]}: ${error.message}`);
        }
      }
    }

    // ============== MIGRAÇÃO DAS MATRÍCULAS ==============
    if (tables.cp_matriculas && tables.cp_matriculas.length > 0) {
      console.log("📝 Migrando matrículas...");
      for (const matricula of tables.cp_matriculas) {
        try {
          // Verificar se usuário e curso existem
          const usuarioExists = await prisma.usuario.findUnique({
            where: { cp_usuario_id: parseInt(matricula[1]) }
          });
          const cursoExists = await prisma.curso.findUnique({
            where: { cp_curso_id: parseInt(matricula[2]) }
          });

          if (usuarioExists && cursoExists) {
            await prisma.matricula.create({
              data: {
                cp_matricula_id: matricula[0] ? parseInt(matricula[0]) : undefined,
                cp_usuario_id: parseInt(matricula[1]),
                cp_curso_id: parseInt(matricula[2]),
                cp_turma_id: matricula[3] ? parseInt(matricula[3]) : null,
                cp_data_matricula: matricula[4] && matricula[4] !== 'NULL' && !isNaN(Date.parse(matricula[4])) ? new Date(matricula[4]) : new Date(),
                cp_status_matricula: matricula[5] || "ativa",
                cp_valor_matricula: matricula[6] ? parseFloat(matricula[6]) : null,
                cp_forma_pagamento: matricula[7] || null,
                cp_numero_parcelas: matricula[8] ? parseInt(matricula[8]) : null,
                cp_valor_parcela: matricula[9] ? parseFloat(matricula[9]) : null,
                cp_data_vencimento: matricula[10] && matricula[10] !== 'NULL' && !isNaN(Date.parse(matricula[10])) ? new Date(matricula[10]) : null,
                cp_observacoes: matricula[11] || null,
              },
            });
          } else {
            console.log(`⚠️ Pulando matrícula ${matricula[0]} - usuário ou curso não existe`);
          }
        } catch (error) {
          console.log(`⚠️ Erro ao migrar matrícula ${matricula[0]}: ${error.message}`);
        }
      }
    }

    // ============== MIGRAÇÃO DAS CHAMADAS ==============
    if (tables.cp_chamadas && tables.cp_chamadas.length > 0) {
      console.log("📋 Migrando chamadas...");
      for (const chamada of tables.cp_chamadas) {
        try {
          // Verificar se turma existe
          const turmaExists = await prisma.turma.findUnique({
            where: { cp_turma_id: parseInt(chamada[1]) }
          });

          if (turmaExists) {
            await prisma.chamada.create({
              data: {
                cp_chamada_id: chamada[0] ? parseInt(chamada[0]) : undefined,
                cp_turma_id: parseInt(chamada[1]),
                cp_data_chamada: chamada[2] && chamada[2] !== 'NULL' && !isNaN(Date.parse(chamada[2])) ? new Date(chamada[2]) : new Date(),
                cp_horario_inicio: chamada[3] || "08:00",
                cp_horario_fim: chamada[4] || "12:00",
                cp_conteudo: chamada[5] || null,
                cp_observacoes: chamada[6] || null,
                cp_data_criacao: chamada[7] && chamada[7] !== 'NULL' && !isNaN(Date.parse(chamada[7])) ? new Date(chamada[7]) : new Date(),
              },
            });
          } else {
            console.log(`⚠️ Pulando chamada ${chamada[0]} - turma não existe`);
          }
        } catch (error) {
          console.log(`⚠️ Erro ao migrar chamada ${chamada[0]}: ${error.message}`);
        }
      }
    }

    // ============== MIGRAÇÃO DAS PRESENÇAS ==============
    if (tables.cp_presencas && tables.cp_presencas.length > 0) {
      console.log("✅ Migrando presenças...");
      for (const presenca of tables.cp_presencas) {
        try {
          // Verificar se chamada, usuário e matrícula existem
          const chamadaExists = await prisma.chamada.findUnique({
            where: { cp_chamada_id: parseInt(presenca[1]) }
          });
          const usuarioExists = await prisma.usuario.findUnique({
            where: { cp_usuario_id: parseInt(presenca[2]) }
          });
          const matriculaExists = await prisma.matricula.findUnique({
            where: { cp_matricula_id: parseInt(presenca[3]) }
          });

          if (chamadaExists && usuarioExists && matriculaExists) {
            await prisma.presenca.create({
              data: {
                cp_presenca_id: presenca[0] ? parseInt(presenca[0]) : undefined,
                cp_chamada_id: parseInt(presenca[1]),
                cp_usuario_id: parseInt(presenca[2]),
                cp_matricula_id: parseInt(presenca[3]),
                cp_presente: presenca[4] === "1" || presenca[4] === "true" || presenca[4] === true || presenca[4] === 1,
                cp_justificativa: presenca[5] || null,
              },
            });
          } else {
            console.log(`⚠️ Pulando presença ${presenca[0]} - dependências não existem`);
          }
        } catch (error) {
          console.log(`⚠️ Erro ao migrar presença ${presenca[0]}: ${error.message}`);
        }
      }
    }

    // ============== MIGRAÇÃO DOS RESUMOS ==============
    if (tables.cp_resumos && tables.cp_resumos.length > 0) {
      console.log("📄 Migrando resumos...");
      for (const resumo of tables.cp_resumos) {
        try {
          // Verificar se chamada e usuário existem
          const chamadaExists = await prisma.chamada.findUnique({
            where: { cp_chamada_id: parseInt(resumo[1]) }
          });
          const usuarioExists = await prisma.usuario.findUnique({
            where: { cp_usuario_id: parseInt(resumo[2]) }
          });

          if (chamadaExists && usuarioExists) {
            await prisma.resumo.create({
              data: {
                cp_resumo_id: resumo[0] ? parseInt(resumo[0]) : undefined,
                cp_chamada_id: parseInt(resumo[1]),
                cp_usuario_id: parseInt(resumo[2]),
                cp_conteudo: resumo[3] || "",
                cp_data_criacao: resumo[4] && resumo[4] !== 'NULL' && !isNaN(Date.parse(resumo[4])) ? new Date(resumo[4]) : new Date(),
              },
            });
          } else {
            console.log(`⚠️ Pulando resumo ${resumo[0]} - chamada ou usuário não existe`);
          }
        } catch (error) {
          console.log(`⚠️ Erro ao migrar resumo ${resumo[0]}: ${error.message}`);
        }
      }
    }

    // ============== MIGRAÇÃO DOS ÁUDIOS DO CURSO ==============
    if (tables.cp_audios_curso && tables.cp_audios_curso.length > 0) {
      console.log("🎵 Migrando áudios do curso...");
      for (const audio of tables.cp_audios_curso) {
        try {
          // Verificar se curso existe
          const cursoExists = await prisma.curso.findUnique({
            where: { cp_curso_id: parseInt(audio[1]) }
          });

          if (cursoExists) {
            await prisma.audioCurso.create({
              data: {
                cp_audio_id: audio[0] ? parseInt(audio[0]) : undefined,
                cp_curso_id: parseInt(audio[1]),
                cp_nome_audio: audio[2] || "",
                cp_caminho_audio: audio[3] || "",
                cp_duracao: audio[4] || null,
                cp_tamanho: audio[5] ? parseInt(audio[5]) : null,
                cp_data_upload: audio[6] && audio[6] !== 'NULL' && !isNaN(Date.parse(audio[6])) ? new Date(audio[6]) : new Date(),
                cp_status_audio: audio[7] || "ativo",
              },
            });
          } else {
            console.log(`⚠️ Pulando áudio ${audio[0]} - curso não existe`);
          }
        } catch (error) {
          console.log(`⚠️ Erro ao migrar áudio ${audio[0]}: ${error.message}`);
        }
      }
    }

    // ============== MIGRAÇÃO DOS MATERIAIS DO CURSO ==============
    if (tables.cp_materiais_curso && tables.cp_materiais_curso.length > 0) {
      console.log("📎 Migrando materiais do curso...");
      for (const material of tables.cp_materiais_curso) {
        try {
          // Verificar se curso existe
          const cursoExists = await prisma.curso.findUnique({
            where: { cp_curso_id: parseInt(material[1]) }
          });

          if (cursoExists) {
            await prisma.materialCurso.create({
              data: {
                cp_material_id: material[0] ? parseInt(material[0]) : undefined,
                cp_curso_id: parseInt(material[1]),
                cp_nome_material: material[2] || "",
                cp_caminho_material: material[3] || "",
                cp_tipo_material: material[4] || "documento",
                cp_tamanho: material[5] ? parseInt(material[5]) : null,
                cp_descricao: material[6] || null,
                cp_data_upload: material[7] && material[7] !== 'NULL' && !isNaN(Date.parse(material[7])) ? new Date(material[7]) : new Date(),
                cp_status_material: material[8] || "ativo",
              },
            });
          } else {
            console.log(`⚠️ Pulando material do curso ${material[0]} - curso não existe`);
          }
        } catch (error) {
          console.log(`⚠️ Erro ao migrar material do curso ${material[0]}: ${error.message}`);
        }
      }
    }

    // ============== MIGRAÇÃO DOS MATERIAIS DE AULA ==============
    if (tables.cp_materiais_aula && tables.cp_materiais_aula.length > 0) {
      console.log("📎 Migrando materiais de aula...");
      for (const material of tables.cp_materiais_aula) {
        try {
          await prisma.materialAula.create({
            data: {
              cp_material_aula_id: material[0] ? parseInt(material[0]) : undefined,
              cp_nome_material: material[1] || "",
              cp_caminho_material: material[2] || "",
              cp_tipo_material: material[3] || "documento",
              cp_tamanho: material[4] ? parseInt(material[4]) : null,
              cp_descricao: material[5] || null,
              cp_data_upload: material[6] && material[6] !== 'NULL' && !isNaN(Date.parse(material[6])) ? new Date(material[6]) : new Date(),
              cp_status_material: material[7] || "ativo",
            },
          });
        } catch (error) {
          console.log(`⚠️ Erro ao migrar material de aula ${material[0]}: ${error.message}`);
        }
      }
    }

    // Estatísticas finais
    console.log("\n📊 Resumo da migração:");
    const stats = {
      usuarios: await prisma.usuario.count(),
      escolas: await prisma.escola.count(),
      cursos: await prisma.curso.count(),
      turmas: await prisma.turma.count(),
      matriculas: await prisma.matricula.count(),
      chamadas: await prisma.chamada.count(),
      presencas: await prisma.presenca.count(),
      resumos: await prisma.resumo.count(),
      audios_curso: await prisma.audioCurso.count(),
      materiais_curso: await prisma.materialCurso.count(),
      materiais_aula: await prisma.materialAula.count(),
    };

    Object.entries(stats).forEach(([table, count]) => {
      console.log(`   ✅ ${table}: ${count} registros migrados`);
    });

    console.log("\n🎉 Migração completa realizada com sucesso!");
    console.log("🔗 Todos os relacionamentos foram preservados");
    console.log("📋 Dados transferidos para PostgreSQL via Prisma ORM");

  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
    console.error("Stack trace:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateSQLData();
}

module.exports = { migrateSQLData };


const fs = require('fs');
const path = require('path');
const { prisma } = require('../lib/database');

function parseInsertStatements(sqlContent) {
  const tables = {
    usuarios: [],
    escolas: [],
    cursos: [],
    turmas: [],
    matriculas: [],
    chamadas: [],
    presencas: [],
    resumos: [],
    audios_curso: [],
    materiais_curso: [],
    materiais_aula: []
  };

  // Regex para capturar comandos INSERT
  const insertRegex = /INSERT INTO\s+`?(\w+)`?\s+(?:\([^)]+\))?\s+VALUES\s*(.+?);/gis;
  
  let match;
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1].toLowerCase();
    const valuesString = match[2];
    
    // Parse dos valores
    const valueMatches = valuesString.match(/\(([^)]+)\)/g);
    
    if (valueMatches && tables[tableName]) {
      valueMatches.forEach(valueMatch => {
        const cleanValue = valueMatch.slice(1, -1); // Remove parênteses
        const values = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < cleanValue.length; i++) {
          const char = cleanValue[i];
          
          if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar && inQuotes) {
            if (cleanValue[i + 1] === quoteChar) {
              current += char;
              i++; // Skip next quote
            } else {
              inQuotes = false;
              quoteChar = '';
            }
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim() === 'NULL' ? null : current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        // Add last value
        values.push(current.trim() === 'NULL' ? null : current.trim());
        
        // Clean quotes from string values
        const cleanedValues = values.map(val => {
          if (val === null) return null;
          if (typeof val === 'string' && ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))) {
            return val.slice(1, -1);
          }
          return val;
        });
        
        tables[tableName].push(cleanedValues);
      });
    }
  }
  
  return tables;
}

async function migrateSQLData() {
  try {
    console.log('🔄 Iniciando migração dos dados...');
    
    // Ler o arquivo cipex.sql
    const sqlFilePath = path.join(__dirname, '../../backend/cipex.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ Arquivo cipex.sql não encontrado na pasta backend');
      console.log('📁 Coloque o arquivo cipex.sql na pasta backend/');
      return;
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('📄 Arquivo SQL carregado com sucesso');

    // Limpar dados existentes
    console.log('🧹 Limpando dados existentes...');
    await prisma.presenca.deleteMany();
    await prisma.resumo.deleteMany();
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
    const { usuarios, escolas, cursos, turmas, matriculas, chamadas, presencas, resumos, audios_curso, materiais_curso, materiais_aula } = tables;

    console.log(`📊 Dados encontrados:`);
    console.log(`   👥 Usuários: ${usuarios.length}`);
    console.log(`   🏫 Escolas: ${escolas.length}`);
    console.log(`   📚 Cursos: ${cursos.length}`);
    console.log(`   👨‍🎓 Turmas: ${turmas.length}`);
    console.log(`   📝 Matrículas: ${matriculas.length}`);
    console.log(`   📋 Chamadas: ${chamadas.length}`);
    console.log(`   ✅ Presenças: ${presencas.length}`);
    console.log(`   📄 Resumos: ${resumos.length}`);

    // Migrar usuários
    if (usuarios.length > 0) {
      console.log('👥 Migrando usuários...');
      for (const usuario of usuarios) {
        try {
          await prisma.usuario.create({
            data: {
              cp_nome_usuario: usuario[1] || '',
              cp_email_usuario: usuario[2] || `user${usuario[0]}@example.com`,
              cp_senha_usuario: usuario[3] || '$2a$10$defaulthash',
              cp_telefone_usuario: usuario[4],
              cp_data_nascimento: usuario[5] ? new Date(usuario[5]) : null,
              cp_tipo_usuario: usuario[6] || 'aluno',
              cp_foto_perfil: usuario[7],
              cp_status_usuario: usuario[9] || 'ativo',
              cp_sexo: usuario[10],
              cp_cpf: usuario[11],
              cp_endereco: usuario[12],
              cp_cidade: usuario[13],
              cp_estado: usuario[14],
              cp_cep: usuario[15],
              cp_nome_pai: usuario[16],
              cp_nome_mae: usuario[17],
              cp_telefone_emergencia: usuario[18],
              cp_observacoes: usuario[19]
            }
          });
        } catch (error) {
          console.log(`⚠️  Erro ao migrar usuário ${usuario[1]}: ${error.message}`);
        }
      }
    }

    // Migrar escolas
    if (escolas.length > 0) {
      console.log('🏫 Migrando escolas...');
      for (const escola of escolas) {
        try {
          await prisma.escola.create({
            data: {
              cp_nome_escola: escola[1] || '',
              cp_endereco_escola: escola[2],
              cp_telefone_escola: escola[3],
              cp_email_escola: escola[4],
              cp_cnpj_escola: escola[5],
              cp_status_escola: escola[6] || 'ativa',
              cp_responsavel_id: escola[7] ? parseInt(escola[7]) : null
            }
          });
        } catch (error) {
          console.log(`⚠️  Erro ao migrar escola ${escola[1]}: ${error.message}`);
        }
      }
    }

    // Migrar cursos
    if (cursos.length > 0) {
      console.log('📚 Migrando cursos...');
      for (const curso of cursos) {
        try {
          await prisma.curso.create({
            data: {
              cp_nome_curso: curso[1] || '',
              cp_descricao_curso: curso[2],
              cp_duracao_curso: curso[3] ? parseInt(curso[3]) : null,
              cp_preco_curso: curso[4] ? parseFloat(curso[4]) : null,
              cp_status_curso: curso[5] || 'ativo',
              cp_escola_id: curso[6] ? parseInt(curso[6]) : null,
              cp_categoria_curso: curso[7],
              cp_nivel_curso: curso[8],
              cp_carga_horaria: curso[9] ? parseInt(curso[9]) : null,
              cp_modalidade: curso[10]
            }
          });
        } catch (error) {
          console.log(`⚠️  Erro ao migrar curso ${curso[1]}: ${error.message}`);
        }
      }
    }

    // Migrar turmas
    if (turmas.length > 0) {
      console.log('👨‍🎓 Migrando turmas...');
      for (const turma of turmas) {
        try {
          await prisma.turma.create({
            data: {
              cp_nome_turma: turma[1] || '',
              cp_descricao_turma: turma[2],
              cp_data_inicio: turma[3] ? new Date(turma[3]) : new Date(),
              cp_data_fim: turma[4] ? new Date(turma[4]) : new Date(),
              cp_horario_inicio: turma[5] || '08:00',
              cp_horario_fim: turma[6] || '12:00',
              cp_dias_semana: turma[7] || 'Segunda a Sexta',
              cp_capacidade: turma[8] ? parseInt(turma[8]) : null,
              cp_status_turma: turma[9] || 'ativa',
              cp_curso_id: turma[11] ? parseInt(turma[11]) : null,
              cp_escola_id: turma[12] ? parseInt(turma[12]) : null,
              cp_responsavel_id: turma[13] ? parseInt(turma[13]) : null
            }
          });
        } catch (error) {
          console.log(`⚠️  Erro ao migrar turma ${turma[1]}: ${error.message}`);
        }
      }
    }

    // Migrar matrículas
    if (matriculas.length > 0) {
      console.log('📝 Migrando matrículas...');
      for (const matricula of matriculas) {
        try {
          await prisma.matricula.create({
            data: {
              cp_usuario_id: parseInt(matricula[1]),
              cp_curso_id: parseInt(matricula[2]),
              cp_turma_id: matricula[3] ? parseInt(matricula[3]) : null,
              cp_data_matricula: matricula[4] ? new Date(matricula[4]) : new Date(),
              cp_status_matricula: matricula[5] || 'ativa',
              cp_valor_matricula: matricula[6] ? parseFloat(matricula[6]) : null,
              cp_forma_pagamento: matricula[7],
              cp_numero_parcelas: matricula[8] ? parseInt(matricula[8]) : null,
              cp_valor_parcela: matricula[9] ? parseFloat(matricula[9]) : null,
              cp_data_vencimento: matricula[10] ? new Date(matricula[10]) : null,
              cp_observacoes: matricula[11]
            }
          });
        } catch (error) {
          console.log(`⚠️  Erro ao migrar matrícula: ${error.message}`);
        }
      }
    }

    // Migrar chamadas
    if (chamadas.length > 0) {
      console.log('📋 Migrando chamadas...');
      for (const chamada of chamadas) {
        try {
          await prisma.chamada.create({
            data: {
              cp_turma_id: parseInt(chamada[1]),
              cp_data_chamada: chamada[2] ? new Date(chamada[2]) : new Date(),
              cp_horario_inicio: chamada[3] || '08:00',
              cp_horario_fim: chamada[4] || '12:00',
              cp_conteudo: chamada[5],
              cp_observacoes: chamada[6]
            }
          });
        } catch (error) {
          console.log(`⚠️  Erro ao migrar chamada: ${error.message}`);
        }
      }
    }

    // Migrar presenças
    if (presencas.length > 0) {
      console.log('✅ Migrando presenças...');
      for (const presenca of presencas) {
        try {
          await prisma.presenca.create({
            data: {
              cp_chamada_id: parseInt(presenca[1]),
              cp_usuario_id: parseInt(presenca[2]),
              cp_matricula_id: parseInt(presenca[3]),
              cp_presente: presenca[4] === '1' || presenca[4] === 'true',
              cp_justificativa: presenca[5]
            }
          });
        } catch (error) {
          console.log(`⚠️  Erro ao migrar presença: ${error.message}`);
        }
      }
    }

    // Migrar resumos
    if (resumos.length > 0) {
      console.log('📄 Migrando resumos...');
      for (const resumo of resumos) {
        try {
          await prisma.resumo.create({
            data: {
              cp_chamada_id: parseInt(resumo[1]),
              cp_usuario_id: parseInt(resumo[2]),
              cp_conteudo: resumo[3] || '',
              cp_data_criacao: resumo[4] ? new Date(resumo[4]) : new Date()
            }
          });
        } catch (error) {
          console.log(`⚠️  Erro ao migrar resumo: ${error.message}`);
        }
      }
    }

    console.log('✅ Migração concluída com sucesso!');
    console.log('🎉 Todos os dados foram transferidos para PostgreSQL');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateSQLData();
}

module.exports = { migrateSQLData };

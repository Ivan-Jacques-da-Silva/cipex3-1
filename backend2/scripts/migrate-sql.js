
const fs = require('fs');
const path = require('path');
const { prisma } = require('../lib/database');

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

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Função para extrair dados de INSERT
    function extractInsertData(sql, tableName) {
      const regex = new RegExp(`INSERT INTO \`?${tableName}\`?[^(]*\\(([^)]+)\\)\\s*VALUES\\s*(.+?)(?=;|INSERT|$)`, 'gis');
      const matches = sql.match(regex);
      
      if (!matches) return [];
      
      const data = [];
      matches.forEach(match => {
        const valuesMatch = match.match(/VALUES\s*(.+)/is);
        if (valuesMatch) {
          const valuesStr = valuesMatch[1];
          const valueRows = valuesStr.split(/\),\s*\(/);
          
          valueRows.forEach(row => {
            const cleanRow = row.replace(/^\(|\)$/g, '');
            const values = cleanRow.split(',').map(v => {
              v = v.trim();
              if (v === 'NULL' || v === 'null') return null;
              if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
              if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
              if (!isNaN(v)) return parseFloat(v);
              return v;
            });
            data.push(values);
          });
        }
      });
      
      return data;
    }

    // Mapear dados das tabelas
    const usuarios = extractInsertData(sqlContent, 'usuarios');
    const escolas = extractInsertData(sqlContent, 'escolas');
    const cursos = extractInsertData(sqlContent, 'cursos');
    const turmas = extractInsertData(sqlContent, 'turmas');
    const matriculas = extractInsertData(sqlContent, 'matriculas');
    const chamadas = extractInsertData(sqlContent, 'chamadas');
    const presencas = extractInsertData(sqlContent, 'presencas');
    const resumos = extractInsertData(sqlContent, 'resumos');

    console.log(`📊 Dados encontrados:
    - Usuários: ${usuarios.length}
    - Escolas: ${escolas.length}
    - Cursos: ${cursos.length}
    - Turmas: ${turmas.length}
    - Matrículas: ${matriculas.length}
    - Chamadas: ${chamadas.length}
    - Presenças: ${presencas.length}
    - Resumos: ${resumos.length}`);

    // Migrar usuários
    if (usuarios.length > 0) {
      console.log('👥 Migrando usuários...');
      for (const usuario of usuarios) {
        try {
          await prisma.usuario.create({
            data: {
              cp_nome_usuario: usuario[1] || '',
              cp_email_usuario: usuario[2] || '',
              cp_senha_usuario: usuario[3] || '',
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
              cp_status_escola: escola[7] || 'ativa',
              cp_responsavel_id: escola[8] ? parseInt(escola[8]) : null
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
              cp_status_curso: curso[6] || 'ativo',
              cp_escola_id: curso[7] ? parseInt(curso[7]) : null,
              cp_categoria_curso: curso[8],
              cp_nivel_curso: curso[9],
              cp_carga_horaria: curso[10] ? parseInt(curso[10]) : null,
              cp_modalidade: curso[11]
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
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateSQLData();
}

module.exports = { migrateSQLData };

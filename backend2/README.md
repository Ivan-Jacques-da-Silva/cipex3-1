
# Backend2 - Migração para PostgreSQL com Prisma

## 📋 Pré-requisitos

- Node.js instalado
- Arquivo `cipex.sql` na pasta `backend/`
- Acesso ao Replit

## 🚀 Configuração Passo a Passo

### 1. Configurar PostgreSQL no Replit

1. **Abrir Database no Replit:**
   - Clique na aba lateral esquerda do Replit
   - Digite "Database" na busca
   - Clique em "Database"

2. **Criar banco PostgreSQL:**
   - Clique em "Create a database"
   - Selecione "PostgreSQL"
   - O banco será criado automaticamente
   - As variáveis de ambiente serão configuradas automaticamente

3. **Verificar variáveis de ambiente:**
   - Vá na aba "Secrets" (chave no menu lateral)
   - Verifique se existe `DATABASE_URL`
   - Deve começar com `postgresql://`

### 2. Configurar arquivo .env

O arquivo `.env` já foi criado. Verifique se contém:

```env
DATABASE_URL="sua_url_postgresql_aqui"
JWT_SECRET="seu-jwt-secret-super-seguro"
PORT=5000
NODE_ENV=development
```

⚠️ **IMPORTANTE:** Substitua `DATABASE_URL` pela URL do seu PostgreSQL do Replit se necessário.

### 3. Instalar dependências

```bash
cd backend2
npm install
```

### 4. Preparar o banco de dados

**Gerar cliente Prisma:**
```bash
npm run db:generate
```

**Aplicar schema ao banco:**
```bash
npm run db:push
```

**Verificar configuração:**
```bash
npm run db:setup
```

### 5. Migrar dados do MySQL

**Preparar arquivo SQL:**
1. Coloque o arquivo `cipex.sql` na pasta `backend/`
2. Certifique-se de que o arquivo contém comandos `INSERT INTO`

**Executar migração:**
```bash
npm run db:migrate-sql
```

Este comando irá:
- ✅ Ler o arquivo `cipex.sql`
- ✅ Extrair todos os dados das tabelas
- ✅ Converter tipos de dados para PostgreSQL
- ✅ Inserir dados mantendo relacionamentos
- ✅ Validar integridade dos dados

### 6. Iniciar o servidor

```bash
npm run dev
```

O servidor iniciará em: `http://localhost:5000`

## 🔧 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia servidor em produção |
| `npm run dev` | Inicia em modo desenvolvimento |
| `npm run db:generate` | Gera cliente Prisma |
| `npm run db:push` | Aplica schema ao banco |
| `npm run db:migrate` | Cria e aplica migrações |
| `npm run db:studio` | Interface visual do banco |
| `npm run db:setup` | Configura banco inicial |
| `npm run db:migrate-sql` | Migra dados do cipex.sql |

## 📊 Estrutura do Banco PostgreSQL

### Tabelas Migradas:

- **`usuarios`** - Dados dos usuários (alunos, professores, admin)
- **`escolas`** - Informações das escolas
- **`cursos`** - Cursos disponíveis
- **`turmas`** - Turmas das escolas
- **`matriculas`** - Matrículas dos alunos
- **`chamadas`** - Registro de chamadas/aulas
- **`presencas`** - Controle de presença dos alunos
- **`resumos`** - Resumos das aulas
- **`audios_curso`** - Arquivos de áudio dos cursos
- **`materiais_curso`** - Materiais dos cursos
- **`materiais_aula`** - Materiais das aulas

### Relacionamentos:

- Usuário → Matrículas
- Escola → Turmas → Cursos
- Turma → Chamadas → Presenças
- Chamada → Resumos

## 🌐 API Endpoints

### Autenticação
- `POST /login` - Login do usuário

### Usuários
- `GET /usuarios` - Listar usuários
- `GET /usuarios/:id` - Buscar usuário por ID
- `POST /usuarios` - Criar usuário
- `PUT /usuarios/:id` - Atualizar usuário
- `DELETE /usuarios/:id` - Deletar usuário

### Escolas
- `GET /escolas` - Listar escolas
- `POST /escolas` - Criar escola

### Cursos
- `GET /cursos` - Listar cursos
- `GET /cursos/:id` - Buscar curso por ID
- `POST /cursos` - Criar curso
- `POST /cursos/batch` - Buscar cursos por IDs

### Turmas
- `GET /turmas` - Listar turmas
- `GET /turmas-usuario/:userId` - Turmas do usuário
- `POST /turmas` - Criar turma

### Matrículas
- `GET /matriculas` - Listar matrículas
- `GET /matriculas-usuario/:userId` - Matrículas do usuário
- `POST /matriculas` - Criar matrícula

### Chamadas
- `GET /chamadas` - Listar chamadas
- `GET /chamadas-turma/:turmaId` - Chamadas da turma
- `POST /chamadas` - Criar chamada

### Resumos
- `GET /resumos` - Listar resumos
- `GET /resumos-chamada/:chamadaId` - Resumos da chamada
- `POST /resumos` - Criar resumo

### Áudios
- `GET /audios-curso/:cursoId` - Áudios do curso
- `POST /audios` - Upload de áudio

### Materiais
- `GET /materiais-curso/:cursoId` - Materiais do curso
- `GET /materiais-aula` - Materiais de aula
- `POST /materiais-curso` - Upload material do curso
- `POST /materiais-aula` - Upload material de aula

## 🔍 Verificar Migração

**Via Prisma Studio:**
```bash
npm run db:studio
```

**Via SQL Explorer (Replit):**
1. Vá em Database → SQL Explorer
2. Execute: `SELECT COUNT(*) FROM usuarios;`
3. Verifique se há dados

**Via API:**
```bash
# Testar login
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"cp_email_usuario":"admin@exemplo.com","cp_senha_usuario":"senha123"}'

# Listar usuários
curl http://localhost:5000/usuarios
```

## ❌ Solução de Problemas

### Erro de conexão
```bash
# Verificar conexão
npm run db:setup
```

### Erro na migração
```bash
# Limpar e recriar banco
npm run db:push --force-reset
npm run db:migrate-sql
```

### Dados não aparecem
```bash
# Verificar no Prisma Studio
npm run db:studio
```

### Porta ocupada
```bash
# Matar processo na porta 5000
pkill -f "node.*5000"
npm run dev
```

## 🔐 Segurança

- Senhas são criptografadas com bcrypt
- JWT para autenticação
- Validação de dados com Prisma
- CORS configurado
- Upload seguro de arquivos

## 📁 Uploads

Diretórios criados automaticamente:
- `uploads/FotoPerfil/` - Fotos de perfil
- `uploads/AudiosCurso/` - Áudios dos cursos
- `uploads/MaterialCurso/` - Materiais dos cursos
- `uploads/materialdeaula/` - Materiais das aulas

## 🎯 Próximos Passos

1. ✅ Configurar PostgreSQL
2. ✅ Instalar dependências
3. ✅ Migrar dados
4. ✅ Testar API
5. 🔄 Integrar com frontend
6. 🚀 Deploy na produção


# Backend2 - Migração para PostgreSQL com Prisma

## Configuração do Banco de Dados

### 1. Configurar PostgreSQL no Replit

1. No Replit, clique em "Database" na barra lateral
2. Clique em "Create a database"
3. Escolha PostgreSQL
4. As variáveis de ambiente serão automaticamente configuradas

### 2. Configurar arquivo .env

Atualize o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/cipex_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=5000
NODE_ENV=development
```

### 3. Instalar dependências

```bash
cd backend2
npm install
```

### 4. Gerar cliente Prisma

```bash
npm run db:generate
```

### 5. Aplicar schema ao banco

```bash
npm run db:push
```

### 6. Verificar configuração

```bash
npm run db:setup
```

## Migração de Dados

### 1. Preparar arquivo SQL

1. Coloque o arquivo `cipex.sql` na pasta `backend/`
2. Certifique-se de que o arquivo contém os dados no formato MySQL/MariaDB

### 2. Executar migração

```bash
npm run db:migrate-sql
```

Este script irá:
- Ler o arquivo `cipex.sql`
- Extrair dados das tabelas
- Converter e inserir no PostgreSQL
- Manter todos os relacionamentos

### 3. Verificar dados migrados

```bash
npm run db:studio
```

Ou acesse o banco diretamente via SQL Explorer no Replit.

## Scripts Disponíveis

- `npm start` - Inicia o servidor
- `npm run dev` - Inicia em modo desenvolvimento
- `npm run db:generate` - Gera cliente Prisma
- `npm run db:push` - Aplica schema ao banco
- `npm run db:migrate` - Cria e aplica migrações
- `npm run db:studio` - Interface visual do banco
- `npm run db:setup` - Configura banco inicial
- `npm run db:migrate-sql` - Migra dados do cipex.sql

## Estrutura do Banco

O schema mantém a mesma estrutura do MySQL original:

- `usuarios` - Dados dos usuários
- `escolas` - Informações das escolas
- `cursos` - Cursos disponíveis
- `turmas` - Turmas das escolas
- `matriculas` - Matrículas dos alunos
- `chamadas` - Registro de chamadas
- `presencas` - Controle de presença
- `resumos` - Resumos das aulas
- `audios_curso` - Arquivos de áudio
- `materiais_curso` - Materiais dos cursos
- `materiais_aula` - Materiais das aulas

## Diferenças do MySQL

1. **Tipos de dados**: Convertidos para tipos PostgreSQL
2. **IDs**: Mantidos como `SERIAL` (auto-increment)
3. **Relacionamentos**: Definidos via Prisma
4. **Índices**: Criados automaticamente pelo Prisma
5. **Constraints**: Mantidas e melhoradas

## Testando o Sistema

1. Inicie o servidor: `npm run dev`
2. Teste as rotas da API
3. Verifique os dados no Prisma Studio
4. Confirme que todos os relacionamentos funcionam

## Solução de Problemas

### Erro de conexão
- Verifique se o PostgreSQL está rodando
- Confirme as variáveis de ambiente
- Teste a conexão com `npm run db:setup`

### Erro de migração
- Verifique o formato do arquivo `cipex.sql`
- Execute `npm run db:push` primeiro
- Limpe o banco se necessário

### Dados não aparecem
- Verifique se a migração foi concluída
- Use `npm run db:studio` para visualizar
- Confirme os relacionamentos no schema

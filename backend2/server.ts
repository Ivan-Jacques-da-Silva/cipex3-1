
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://0.0.0.0:3000",
    "https://localhost:3000",
    "https://0.0.0.0:3000",
    /\.replit\.dev$/,
    /\.replit\.com$/,
    /\.replit\.co$/,
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos
app.use(
  "/materialdeaula",
  express.static(path.join(__dirname, "materialdeaula")),
);
app.use("/AudiosCurso", express.static(path.join(__dirname, "AudiosCurso")));
app.use(
  "/MaterialCurso",
  express.static(path.join(__dirname, "MaterialCurso")),
);
app.use(
  "/MaterialExtra",
  express.static(path.join(__dirname, "MaterialExtra")),
);

// Rota de teste
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend2 TypeScript servidor principal está funcionando!",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Importar e usar as rotas organizadas
import authRoutes from './src/routes/authRoutes';
import usuarioRoutes from './src/routes/usuarioRoutes';

// Usar as rotas
app.use('/auth', authRoutes);
app.use('/usuarios', usuarioRoutes);

// Rotas que ainda serão criadas (comentadas por enquanto)
// import escolaRoutes from './src/routes/escolaRoutes';
// import turmaRoutes from './src/routes/turmaRoutes';
// import cursoRoutes from './src/routes/cursoRoutes';
// import audioRoutes from './src/routes/audioRoutes';
// import materialRoutes from './src/routes/materialRoutes';
// import matriculaRoutes from './src/routes/matriculaRoutes';

// app.use('/escolas', escolaRoutes);
// app.use('/turmas', turmaRoutes);
// app.use('/cursos', cursoRoutes);
// app.use('/audios', audioRoutes);
// app.use('/materiais', materialRoutes);
// app.use('/matriculas', matriculaRoutes);

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend2 TypeScript servidor principal rodando na porta ${PORT} em 0.0.0.0`);
  console.log(`Acesse em: http://0.0.0.0:${PORT}`);
});

export default app;

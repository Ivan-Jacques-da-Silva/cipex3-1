import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Configurações CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://0.0.0.0:3000",
    "https://localhost:3000",
    "https://0.0.0.0:3000",
    "http://localhost:5000",
    "http://0.0.0.0:5000",
    "https://localhost:5000",
    "https://0.0.0.0:5000",
    /\.replit\.dev$/,
    /\.replit\.com$/,
    /\.replit\.co$/,
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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
app.use("/FotoPerfil", express.static(path.join(__dirname, "FotoPerfil")));

// Rota de teste
app.get("/test", (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Backend2 TypeScript servidor principal está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota de debug para verificar configuração
app.get('/debug', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Debug endpoint",
    jwt_secret_configured: !!process.env.JWT_SECRET,
    jwt_secret_length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    database_url_configured: !!process.env.DATABASE_URL,
    port: PORT,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });
});

// Importar e usar as rotas organizadas
import authRoutes from "./src/routes/authRoutes";
import usuarioRoutes from "./src/routes/usuarioRoutes";
import escolaRoutes from "./src/routes/escolaRoutes";
import turmaRoutes from "./src/routes/turmaRoutes";
import cursoRoutes from "./src/routes/cursoRoutes";
import audioRoutes from "./src/routes/audioRoutes";
import materialRoutes from "./src/routes/materialRoutes";
import matriculaRoutes from "./src/routes/matriculaRoutes";
import professorRoutes from "./src/routes/professorRoutes";

// Usar as rotas
app.use("/", authRoutes);
app.use("/", usuarioRoutes);
app.use("/", escolaRoutes);
app.use("/", turmaRoutes);
app.use("/", cursoRoutes);
app.use("/", audioRoutes);
app.use("/", materialRoutes);
app.use("/", matriculaRoutes);
app.use("/", professorRoutes);

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Backend2 TypeScript servidor principal rodando na porta ${PORT} em 0.0.0.0`,
  );
  console.log(`Acesse em: http://0.0.0.0:${PORT}`);
});

export default app;
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_super_segura_aqui";

// Estender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Função para hash de senha
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Middleware de autenticação
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  console.log("=== MIDDLEWARE AUTH ===");
  console.log("Authorization header:", authHeader);

  const token = authHeader && authHeader.split(" ")[1];
  console.log("Token extraído:", token ? token.substring(0, 50) + "..." : "null");

  if (!token) {
    console.log("Token não fornecido");
    return res.status(401).json({ error: "Token de acesso requerido" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log("Erro ao verificar token:", err.message);
      return res.status(403).json({ error: "Token inválido" });
    }
    console.log("Token válido, usuário:", user);
    req.user = user;
    next();
  });
};
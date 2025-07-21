import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "C1p3x_JWT_S3cr3t_K3y_2024!@#$%";

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
  console.log("Request URL:", req.url);
  console.log("Request Method:", req.method);

  const token = authHeader && authHeader.split(" ")[1];
  console.log("Token extraído:", token ? token.substring(0, 50) + "..." : "null");

  if (!token) {
    console.log("Token não fornecido");
    return res.status(401).json({ 
      success: false,
      error: "Token de acesso requerido",
      message: "Authorization header missing or invalid format"
    });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log("Erro ao verificar token:", err.message);
      console.log("JWT_SECRET usado:", JWT_SECRET.substring(0, 10) + "...");
      return res.status(403).json({ 
        success: false,
        error: "Token inválido",
        message: err.message
      });
    }
    console.log("Token válido, usuário:", user);
    req.user = user;
    next();
  });
};
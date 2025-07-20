
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_super_segura_aqui";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  console.log("=== MIDDLEWARE AUTH ===");
  console.log("Authorization header:", authHeader);

  const token = authHeader && authHeader.split(" ")[1];
  console.log(
    "Token extraído:",
    token ? token.substring(0, 50) + "..." : "null",
  );

  if (!token) {
    console.log("Token não fornecido");
    return res.status(401).json({ error: "Token de acesso requerido" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Erro ao verificar token:", err.message);
      return res.status(403).json({ error: "Token inválido" });
    }
    console.log("Token válido, usuário:", user);
    req.user = user as JwtPayload;
    next();
  });
};

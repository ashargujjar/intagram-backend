import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

type ResponseError = {
  success: boolean;
  message: string | object;
};
interface UserPayload extends JwtPayload {
  id: string;
  username: string;
  email: string;
}
export interface AuthRequest extends Request {
  user?: UserPayload;
}

// Middleware
export const verifyToken = (
  req: AuthRequest,
  res: Response<ResponseError>,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token found" });
  }

  const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET_KEY is not defined");
  }

  try {
    const decoded = jwt.verify(token, secret) as UserPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err });
  }
};

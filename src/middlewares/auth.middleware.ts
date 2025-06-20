import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access_secret_key";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret_key";

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};



interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Extract token from cookie or Authorization header
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    // 2. Verify the token
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
    console.log(decoded);
    

    if (!decoded?.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    const id = decoded.userId

    // 3. Find the user in the database
    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.userId) },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified:true,
        username:true,
        userDetails:true
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid access token: User not found" });
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ message: "Unauthorized: Token verification failed" });
  }
};

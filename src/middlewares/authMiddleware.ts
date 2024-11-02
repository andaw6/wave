import { NextFunction, Request, Response } from "express";
import { isTokenBlacklisted } from "../security/blackList";
import { IJwtPayload, IRequestAuth } from "../interfaces/AuthInterface";
import prisma from "../config/prisma";
import jwt, { TokenExpiredError } from 'jsonwebtoken';


const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Invalid or missing Authorization header", error: true, data: null });
    }
    const token = authHeader.split(' ')[1];

    if (isTokenBlacklisted(token)) {
        return res.status(401).json({ message: 'Token is blacklisted', error: true, data: null });
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as IJwtPayload;

        
        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });
        
        if (!user) {
            return res.status(401).json({ message: 'User not found', error: true });
        }
        (req as IRequestAuth).user = payload;
        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return res.status(401).json({ message: 'Token expired, please log in again.', error: true, data: null });
        }

        if (!res.headersSent) {
            return res.status(500).json({ message: "Une erreur interne s'est produite", error: (error as Error).message, data: null });
        }
    }
};

export default authMiddleware;

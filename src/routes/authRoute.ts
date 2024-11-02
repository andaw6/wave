// src/routes/utilisateurRoute.ts
import authController from "../controllers/authController";
import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";

// Créer une instance du routeur
const authRoute: Router = Router();


authRoute.post('/login', authController.login.bind(authController));

authRoute.post('/logout', authMiddleware, authController.logout.bind(authController));

authRoute.get("/token", authMiddleware, authController.token.bind(authController))

authRoute.post('/token', authController.generateToken.bind(authController));

authRoute.get('/decode/:token', authController.decodeToken.bind(authController));

authRoute.get('/validate/:token', authController.validateToken.bind(authController));

export default authRoute;
import userController from "../controllers/userController";
import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../enums/UserRole";

// Créer une instance du routeur
const userRoute: Router = Router();

// Route pour lister les utilisateurs avec un filtre optionnel par rôle
userRoute.get('/', authMiddleware, userController.listUsers.bind(userController));

// Route pour supprimer un utilisateur
userRoute.delete('/:id', authMiddleware, userController.deleteUser.bind(userController));

// Route pour récupérer les informations d'un utilisateur connecté
userRoute.get('/current', authMiddleware, roleMiddleware([UserRole.CLIENT, UserRole.VENDOR]), userController.getCurrentUser.bind(userController));

// Route pour récupérer un utilisateur par son ID
userRoute.get('/:id', authMiddleware, userController.getUserById.bind(userController));

export default userRoute;
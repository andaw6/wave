import { Request, Response } from "express";
import userService from "../services/userService";
import Controller from "./controller";
import { CurrentUserInclude } from "../interfaces/UserInterface";

export default new class userController extends Controller {
    async createAgentOrAdmin(req: Request, res: Response) {

    }

    async createClientByAgent(req: Request, res: Response) {
        // const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        return this.trycatch(async () => { }, res);

    }
    // Endpoint pour récupérer un utilisateur par son ID
    async getUserById(req: Request, res: Response) {
        return this.trycatch(async () => {
            const userId = req.params.id;
            const user = await userService.getUserById(userId);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé', data: null, error: true });
            }

            res.status(200).json({ message: 'Utilisateur récupéré avec succès', data: user, error: false });
        }, res);
    }

    // Endpoint pour lister les utilisateurs avec option de filtre par rôle
    async listUsers(req: Request, res: Response) {
        return this.trycatch(async () => { }, res);
    }
    async deleteUser(req: Request, res: Response) {
        const userId = req.params.id;
        return this.trycatch(async () => {
            await userService.deleteUser(userId);
            res.status(200).json({ message: 'Utilisateur supprimé avec succès', error: false });
        }, res);
    }

    async getCurrentUser(req: Request, res: Response) {
        return this.trycatch(async () => {
            const userAuth = this.getUserRequest(req);
            console.log(userAuth.role, userAuth.userId);
            
            const user = await userService.getUserById(userAuth.userId, CurrentUserInclude);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé', data: null, error: true });
            }
            res.status(200).json({ message: 'Utilisateur récupéré avec succès', data: user, error: false });
        }, res);
    }



}
import { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IRequestAuth } from "../interfaces/AuthInterface";
import { blacklistToken } from "../security/blackList";
import userService from "../services/userService";
import jwtService from "../services/jwtService";


export default new class authController{

    async logout(req: Request, res: Response) {
        const userId: string = (req as IRequestAuth).user.userId;
        const token = req.headers['authorization']?.split(' ')[1]
        blacklistToken(token);
        res.clearCookie('token');
        res.status(200).json({ message: 'Deconnexion reussie', data: { userId }, error: false });
    }

    async login(req: Request, res: Response) {
        const { phone, password } = req.body;

        try {

            const user = await userService.getUserByPhoneOrEmail(phone);

            if (!user) {
                return res.status(404).json({ message: 'Le numéro ou mot de passe incorrect', error: true, data: null });
            }

            const isPasswordValid: boolean = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Le numéro ou mot de passe incorrect', error: true, data: null });
            }

            const token: string = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, {
                expiresIn: process.env.JWT_EXPIRES_IN,
            });

            res.status(200).json({ data: { token }, message: 'Connexion reussie', error: false });
        }
        catch (error) {
            console.log(error);
            return res.status(404).json({ message: 'Le numéro ou mot de passe incorrect', error: true, data: null });
        }
    }

    async token(req: Request, res: Response){
        res.status(200).json(req.params.authorization.split(" ")[1]);
    }

    public generateToken(req: Request, res: Response): void {
        const payload = req.body; 
        const token = jwtService.encode(payload);
        res.json({ token });
      }
    
      // Route pour décoder un token
      public decodeToken(req: Request, res: Response): void {
        const token = req.params.token; // Récupérer le token des paramètres
        const decoded = jwtService.decode(token);
        if (decoded) {
          res.json(decoded);
        } else {
          res.status(401).json({ message: 'Token invalide ou expiré' });
        }
      }
    
      // Route pour vérifier la validité d'un token
      public validateToken(req: Request, res: Response): void {
        const token = req.params.token; // Récupérer le token des paramètres
        const isValid = jwtService.isValidToken(token);
        res.json({ isValid });
      }
}
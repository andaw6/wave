// src/services/JwtService.ts

import * as jwt from 'jsonwebtoken';

export default new class JwtService {
    private secretKey: string = process.env.JWT_SECRET as string;

    // Méthode pour encoder un payload en JWT
    encode(payload: any, expiration: number = 120): string {
        return jwt.sign(payload, this.secretKey, { expiresIn: expiration });
    }

    // Méthode pour décoder un JWT et retourner le payload
    decode(token: string): any {
        try {
            return jwt.verify(token, this.secretKey);
        } catch (error) {
            console.error('Token invalide ou expiré', error);
            return null; // Retourne null si le token est invalide ou expiré
        }
    }

    // Vérifie si un token est valide
    isValidToken(token: string): boolean {
        try {
            jwt.verify(token, this.secretKey);
            return true; // Le token est valide
        } catch (error) {
            return false; // Le token est invalide
        }
    }
}

import { randomBytes } from "crypto";
import jwt from 'jsonwebtoken';
import { TokenServiceInterface } from "../interfaces/TokenServiceInterface";

class TokenService implements TokenServiceInterface {

    async generateToken(userId: number): Promise<string> {
        const data: string = randomBytes(10).toString('hex');
        const token: string = jwt.sign({ userId, data }, process.env.JWT_SECRET!, { expiresIn: "1h" });

        return token;
    }

    async validateToken(token: string): Promise<any | null> {
        return new Promise(()=>{});
    }

    async invalidateToken(token: string): Promise<any> {
        return new Promise(()=>{});
    }
}

export default new TokenService();
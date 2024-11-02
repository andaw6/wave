import "reflect-metadata";
import bcrypt from 'bcryptjs';
import { HashServiceInterface } from "../interfaces/AuthInterface";

export default new class HashService implements HashServiceInterface {
    async hash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    async compare(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }
}

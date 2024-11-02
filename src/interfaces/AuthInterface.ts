import { Request } from "express";

// Interface combinant Express Request et les informations utilisateur
export interface IRequestAuth extends Request {
    user: IJwtPayload; // Ensure the user property is defined here
}

// Interface pour le payload JWT de l'utilisateur
export interface IJwtPayload {
    userId: string;
    role: string;
}

// Interface pour le service de hachage
export interface HashServiceInterface {
    hash(password: string): Promise<string>;
    compare(password: string, hashedPassword: string): Promise<boolean>;
}

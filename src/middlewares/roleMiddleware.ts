import { Request, Response, NextFunction } from 'express';
import { IRequestAuth } from '../interfaces/AuthInterface';
import { UserRole } from '../enums/UserRole';

const rolesValides: UserRole[] = [
    UserRole.ADMIN, 
    UserRole.AGENT, 
    UserRole.CLIENT,
    UserRole.VENDOR
];

export const roleMiddleware = (roles: UserRole[]) => {
    
    const filteredRoles = roles.filter(role => rolesValides.includes(role));

    return (req: Request, res: Response, next: NextFunction) => {        
        const reqAuth = req as IRequestAuth;
        
        // Ensure `user` and `user.role` exist before proceeding
        if (!reqAuth.user || !reqAuth.user.role) {
            return res.status(403).json({
                message: 'Accès refusé. Utilisateur non authentifié.',
                error: true,
                data: null
            });
        }

        const userRole: UserRole = reqAuth.user.role as UserRole;
        console.log('User role:', userRole, 'Allowed roles:', filteredRoles, 'Valid roles:', rolesValides);

        // Check if userRole is among the allowed roles
        if (!filteredRoles.includes(userRole)) {
            return res.status(403).json({
                message: 'Accès refusé. Vous n\'avez pas les autorisations nécessaires.',
                error: true,
                data: null
            });
        }

        next();
    };
};

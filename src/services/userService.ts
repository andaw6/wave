import { User, UserRole } from '@prisma/client';
import prisma from '../config/prisma';
import { CreateData } from '../types/intex';
import { Include } from '../interfaces/Include';
import { validate as validateUUID } from 'uuid';

class UserService {
    async createUser(data: Omit<User, CreateData>) {
        return prisma.user.create({ data });
    }

    async getUserById(id: string, include: Include = {}) {
        if (!validateUUID(id)) {
            throw new Error('Invalid UUID format for id');
        }
        return prisma.user.findUnique({ where: { id }, include });
    }


    async updateUser(id: string, data: Partial<User>) {
        return prisma.user.update({ where: { id }, data });
    }

    async deleteUser(id: string) {
        return prisma.user.delete({ where: { id } });
    }

    async getAllUsers(
        pagination: { page?: number; pageSize?: number } = {},
        filters: { name?: string; email?: string; role?: string } = {},
        include: Include = {} // Ajout d'un paramètre pour les inclusions
    ) {
        const { page = 1, pageSize = 10 } = pagination;

        const where: any = {};
        if (filters.name) {
            where.name = { contains: filters.name, mode: 'insensitive' }; // Recherche insensible à la casse
        }
        if (filters.email) {
            where.email = { contains: filters.email, mode: 'insensitive' };
        }
        if (filters.role) {
            where.role = filters.role;
        }

        const users = await prisma.user.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            include, // Inclure les relations spécifiées
        });

        const totalCount = await prisma.user.count({ where });

        return {
            users,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page,
        };
    }

    async getUserByPhoneOrEmail(phone?: string, email?: string) {
        const where: any = {};

        if (phone) {
            where.phoneNumber = phone; // Assurez-vous que le champ phone existe dans votre modèle User
        }

        if (email) {
            where.email = { equals: email, mode: 'insensitive' }; // Recherche insensible à la casse
        }



        return prisma.user.findUnique({
            where: {
                ...where,
            },
        });
    }

    async getUserRoleByPhoneNumber(phone: string | undefined): Promise<UserRole | null> {
        if(phone == undefined)
            return null;
        const user = await prisma.user.findUnique({
            where: { phoneNumber: phone },
            select: { role: true },
        });
        return user ? user.role as UserRole : null;
    }

}

export default new UserService();

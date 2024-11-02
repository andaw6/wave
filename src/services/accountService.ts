import { Account } from "@prisma/client";
import prisma from "../config/prisma";
import { CreateData } from "../types/intex";

class AccountService {
    async createAccount(data: Omit<Account, CreateData>) {
        return await prisma.account.create({ data });
    }

    async getAccountById(id: string) {
        return await prisma.account.findUnique({ where: { id } });
    }

    async updateAccount(id: string, data: Partial<Account>) {
        return await prisma.account.update({ where: { id }, data });
    }

    async deleteAccount(id: string) {
        return await prisma.account.delete({ where: { id } });
    }

    async getAllAccounts() {
        return await prisma.account.findMany();
    }

    async debit(phoneNumber: string, amount: number) {
        const account = await prisma.account.findFirst({
            where: { user: { phoneNumber } },
        });

        if (!account) {
            throw new Error("Account not found.");
        }

        if (account.balance < amount) {
            throw new Error("Insufficient funds.");
        }

        await prisma.account.update({
            where: { id: account.id },
            data: { balance: { decrement: amount } },
        });

        return account;
    }

    // Méthode pour créditer un compte avec vérification du plafond
    async credit(phoneNumber: string, amount: number) {
        const account = await prisma.account.findFirst({
            where: { user: { phoneNumber } },
        });

        if (!account) {
            throw new Error("Account not found.");
        }

        const newBalance = account.balance + amount;
        if (newBalance > Number(account.plafond)) {
            throw new Error(`Cannot credit account: balance limit of ${account.plafond} FCFA exceeded.`);
        }

        await prisma.account.update({
            where: { id: account.id },
            data: { balance: { increment: amount } },
        });

        return account;
    }

    async validateAccounts(senderPhoneNumber: string, receiverPhoneNumber: string) {
        const senderAccount = await prisma.account.findFirst({
            where: { user: { phoneNumber: senderPhoneNumber } },
            include: { user: true }
        });

        const receiverAccount = await prisma.account.findFirst({
            where: { user: { phoneNumber: receiverPhoneNumber } },
            include: { user: true }
        });

        if (!senderAccount) {
            throw new Error("Compte de l'expéditeur n'existe pas");
        }
        if (!receiverAccount) {
            throw new Error("Compte du destinataire n'existe pas");
        }

        return { senderAccount, receiverAccount };
    }
}

export default new AccountService();
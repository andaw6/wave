import { User, UserRole } from "@prisma/client";

import { TransactionType } from "@prisma/client";

import { TransactionStatus } from "@prisma/client";

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function createTransactionsForUser(userId: string) {
    const users: User[] = await prisma.user.findMany({});
    // Trouver l'utilisateur spécifique par son ID
    const user = users.find(u => u.id === userId);

    if (!user || user.role === UserRole.ADMIN) {
        console.error('Utilisateur non valide ou est un admin.');
        return; // Sortir si l'utilisateur est introuvable ou est un admin
    }

    const transactionsData = [];

    for (let i = 0; i < 3; i++) {
        let receiver;
        do {
            receiver = users[faker.number.int({ min: 0, max: users.length - 1 })];
        } while (receiver.id === user.id); // Assurer que l'expéditeur et le destinataire sont différents

        transactionsData.push({
            amount: faker.number.int({ min: 100, max: 2000 }),
            senderId: user.id,
            receiverId: receiver.id,
            feeAmount: faker.number.float({ min: 0, max: 10 }),
            currency: 'FCFA',
            transactionType: faker.helpers.arrayElement(Object.values(TransactionType)),
            status: faker.helpers.arrayElement(Object.values(TransactionStatus)),
        });
    }

    // Créer les transactions en batch
    await prisma.transaction.createMany({
        data: transactionsData,
    });

    console.log(`Transactions créées pour l'utilisateur avec ID: ${userId}`);
}


createTransactionsForUser("8906ef53-9019-45a5-9d52-e5988ff574ca").then(console.log);
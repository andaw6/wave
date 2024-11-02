import prisma from "../config/prisma";
import { Transaction, TransactionType, TransactionStatus, UserRole } from "@prisma/client";
import { TimeFrame } from "../types/intex";
import { TimeFrameConfig } from "../interfaces/TimeFrameConfig";
import { WhereCondition } from "../interfaces/WhereCondition";
import { Include } from "../interfaces/Include";
import { UserInclude, UserTransactionInclude } from "../interfaces/UserInterface";
import accountService from "./accountService";
import { CreditPurchaseDetails } from "../interfaces/TransactionInterface";
import { log } from "console";

class TransactionService {
    private includeUsers(includeUser: boolean) {
        return includeUser ? UserInclude : undefined;
    }

    async createTransaction(
        senderPhoneNumber: string,
        receiverPhoneNumber: string,
        amount: number,
        feeAmount: number,
        currency: string,
        transactionType: TransactionType
    ) {
        feeAmount = Number(feeAmount);
        const blockedRoles: UserRole[] = [UserRole.ADMIN, UserRole.AGENT];

        const { senderAccount, receiverAccount } = await accountService.validateAccounts(senderPhoneNumber, receiverPhoneNumber);

        if (!senderAccount || !receiverAccount) {
            throw new Error("Compte de l'expéditeur ou du destinataire n'existe pas.");
        }
        const senderRole = senderAccount.user.role;
        const receiverRole = receiverAccount.user.role;

        if (blockedRoles.includes(senderRole) || blockedRoles.includes(receiverRole)) {
            throw new Error('Ce numéro ne peut pas recevoir de transaction');
        }
        console.log(senderAccount.balance, amount);

        if (transactionType === TransactionType.SEND && senderAccount.balance < amount + feeAmount) {
            throw new Error('Le solde est insifusant');
        }

        if (transactionType === TransactionType.SEND || transactionType === TransactionType.WITHDRAW) {
            await accountService.debit(senderPhoneNumber, amount + feeAmount);
            if (transactionType === TransactionType.WITHDRAW) {
                await accountService.credit(receiverPhoneNumber, amount);
            }
        } else if (transactionType === TransactionType.RECEIVE || transactionType === TransactionType.DEPOSIT) {
            await accountService.credit(receiverPhoneNumber, amount);
            if (transactionType === TransactionType.DEPOSIT) {
                await accountService.debit(senderPhoneNumber, amount + feeAmount);
            }
        }


        return await prisma.transaction.create({
            data: {
                senderId: senderAccount.userId,
                receiverId: receiverAccount.userId,
                amount: Number(amount - feeAmount),
                feeAmount,
                transactionType,
                status: TransactionStatus.PENDING,
                currency
            },
            include: UserInclude
        });
    }

    async getTransactionById(id: string, includeUser: boolean = false) {
        return prisma.transaction.findFirst({
            where: { id },
            include: this.includeUsers(includeUser),
        });
    }

    private readonly timeFrameConfigs: Record<Exclude<TimeFrame, null>, TimeFrameConfig> = {
        day: { unit: 'date', value: 0 },
        week: { unit: 'date', value: 6 },
        month: { unit: 'month', value: 1 }
    };

    private getPaginationStart(page: number, limit: number): number {
        return (page - 1) * limit;
    }

    private getTimeFrameWhereCondition(timeFrame: TimeFrame): Record<string, any> {
        if (!timeFrame) return {};

        const now = new Date();
        const config = this.timeFrameConfigs[timeFrame];

        const startDate = new Date(now);
        if (config.unit === 'date') {
            startDate.setDate(now.getDate() - config.value);
        } else {
            startDate.setMonth(now.getMonth() - config.value);
        }

        return {
            createdAt: { gte: startDate }
        };
    }

    private async fetchPaginatedData(
        whereCondition: WhereCondition,
        page: number,
        limit: number,
        include?: Include
    ) {
        const start = this.getPaginationStart(page, limit);
        console.log(whereCondition);

        return Promise.all([
            prisma.transaction.findMany({
                skip: start,
                take: limit,
                where: whereCondition,
                include
            }),
            prisma.transaction.count({
                where: whereCondition
            })
        ]);
    }

    public async getAll(
        page: number = 1,
        limit: number = 10,
        timeFrame: TimeFrame = null,
        include?: Include
    ) {
        const whereCondition = this.getTimeFrameWhereCondition(timeFrame);
        const [data, totalCount] = await this.fetchPaginatedData(
            whereCondition,
            page,
            limit,
            include
        );

        return { data, totalCount };
    }

    public async getAllByUser(
        userId: string,
        page: number = 1,
        limit: number = 10,
        timeFrame: TimeFrame = null,
        include?: Include
    ) {
        const whereCondition = this.condition(userId, timeFrame);
        const [data, totalCount] = await this.fetchPaginatedData(
            whereCondition,
            page,
            limit,
            include
        );

        return { data, totalCount };
    }

    private condition(id: string, timeFrame: TimeFrame) {
        return {
            OR: [
                { "senderId": id },
                { "receiverId": id }
            ],
            ...this.getTimeFrameWhereCondition(timeFrame)
        }
    }

    async updateTransactionStatus(id: string, status: TransactionStatus) {
        const transaction = await this.getTransactionById(id, false);
        if (!transaction) {
            throw new Error("Transaction Not Found");
        }
        if (transaction.status === status) {
            throw new Error(`Transaction is already in status: ${status}`);
        }
        const updatedTransaction = await prisma.transaction.update({
            where: { id },
            data: { status },
        });

        return updatedTransaction;
    }

    async createPurchaseTransaction(
        senderPhoneNumber: string,
        amount: number,
        feeAmount: number,
        currency: string,
        purchaseDetails: CreditPurchaseDetails
    ): Promise<Transaction> {
        // Vérification préalable de l'utilisateur et de son compte
        const sender = await prisma.user.findUnique({
            where: { phoneNumber: senderPhoneNumber },
            include: { account: true }
        });

        if (!sender) {
            throw new Error("Compte de l'expéditeur n'existe pas.");
        }

        if (!sender.account) {
            throw new Error("Compte de l'expéditeur n'existe pas introuvable.");
        }

        // Vérification du solde avec le montant total (incluant les frais)
        const totalAmount = amount + Number(feeAmount);
        if (sender.account.balance < totalAmount) {
            throw new Error('Insufficient funds.');
        }

        return await prisma.$transaction(async (prisma) => {
            // 1. Création de la transaction
            const transaction = await prisma.transaction.create({
                data: {
                    amount,
                    feeAmount: Number(feeAmount),  // Conversion en Decimal pour correspondre au schéma
                    currency,
                    transactionType: TransactionType.PURCHASE,
                    status: TransactionStatus.PENDING,
                    sender: {
                        connect: {
                            id: sender.id  // Utilisation de l'ID plutôt que du phoneNumber
                        },

                    }
                },
                include: {
                    creditPurchase: true,  // Inclusion des détails d'achat de crédit
                }
            });

            // 2. Création de l'entrée CreditPurchaseTransaction
            await prisma.creditPurchaseTransaction.create({
                data: {
                    transactionId: transaction.id,
                    receiverName: purchaseDetails.receiverName,
                    receiverPhoneNumber: purchaseDetails.receiverPhoneNumber,
                    receiverEmail: purchaseDetails.receiverEmail,
                }
            });
            console.log(senderPhoneNumber, totalAmount);

            // 3. Mise à jour du solde du compte
            accountService.debit(senderPhoneNumber, totalAmount);

            // 4. Mise à jour du statut de la transaction
            const updatedTransaction = await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: TransactionStatus.COMPLETED
                },
                include: {
                    sender: {
                        select: UserTransactionInclude
                    },
                    creditPurchase: true
                }
            });

            return updatedTransaction;
        });
    }


    async createTransactionTranfert(
        sender: string,
        receiver: string,
        amount: number,
        feeAmount: number,
        currency: string,
    ) {
        // return await prisma.$transaction(async (prismaTransaction) => {
        const createTransaction = async (phoneNumbers: { sender: string, receiver: string }, transactionType: TransactionType, feeAmount: number) => {
            return await this.createTransaction(
                phoneNumbers.sender,
                phoneNumbers.receiver,
                amount,
                feeAmount,
                currency,
                transactionType
            );
        };

        const resultSend = await createTransaction({ sender, receiver }, TransactionType.SEND, feeAmount);
        const resultReceive = await createTransaction({ sender: receiver, receiver: sender }, TransactionType.RECEIVE, feeAmount);

        return { sendTransaction: resultSend, receiveTransaction: resultReceive };
        // });
    }

}

export default new TransactionService();

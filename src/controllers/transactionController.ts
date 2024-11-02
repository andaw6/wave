import { Request, Response } from "express";
import Controller from "./controller";
import { IJwtPayload } from "../interfaces/AuthInterface";
import { UserRole } from "../enums/UserRole";
import transactionService from "../services/transactionService";
import { ApiResponse } from "../interfaces/ApiResponse";
import { TimeFrame } from "../types/intex";
import { UserInclude } from "../interfaces/UserInterface";
import { validateTransaction } from "../utils/transaction";
import { TransactionStatus, TransactionType } from "@prisma/client";
import userService from "../services/userService";
import creditPurchaseSchema from "../utils/creditPurchase";

export default new class TransactionController extends Controller {

    private async validateUserAndSetPhoneNumber(req: Request, res: Response, key: 'senderPhoneNumber' | 'receiverPhoneNumber') {
        const userAuth: IJwtPayload = this.getUserRequest(req);
        const user = await userService.getUserById(userAuth.userId);
        if (!user) {
            res.status(404).json(this.createErrorResponse("L'utilisateur n'existe pas"));
            return null;
        }   
        req.body[key] = user.phoneNumber;
        return user;
    }

    public async getAllTransactions(req: Request, res: Response): Promise<void> {
        const { page, limit } = this.getPaginationParams(req);
        const timeFrame = req.query.timeFrame as TimeFrame || null;
        const include = req.query.include === "true" ? UserInclude : {};

        await this.trycatch(async () => {
            const result = await transactionService.getAll(page, limit, timeFrame, include);
            const response: ApiResponse<any> = this.createPaginatedResponse(
                result,
                "Liste des transactions récupérée avec succès",
                { page, limit }
            );
            res.json(response);
        }, res);
    }

    public async getTransactionsByUser(req: Request, res: Response): Promise<void> {
        const { page, limit } = this.getPaginationParams(req);
        const timeFrame = req.query.timeFrame as TimeFrame || null;
        const userAuth: IJwtPayload = this.getUserRequest(req);

        await this.trycatch(async () => {
            const result = await transactionService.getAllByUser(userAuth.userId, page, limit, timeFrame, UserInclude);
            const response: ApiResponse<any> = this.createPaginatedResponse(
                result,
                "Liste des transactions de l'utilisateur récupérée avec succès",
                { page, limit }
            );
            res.json(response);
        }, res);
    }

    public async getTransaction(req: Request, res: Response) {
        const userAuth: IJwtPayload = this.getUserRequest(req);

        await this.trycatch(async () => {
            const transactionId = req.params.id;
            const transaction = await transactionService.getTransactionById(transactionId, true);
            if (!transaction) {
                return res.status(404).json(this.createErrorResponse("La transaction n'exist pas"));
            }

            if (
                ![UserRole.ADMIN, UserRole.AGENT].includes(userAuth.role as UserRole) &&
                !(transaction.receiverId === userAuth.userId || transaction.senderId === userAuth.userId)
            ) {
                return res.status(403).json(this.createErrorResponse("This action is unauthorized"));
            }

            return res.json(this.createSuccesResponse(`La transaction avec l'id: ${transactionId}`, transaction));
        }, res);
    }

    private async handleTransaction(req: Request, res: Response, transactionType: TransactionType, successMessage: string, feeAmount: number = 0) {
        await this.trycatch(async () => {
            const parsedData = validateTransaction({ ...req.body, transactionType });
            console.log(parsedData);
            
            const transaction = await transactionService.createTransaction(
                parsedData.senderPhoneNumber,
                parsedData.receiverPhoneNumber || "",
                parsedData.amount,
                parsedData.feeAmount || feeAmount,
                parsedData.currency,
                transactionType
            );

            if (transaction) {
                try {
                    const updatedTransaction = await transactionService.updateTransactionStatus(transaction.id, TransactionStatus.COMPLETED);
                    transaction.status = updatedTransaction.status;
                } catch (error) {
                    return res.status(500).json({ error: "Failed to update transaction status." });
                }
            }
            res.status(201).json({ message: successMessage, transaction });
        }, res);
    }


    private async handlePurchaseTransaction(req: Request, res: Response) {
        await this.trycatch(async () => {
            const parsedData = creditPurchaseSchema.parse({
                ...req.body,
                transactionType: TransactionType.PURCHASE
            });

            // Création de la transaction et du CreditPurchaseTransaction
            const transaction = await transactionService.createPurchaseTransaction(
                parsedData.senderPhoneNumber,
                parsedData.amount,
                parsedData.feeAmount,
                parsedData.currency,
                {
                    receiverName: parsedData.receiverName,
                    receiverPhoneNumber: parsedData.receiverPhoneNumber,
                    receiverEmail: parsedData.receiverEmail
                }
            );


            res.status(201).json({
                message: "Transaction PURCHASE created successfully",
                transaction
            });
        }, res);
    }


    // async send(req: Request, res: Response) {
    //     if (!await this.validateUserAndSetPhoneNumber(req, res, 'senderPhoneNumber')) return;
    //     const feeAmount: number = Math.max(5, Number(req.body.amount || 0) * 0.01)
    //     await this.handleTransaction(req, res, TransactionType.SEND, "Transaction SEND created successfully", feeAmount);
    // }

    // async receive(req: Request, res: Response) {
    //     if (!await this.validateUserAndSetPhoneNumber(req, res, 'receiverPhoneNumber')) return;
    //     await this.handleTransaction(req, res, TransactionType.RECEIVE, "Transaction RECEIVE created successfully");
    // }

    async deposit(req: Request, res: Response) {
        if (!await this.validateUserAndSetPhoneNumber(req, res, 'senderPhoneNumber')) return;
        await this.handleTransaction(req, res, TransactionType.DEPOSIT, "Transaction DEPOSIT created successfully");
    }

    async withdraw(req: Request, res: Response) {
        if (!await this.validateUserAndSetPhoneNumber(req, res, 'receiverPhoneNumber')) return;
        await this.handleTransaction(req, res, TransactionType.WITHDRAW, "Transaction WITHDRAW created successfully");
    }

    async purchase(req: Request, res: Response) {
        if (!await this.validateUserAndSetPhoneNumber(req, res, 'senderPhoneNumber')) return;
        await this.handlePurchaseTransaction(req, res);
    }

    async transfer(req: Request, res: Response) {
        if (!await this.validateUserAndSetPhoneNumber(req, res, 'senderPhoneNumber')) return;
        await this.trycatch(async () => {
            console.log({
                amount: req.body.amount,
                senderPhoneNumber: String(req.body.senderPhoneNumber),
                receiverPhoneNumber: String(req.body.receiverPhoneNumber),
                currency: req.body.currency || "FCFA",
                transactionType: TransactionType.SEND, // Spécifiez le type ici
            });

            const validatedData = validateTransaction({
                amount: req.body.amount,
                senderPhoneNumber: req.body.senderPhoneNumber,
                receiverPhoneNumber: req.body.receiverPhoneNumber,
                currency: req.body.currency || "FCFA",
                transactionType: TransactionType.SEND, // Spécifiez le type ici
            });

            const { amount, senderPhoneNumber, receiverPhoneNumber, currency } = validatedData;

            const receiverRole = await userService.getUserRoleByPhoneNumber(receiverPhoneNumber);

            if (receiverRole === UserRole.VENDOR) {
                return res.status(400).json(this.createErrorResponse("Le destinataire ne peut pas être un vendeur."));
            }

            const feeAmount: number = Math.max(5, amount * 0.01);

            const { sendTransaction, receiveTransaction } = await transactionService.createTransactionTranfert(senderPhoneNumber, receiverPhoneNumber as string, amount, feeAmount, currency);

            res.status(201).json({
                message: "Transactions created successfully",
                transactions: { sendTransaction, receiveTransaction }
            });
        }, res);

    }

}

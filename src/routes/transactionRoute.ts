// src/routes/utilisateurRoute.ts
import transactionController from "../controllers/transactionController";
import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../enums/UserRole";

const transactionRoute: Router = Router();

transactionRoute.get('/', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.AGENT]), transactionController.getAllTransactions.bind(transactionController));

transactionRoute.get('/current', authMiddleware, roleMiddleware([UserRole.CLIENT, UserRole.VENDOR]), transactionController.getTransactionsByUser.bind(transactionController));

transactionRoute.get('/:id', authMiddleware, transactionController.getTransaction.bind(transactionController));

// transactionRoute.post("/send", authMiddleware, roleMiddleware([UserRole.VENDOR, UserRole.CLIENT]), transactionController.send.bind(transactionController));

// transactionRoute.post("/receive", authMiddleware, roleMiddleware([UserRole.CLIENT]), transactionController.receive.bind(transactionController));

transactionRoute.post("/transfer", authMiddleware, roleMiddleware([UserRole.VENDOR, UserRole.CLIENT]), transactionController.transfer.bind(transactionController));

transactionRoute.post("/deposit", authMiddleware, roleMiddleware([UserRole.VENDOR]), transactionController.deposit.bind(transactionController));

transactionRoute.post("/withdraw", authMiddleware, roleMiddleware([UserRole.VENDOR]), transactionController.withdraw.bind(transactionController));

transactionRoute.post("/purchase", authMiddleware, roleMiddleware([UserRole.VENDOR, UserRole.CLIENT]), transactionController.purchase.bind(transactionController));

export default transactionRoute;

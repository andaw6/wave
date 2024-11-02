import { z } from 'zod';
import { TransactionType } from '@prisma/client';

const creditPurchaseSchema = z.object({
    senderPhoneNumber: z.string(),
    amount: z.number().positive(),
    feeAmount: z.number().min(0),
    currency: z.string().default('FCFA'),
    transactionType: z.nativeEnum(TransactionType).default(TransactionType.PURCHASE),
    receiverName: z.string(),
    receiverPhoneNumber: z.string(),
    receiverEmail: z.string().email().optional(),
});

export default creditPurchaseSchema;
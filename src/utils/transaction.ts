import { z } from "zod";
import { TransactionType, TransactionStatus } from "@prisma/client";

// Définition des énumérations pour les types et statuts des transactions
const TransactionTypeEnum = z.enum([
  TransactionType.DEPOSIT,
  TransactionType.RECEIVE,
  TransactionType.SEND,
  TransactionType.WITHDRAW,
  TransactionType.PURCHASE,
]);

const TransactionStatusEnum = z.enum([
  TransactionStatus.CANCELLED,
  TransactionStatus.COMPLETED,
  TransactionStatus.FAILED,
  TransactionStatus.PENDING,
]).optional();

// Expression régulière pour les numéros de téléphone sénégalais
const senegalPhoneNumberRegex = /^\+221(77|76|75|78|70)\d{7}$/;

// Schéma de base pour toutes les transactions
const baseTransactionSchema = z.object({
  amount: z
    .number()
    .min(5, "Le montant doit être supérieur ou égal à 5")
    .positive("Le montant doit être supérieur à zéro"),
  senderPhoneNumber: z
    .string()
    .regex(
      senegalPhoneNumberRegex,
      "Le numéro de téléphone de l'expéditeur doit être un numéro sénégalais valide"
    ),
  feeAmount: z
    .number()
    .refine((value) => value <= 99999, "Les frais dépassent la limite autorisée")
    .optional(),
  currency: z.string().default("FCFA"),
  transactionType: TransactionTypeEnum,
  status: TransactionStatusEnum.default(TransactionStatus.PENDING),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Schéma pour les transactions standard (SEND, RECEIVE, DEPOSIT, WITHDRAW)
export const standardTransactionSchema = baseTransactionSchema
  .extend({
    receiverPhoneNumber: z
      .string()
      .regex(
        senegalPhoneNumberRegex,
        "Le numéro de téléphone du destinataire doit être un numéro sénégalais valide"
      ),
  })
  .refine(
    (data) => {
      if (data.transactionType !== TransactionType.PURCHASE) {
        console.log(data.senderPhoneNumber, data.receiverPhoneNumber);
        
        return data.senderPhoneNumber !== data.receiverPhoneNumber;
      }
      return true;
    },
    {
      message: "L'expéditeur et le destinataire ne peuvent pas être identiques",
    }
  );

// Schéma spécifique pour les transactions de type PURCHASE
export const purchaseTransactionSchema = baseTransactionSchema
  .extend({
    transactionType: z.literal(TransactionType.PURCHASE),
    receiverName: z
      .string()
      .min(2, "Le nom du destinataire doit contenir au moins 2 caractères")
      .optional(),
    receiverPhoneNumber: z
      .string()
      .regex(
        senegalPhoneNumberRegex,
        "Le numéro de téléphone du destinataire doit être un numéro sénégalais valide"
      )
      .optional(),
    receiverEmail: z
      .string()
      .email("L'email du destinataire doit être valide")
      .optional(),
  })
  .refine(
    (data) => {
      // Au moins un moyen de contact doit être fourni pour le destinataire
      return !!(data.receiverName || data.receiverPhoneNumber || data.receiverEmail);
    },
    {
      message:
        "Au moins un moyen de contact (nom, téléphone ou email) doit être fourni pour le destinataire",
    }
  );

// Type pour les données validées
export type StandardTransactionInput = z.infer<typeof standardTransactionSchema>;
export type PurchaseTransactionInput = z.infer<typeof purchaseTransactionSchema>;

// Fonction utilitaire pour valider les transactions
export const validateTransaction = (data: any) => {
  if (data.transactionType === TransactionType.PURCHASE) {
    return purchaseTransactionSchema.parse(data);
  }
  return standardTransactionSchema.parse(data);
};

export default validateTransaction;

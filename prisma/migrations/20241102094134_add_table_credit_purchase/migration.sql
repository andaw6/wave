-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'PURCHASE';

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_receiverId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "receiverId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CreditPurchaseTransaction" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "receiverName" TEXT,
    "receiverPhoneNumber" TEXT,
    "receiverEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditPurchaseTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditPurchaseTransaction_transactionId_key" ON "CreditPurchaseTransaction"("transactionId");

-- AddForeignKey
ALTER TABLE "CreditPurchaseTransaction" ADD CONSTRAINT "CreditPurchaseTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

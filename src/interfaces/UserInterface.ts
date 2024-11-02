import { NotificationStatus } from "@prisma/client";
import { Include } from "./Include";


export const CurrentUserInclude: Include = {
    transactions: {
        include: {
            receiver: {
                select: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                    role: true
                }
            },
            creditPurchase: true
        }
    },
    received: {
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                    role: true
                }
            },
            creditPurchase: true
        }
    },
    bills: true,
    notifications: {  // Corrected to align with `User` model field
        where: {
            isRead: NotificationStatus.UNREAD
        }
    },
    account: true,
    contacts: true
};


export const UserInclude: Include = {
    sender: {
        select: {
            id: true,
            name: true,
            phoneNumber: true,
            role: true,
            email: true
        }
    },
    receiver: {
        select: {
            id: true,
            name: true,
            phoneNumber: true,
            role: true,
            email: true
        }
    },
    creditPurchase: true
}

export const UserTransactionInclude: Include = {
    id: true,
    name: true,
    phoneNumber: true,
    role: true,
    email: true
}
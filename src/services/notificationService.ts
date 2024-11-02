import { Notification } from "@prisma/client";
import prisma from "../config/prisma";
import { CreateData } from "../types/intex";

class NotificationService {
    async createNotification(data: Omit<Notification, CreateData>) {
        return await prisma.notification.create({ data });
    }

    async getNotificationById(id: string) {
        return await prisma.notification.findUnique({ where: { id } });
    }

    async updateNotification(id: string, data: Partial<Notification>) {
        return await prisma.notification.update({ where: { id }, data });
    }

    async deleteNotification(id: string) {
        return await prisma.notification.delete({ where: { id } });
    }

    async getAllNotifications() {
        return await prisma.notification.findMany();
    }
}

export default new NotificationService();   
import { Contact } from "@prisma/client";
import prisma from "../config/prisma";
import { CreateData } from "../types/intex";

class ContactService {
    async createContact(data: Omit<Contact, CreateData>) {
        return await prisma.contact.create({ data });
    }

    async getContactById(id: string) {
        return await prisma.contact.findUnique({ where: { id } });
    }

    async updateContact(id: string, data: Partial<Contact>) {
        return await prisma.contact.update({ where: { id }, data });
    }

    async deleteContact(id: string) {
        return await prisma.contact.delete({ where: { id } });
    }

    async getAllContacts() {
        return await prisma.contact.findMany();
    }
}

export default new ContactService();
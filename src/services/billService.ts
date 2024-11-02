import { Bill } from "@prisma/client";
import prisma from "../config/prisma";
import { CreateData } from "../types/intex";

class BillService {
    async createBill(data: Omit<Bill, CreateData>) {
        return await prisma.bill.create({ data });
    }

    async getBillById(id: string) {
        return await prisma.bill.findUnique({ where: { id } });
    }

    async updateBill(id: string, data: Partial<Bill>) {
        return await prisma.bill.update({ where: { id }, data });
    }

    async deleteBill(id: string) {
        return await prisma.bill.delete({ where: { id } });
    }

    async getAllBills() {
        return await prisma.bill.findMany();
    }
}

export default new BillService();
import { PersonalInfo } from "@prisma/client";
import prisma from "../config/prisma";
import { CreateData } from "../types/intex";

class PersonalInfoService {
    async createPersonalInfo(data: Omit<PersonalInfo, CreateData>) {
        return await prisma.personalInfo.create({ data });
    }

    async getPersonalInfoById(id: string) {
        return await prisma.personalInfo.findUnique({ where: { id } });
    }

    async updatePersonalInfo(id: string, data: Partial<PersonalInfo>) {
        return await prisma.personalInfo.update({ where: { id }, data });
    }

    async deletePersonalInfo(id: string) {
        return await prisma.personalInfo.delete({ where: { id } });
    }

    async getAllPersonalInfos() {
        return await prisma.personalInfo.findMany();
    }
}

export default new PersonalInfoService(); 
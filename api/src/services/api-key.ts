import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";

export class ApiKeyService {
    public static async getAllApiKeys(): Promise<{ apiKeys: any }> {
        try {
            const apiKeys = await prisma.apiKey.findMany({
                orderBy: { createdAt: 'desc' },
            });
            return { apiKeys };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getApiKeyById(id: string): Promise<{ apiKey: any }> {
        try {
            const apiKey = await prisma.apiKey.findUnique({
                where: { id },
            });
            return { apiKey };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async createApiKey(data: Prisma.ApiKeyCreateInput): Promise<{ apiKey: any }> {
        try {
            const apiKey = await prisma.apiKey.create({
                data,
            });
            return { apiKey };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async updateApiKey(id: string, data: Prisma.ApiKeyUpdateInput): Promise<{ apiKey: any }> {
        try {
            const apiKey = await prisma.apiKey.update({
                where: { id },
                data,
            });
            return { apiKey };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async deleteApiKeys(ids: string[]): Promise<void> {
        try {
            await prisma.apiKey.deleteMany({
                where: { id: { in: ids } },
            });
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async incrementUsage(id: string): Promise<void> {
        try {
            await prisma.apiKey.update({
                where: { id },
                data: { used: { increment: 1 } },
            });
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }
}
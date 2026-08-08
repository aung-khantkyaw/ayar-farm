import { prisma } from "../prisma/client";
import { deleteFile } from "../utils";

export class KnowledgeBaseService {
    public static async getAllKnowledgeBase(): Promise<{ knowledgeBase: any }> {
        try {
            const knowledgeBase = await prisma.knowledgeBase.findMany({
                orderBy: { created_at: 'desc' }
            });

            return { knowledgeBase };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getKnowledgeBaseById(id: string): Promise<{ knowledgeBase: any }> {
        try {
            const knowledgeBase = await prisma.knowledgeBase.findUnique({
                where: { id }
            });

            return { knowledgeBase };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async addKnowledgeBase(title: string, author: string, file_urls: string[], size: number): Promise<{ knowledgeBase: any }> {
        try {
            const knowledgeBase = await prisma.knowledgeBase.create({
                data: {
                    title,
                    author,
                    file_urls,
                    size
                }
            });

            return { knowledgeBase };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async updateKnowledgeBase(id: string, title: string, author: string, file_urls: string[], size: number): Promise<{ knowledgeBase: any }> {
        try {
            const knowledgeBase = await prisma.knowledgeBase.update({
                where: { id },
                data: {
                    title,
                    author,
                    file_urls,
                    size
                }
            });

            return { knowledgeBase };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async deleteKnowledgeBase(id: string): Promise<void> {
        try {
            const knowledgeBase = await prisma.knowledgeBase.findUnique({
                where: { id },
            });
            if (knowledgeBase) {
                await deleteFile(knowledgeBase.file_urls);
                await prisma.knowledgeBase.delete({
                    where: { id },
                });
            }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }
}

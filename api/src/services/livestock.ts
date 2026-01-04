import { prisma } from "../prisma/client";
import { deleteImage } from "../utils";

export class LivestockService {
    public static async getAllLivestocks(): Promise<{livestocks: any}> {
        try {
            const livestocks = await prisma.livestocks.findMany({
                orderBy: { created_at: 'asc' }
            })

            return { livestocks };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getLivestockById(id: string): Promise<{ livestock: any }> {
        try {
            const livestock = await prisma.livestocks.findUnique({
                where: { id }
            });

            return { livestock };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async addNewLivestock(name: string, description: string, image_urls: string[]): Promise<{ livestock: any }> {
        try {
            const livestock = await prisma.livestocks.create({
                data: {
                    name,
                    description,
                    image_urls,
                }
            });

            return { livestock }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async updateLivestock(id: string, name: string, description: string, image_urls: string[]): Promise<{ livestock: any }> {
        try {
            const livestock = await prisma.livestocks.update({
                where: { id },
                data: {
                    name,
                    description,
                    image_urls,
                }
            });

            return { livestock }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async deleteLivestocks(ids: string[]): Promise<void> {
        try {
            for (const livestockId of ids) {
                const livestock = await prisma.livestocks.findUnique({
                    where: { id: livestockId },
                });
                if (livestock) {
                    await deleteImage(livestock.image_urls);
                    await prisma.livestocks.delete({
                        where: { id: livestockId },
                    });
                }
            }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }
}
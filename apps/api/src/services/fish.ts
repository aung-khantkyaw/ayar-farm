import { prisma } from "../prisma/client";
import { deleteImage } from "../utils";

export class FishService {
    public static async getAllFishs(): Promise<{fishs: any}> {
        try {
            const fishs = await prisma.fishs.findMany({
                orderBy: { created_at: 'asc' },
                include: { documents: true }
            })

            return { fishs };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getFishById(id: string): Promise<{ fish: any }> {
        try {
            const fish = await prisma.fishs.findUnique({
                where: { id },
                include: { documents: true }
            });

            return { fish };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async addNewFish(name: string, description: string, image_urls: string[]): Promise<{ fish: any }> {
        try {
            const fish = await prisma.fishs.create({
                data: {
                    name,
                    description,
                    image_urls,
                }
            });

            return { fish }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async updateFish(id: string, name: string, description: string, image_urls: string[]): Promise<{ fish: any }> {
        try {
            const fish = await prisma.fishs.update({
                where: { id },
                data: {
                    name,
                    description,
                    image_urls,
                }
            });

            return { fish }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async deleteFishs(ids: string[]): Promise<void> {
        try {
            for (const fishId of ids) {
                const fish = await prisma.fishs.findUnique({
                    where: { id: fishId },
                });
                if (fish) {
                    await deleteImage(fish.image_urls);
                    await prisma.fishs.delete({
                        where: { id: fishId },
                    });
                }
            }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }
}
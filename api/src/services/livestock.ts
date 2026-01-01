import { prisma } from "../prisma/client";
import { deleteImage } from "../utils";

export class LivestockService {
    public static async getAllLivestockTypes(): Promise<{ livestockTypes: any}> {
        try {
            const livestockTypes = await prisma.livestockTypes.findMany({
                orderBy: { created_at: 'asc' },
                include: { livestocks: true },
            })

            return { livestockTypes };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getLivestockTypeById(id: string): Promise<{ livestockType: any }> {
        try {
            const livestockType = await prisma.livestockTypes.findUnique({
                where: { id },
                include: { livestocks: true },
            });

            return { livestockType };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

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
                where: { id },
                include: { LivestockTypes: true }
            });

            return { livestock };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async addNewLivestockType(name: string, description: string, image_urls: string[]): Promise<{ livestockType: any }> {
        try {
            const livestockType = await prisma.livestockTypes.create({
                data: {
                    name,
                    description,
                    image_urls,
                }
            });

            return { livestockType }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async addNewLivestock(livestock_type_id: string, name: string, description: string, image_urls: string[]): Promise<{ livestock: any }> {
        try {
            const livestock = await prisma.livestocks.create({
                data: {
                    livestock_type_id,
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

    public static async updateLivestockType(id: string, name: string, description: string, image_urls: string[]): Promise<{ livestockType: any }> {
        try {
            const livestockType = await prisma.livestockTypes.update({
                where: { id },
                data: {
                    name,
                    description,
                    image_urls,
                }
            })

            return { livestockType }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async updateLivestock(id: string, livestock_type_id: string, name: string, description: string, image_urls: string[]): Promise<{ livestock: any }> {
        try {
            const livestock = await prisma.livestocks.update({
                where: { id },
                data: {
                    livestock_type_id,
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

    public static async deleteLivestockTypes(ids: string[]): Promise<void> {
        try {
            for (const livestockTypeId of ids) {
                const livestockType = await prisma.livestockTypes.findUnique({
                    where: { id: livestockTypeId },
                });
                if (livestockType) {
                    const livestocks = await prisma.livestocks.findMany({
                        where: { livestock_type_id: livestockType.id },
                        select: { id: true }
                    })
                    const livestockIds = livestocks.map(livestock => livestock.id);
                    await this.deleteLivestocks(livestockIds);
                    await deleteImage(livestockType.image_urls);
                    await prisma.livestockTypes.delete({
                        where: { id: livestockTypeId },
                    });
                }
            }
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
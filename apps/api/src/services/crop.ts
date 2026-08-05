import { prisma } from "../prisma/client";
import { deleteImage } from "../utils";

export class CropService {
    public static async getAllCropTypes(): Promise<{ cropTypes: any}> {
        try {
            const cropTypes = await prisma.cropTypes.findMany({
                orderBy: { created_at: 'asc' },
                include: { crops: true },
            })

            return { cropTypes };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getCropTypeById(id: string): Promise<{ cropType: any }> {
        try {
            const cropType = await prisma.cropTypes.findUnique({
                where: { id },
                include: { crops: true },
            });

            return { cropType };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getAllCrops(): Promise<{crops: any}> {
        try {
            const crops = await prisma.crops.findMany({
                orderBy: { created_at: 'asc' },
                include: { CropTypes: true , documents: true }
            })

            return { crops };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getCropById(id: string): Promise<{ crop: any }> {
        try {
            const crop = await prisma.crops.findUnique({
                where: { id },
                include: { CropTypes: true }
            });

            return { crop };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async addNewCropType(name: string, description: string, image_urls: string[]): Promise<{ cropType: any }> {
        try {
            const cropType = await prisma.cropTypes.create({
                data: {
                    name,
                    description,
                    image_urls,
                }
            });

            return { cropType }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async addNewCrop(crop_type_id: string, name: string, description: string, image_urls: string[]): Promise<{ crop: any }> {
        try {
            const crop = await prisma.crops.create({
                data: {
                    crop_type_id,
                    name,
                    description,
                    image_urls,
                },
                include: { CropTypes: true }
            });

            return { crop }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async updateCropType(id: string, name: string, description: string, image_urls: string[]): Promise<{ cropType: any }> {
        try {
            const cropType = await prisma.cropTypes.update({
                where: { id },
                data: {
                    name,
                    description,
                    image_urls,
                }
            })

            return { cropType }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async updateCrop(id: string, crop_type_id: string, name: string, description: string, image_urls: string[]): Promise<{ crop: any }> {
        try {
            const crop = await prisma.crops.update({
                where: { id },
                data: {
                    crop_type_id,
                    name,
                    description,
                    image_urls,
                },
                include: { CropTypes: true }
            });

            return { crop }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async deleteCropTypes(ids: string[]): Promise<void> {
        try {
            for (const cropTypeId of ids) {
                const cropType = await prisma.cropTypes.findUnique({
                    where: { id: cropTypeId },
                });
                if (cropType) {
                    const crops = await prisma.crops.findMany({
                        where: { crop_type_id: cropType.id },
                        select: { id: true }
                    })
                    const cropIds = crops.map(crop => crop.id);
                    await this.deleteCrops(cropIds);
                    await deleteImage(cropType.image_urls);
                    await prisma.cropTypes.delete({
                        where: { id: cropTypeId },
                    });
                }
            }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async deleteCrops(ids: string[]): Promise<void> {
        try {
            for (const cropId of ids) {
                const crop = await prisma.crops.findUnique({
                    where: { id: cropId },
                });
                if (crop) {
                    await deleteImage(crop.image_urls);
                    await prisma.crops.delete({
                        where: { id: cropId },
                    });
                }
            }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }
}
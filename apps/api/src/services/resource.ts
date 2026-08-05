import { ResourceType } from "@prisma/client";
import { prisma } from "../prisma/client";
import { deleteFile, deleteImage, deleteVideo } from "../utils";

export class ResourceService {
    public static async getAllResources(): Promise<{ resources: any }> {
        try {
            const resources = await prisma.resources.findMany({
                orderBy: { created_at: 'asc' }
            })

            return { resources }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getAllResourcesByType(type: ResourceType, is_active: boolean): Promise<{ resources: any }> {
        try {
            let resources;
            if (is_active) {
                console.log(
                    "Fetching resources with type:", type, "and is_active:", is_active
                )
                resources = await prisma.resources.findFirst({
                    where: { type, is_active },
                    orderBy: { created_at: 'asc' }
                })
            } else {
                console.log(
                    "Fetching resources with type:", type
                )
                resources = await prisma.resources.findMany({
                    where: { type },
                    orderBy: { created_at: 'asc' }
                })  
            }
            
            return { resources }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getResourceById(id: string): Promise<{ resource: any }> {
        try {
            const resource = await prisma.resources.findUnique({
                where: { id }
            })

            return { resource }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async addNewResource(type: ResourceType, title: string, content: string, description: string, author: string, resource_url: string[], image_url: string[], filename: string, size: number, version: string, platform: string, is_active: boolean): Promise<{ resource: any }> {
        try {
            const resource = await prisma.resources.create({
                data: {
                    type,
                    title,
                    content: content || null,
                    description: description || null,
                    author,
                    resource_url: resource_url || [],
                    image_url: image_url || [],
                    filename: filename || null,
                    size: size || 0,
                    version: version || null,
                    platform: platform || null,
                    is_active,
                }
            })

            return { resource }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async updateResource(id: string, type: ResourceType, title: string, content: string, description: string, author: string, resource_url: string[], image_url: string[], filename: string, size: number, version: string, platform: string, is_active: boolean): Promise<{ resource: any }> {
        try {
            const resource = await prisma.resources.update({
                where: { id },
                data: {
                    type,
                    title,
                    content: content || null,
                    description: description || null,
                    author,
                    resource_url: resource_url || [],
                    image_url: image_url || [],
                    filename: filename || null,
                    size: size || 0,
                    version: version || null,
                    platform: platform || null,
                    is_active,
                }
            })
            return { resource }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async downloadCountIncrease(id: string): Promise<void>{
        try {
            await prisma.resources.update({
                where: { id },
                data: {
                    download_count: {
                        increment: 1
                    }
                }
            })
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async deleteResource(ids: string[]): Promise<void> {
        try {
            for (const resourceId of ids) {
                const resource = await prisma.resources.findUnique({
                    where: { id: resourceId }
                });
                if (resource) {
                    if (resource.resource_url && resource.resource_url.length > 0) {
                        if (resource.type === ResourceType.VIDEO) {
                            await deleteVideo(resource.resource_url);
                        } else {
                            await deleteFile(resource.resource_url);
                        }
                    }

                    if (resource.image_url && resource.image_url.length > 0) {
                        await deleteImage(resource.image_url);
                    }

                    await prisma.resources.delete({
                        where: { id: resourceId }
                    });
                }
            }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }
}
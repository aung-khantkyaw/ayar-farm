import { Request, Response } from "express";
import { ResourceService } from "../services/resource";
import { ResourceType } from "@prisma/client";

export class ResourceController {
    public async getResources(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { type } = req.query;
            const { isActive } = req.query;

            if (id) {
                // Case 1: ID is provided in the URL (e.g., /resources/123)
                const { resource } = await ResourceService.getResourceById(id);
                if (!resource) {
                    res.status(404).json({ message: "Resource not found" });
                    return;
                }
                res.status(200).json({ message: "Get Resource(s) successfully", resource });
            } else if (type) {
                const is_active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
                // Case 2: No ID, but Type is provided in query (e.g., /resources?type=VIDEO)
                const { resources } = await ResourceService.getAllResourcesByType(type as ResourceType, is_active as boolean);
                res.status(200).json({ message: "Get Resource(s) successfully", resources });
            } else {
                // Case 3: No ID and no Type (e.g., /resources)
                const { resources } = await ResourceService.getAllResources();
                res.status(200).json({ message: "Get Resource(s) successfully", resources });
            }
        } catch (error) {
            res.status(500).json({ message: `Error fetching resources: ${error}` });
            console.error("Error fetching resources:", error);
        }
    }

    public async addResource(req: Request, res: Response): Promise<void> { 
        try {
            const { type, title, content, description, author, version, platform, is_active } = req.body;
            
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
            const resourceFiles = files?.['resource'] || [];
            const imageFiles = files?.['image'] || [];

            const resource_urls = resourceFiles.length > 0 ? resourceFiles.map(f => f.path) : (req.body.resource_url ? [req.body.resource_url] : []);
            const image_urls = imageFiles.length > 0 ? imageFiles.map(f => f.path) : (req.body.image_url ? [req.body.image_url] : []);
            
            const filename = resourceFiles.length > 0 ? resourceFiles[0].originalname : (req.body.filename || "");
            const size = resourceFiles.length > 0 ? resourceFiles[0].size : (req.body.size ? parseInt(req.body.size) : 0);

            const { resource } = await ResourceService.addNewResource(
                type,
                title,
                content,
                description,
                author,
                resource_urls,
                image_urls,
                filename,
                size,
                version,
                platform,
                is_active === 'true' || is_active === true
            );

            res.status(201).json({ resource });
        } catch (error) {
            res.status(500).json({ message: `Error adding resource: ${error}` })
            console.error("Error adding resource:", error)
        }
    }

    public async editResource(req: Request, res: Response): Promise<void> { 
        try {
            const { id } = req.params;
            const { type, title, content, description, author, version, platform, is_active } = req.body;
            
            const { resource: existingResource } = await ResourceService.getResourceById(id);

            if (!existingResource) {
                res.status(404).json({ message: 'Resource not found' });
                return;
            }
            
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
            const resourceFiles = files?.['resource'] || [];
            const imageFiles = files?.['image'] || [];

            const newResourceUrls = resourceFiles.length > 0 ? resourceFiles.map(f => f.path) : (req.body.resource_url ? [req.body.resource_url] : []);
            const newImageUrls = imageFiles.length > 0 ? imageFiles.map(f => f.path) : (req.body.image_url ? [req.body.image_url] : []);

            const resource_urls = [...(existingResource.resource_url || []), ...newResourceUrls];
            const image_urls = [...(existingResource.image_url || []), ...newImageUrls];
            
            const filename = resourceFiles.length > 0 ? resourceFiles[0].originalname : (req.body.filename || existingResource.filename);
            const size = resourceFiles.length > 0 ? resourceFiles[0].size : (req.body.size ? parseInt(req.body.size) : existingResource.size);

            const { resource } = await ResourceService.updateResource(
                id,
                type || existingResource.type,
                title || existingResource.title,
                content || existingResource.content,
                description || existingResource.description,
                author || existingResource.author,
                resource_urls,
                image_urls,
                filename,
                size,
                version || existingResource.version,
                platform || existingResource.platform,
                is_active !== undefined ? (is_active === 'true' || is_active === true) : existingResource.is_active
            );

            res.status(200).json({ message: 'Resource updated successfully', resource });
        } catch (error) {
            res.status(500).json({ message: `Error editing resource: ${error}` })
            console.error("Error editing resource:", error)
        }
    }

    public async downloadCountIncrease(req: Request, res: Response): Promise<void>{
        try {
            const { id } = req.params;

            await ResourceService.downloadCountIncrease(id);

            res.status(200).json({ message: 'Resource(s) download count increase successfully' })
        } catch (error) {
            res.status(500).json({ message: `Error increasing download count for resource: ${error}` })
            console.error("Error increasing download count for resource:", error)
        }
    }

    public async deleteResource(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const ids = Array.isArray(id) ? id : [id];
            
            await ResourceService.deleteResource(ids);
            
            res.status(200).json({ message: 'Resource(s) deleted successfully' })
        } catch (error) {
            res.status(500).json({ message: `Error deleting resource(s): ${error}` })
            console.error("Error deleting resource(s):", error)
        }
    }
}
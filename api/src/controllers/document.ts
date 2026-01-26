import { Request, Response } from "express";
import { DocumentService } from "../services/document";

export class DocumentController {
    public async getDocuments(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { type } = req.query;
            const { type_id } = req.query;
            const rawArticle = req.query.article;
            const rawAgrometBulletin = req.query.agromet_bulletin;
            const articleFlag = typeof rawArticle === 'string' ? rawArticle === 'true' : Boolean(rawArticle);
            const agrometBulletinFlag = typeof rawAgrometBulletin === 'string' ? rawAgrometBulletin === 'true' : Boolean(rawAgrometBulletin);
                        
            if (id) {
                const { document } = await DocumentService.getDocumentById(id);
                res.status(200).json({ message: "Get Document(s) successfully", document });
            } else if (typeof type === 'string') {
                const { documents } = type_id ? await DocumentService.getAllDocumentByTypeId(type, type_id as string) : await DocumentService.getAllDocumentByType(type);
                res.status(200).json({ message: "Get Document(s) successfully", documents });
            } else if (articleFlag || agrometBulletinFlag) {
                const { documents } = await DocumentService.getDocumentByArticleOrAgrometBulletin(articleFlag, agrometBulletinFlag);
                res.status(200).json({ message: "Get Document(s) successfully", documents });
            } else {
                const { documents } = await DocumentService.getAllDocuments();
                res.status(200).json({ message: "Get Document(s) successfully", documents });
            }
            
            return;
        } catch (error) {
            res.status(500).json({ message: `Error fetching documents: ${error}` });
            console.error("Error fetching documents:", error);
        }
    }

    public async addDocument(req: Request, res: Response): Promise<void> {
        try {
            const { title, author, crop_type_id, livestock_type_id, machine_type_id, crop_id, livestock_id, machine_id, fish_id } = req.body;
            const files = req.files as Express.Multer.File[];
            const file_urls = files ? files.map(file => file.path) : [];
            const size = files && files.length > 0 ? files[0].size : (req.body.size ? parseInt(req.body.size) : 0);
            const newDocument = (await DocumentService.addNewDocument(title, author, file_urls, size, crop_type_id, livestock_type_id, machine_type_id, crop_id, livestock_id, machine_id, fish_id)).document;

            if (!newDocument) {
                res.status(400).json({ message: 'Document added fail' })
            }

            res.status(201).json({ message: 'Document added successfully', data: newDocument });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error adding document: ${error}` })
            console.error("Error adding document:", error)
        }
    }

    public async editDocument(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { title, author, crop_type_id, livestock_type_id, machine_type_id, crop_id, livestock_id, machine_id, fish_id } = req.body;
            
            const files = req.files as Express.Multer.File[];
            console.log(`Received ${files ? files.length : 0} files`);
                
            const existingDocument = (await DocumentService.getDocumentById(id)).document;
    
            if (!existingDocument) {
                res.status(404).json({ message: 'Document not found' })
            }
                
            const newFileUrls = files ? files.map((file) => file.path) : [];
            const file_urls = [...existingDocument!.file_urls, ...newFileUrls];
                
            const updatedDocument = (await DocumentService.updateDocument(id, title, author, file_urls, crop_type_id, livestock_type_id, machine_type_id, crop_id, livestock_id, machine_id, fish_id));
    
            res.status(200).json({ message: 'Document updated successfully', data: updatedDocument });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error editing document: ${error}` })
            console.error("Error editing document:", error)
        }
    }

    public async deleteDocument(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const ids = Array.isArray(id) ? id : [id];

            await DocumentService.deleteDocuments(ids);

            res.status(200).json({ message: 'Document(s) deleted successfully' })
        } catch (error) {
            res.status(500).json({ message: `Error deleting document(s): ${error}` })
            console.error("Error deleting document(s):", error)
        }
    }
}
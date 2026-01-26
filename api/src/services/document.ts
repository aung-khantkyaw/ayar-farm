import { prisma } from "../prisma/client";
import { deleteFile } from "../utils";

export class DocumentService {
    public static async getAllDocuments(): Promise<{ documents: any }> {
        try {
            const documents = await prisma.documents.findMany({
                orderBy: { created_at: 'asc' }
            })

            return { documents }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getDocumentById(id: string): Promise<{ document: any }> {
        try {
            const document = await prisma.documents.findUnique({
                where: { id }
            });

            return { document };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getDocumentByArticleOrAgrometBulletin(article: boolean, agromet_bulletin: boolean): Promise<{ documents: any }> {
        try {
            let documents;

            if (article) {
                documents = await prisma.documents.findMany({
                    where: { article: true },
                    orderBy: { created_at: 'asc' }
                })
            }
            if (agromet_bulletin) {
                documents = await prisma.documents.findMany({
                    where: { agromet_bulletin: true },
                    orderBy: { created_at: 'asc' }
                })
            }
            
            return { documents }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getAllDocumentByType(type: string): Promise<{ documents: any }> {
        try {
            let documents;
            if (type === "crop") {
                documents = await prisma.documents.findMany({
                    where: {
                        OR: [
                            { crop_type_id: { not: null } },
                            { crop_id: { not: null } }
                        ]
                    },
                    include: {
                        CropTypes: true,
                        Crops: true
                    },
                    orderBy: { created_at: 'asc' }
                });
            } else if (type === "livestock") {
                documents = await prisma.documents.findMany({
                    where: {
                        livestock_id: { not: null }
                    },
                    include: {
                        Livestocks: true
                    },
                    orderBy: { created_at: 'asc' }
                });
            } else if (type === "fish") {
                documents = await prisma.documents.findMany({
                    where: {
                        fish_id: { not: null }
                    },
                    include: {
                        Fishs: true
                    },
                    orderBy: { created_at: 'asc' }
                });
            } else if (type === "machine") {
                documents = await prisma.documents.findMany({
                    where: {
                        OR: [
                            { machine_type_id: { not: null } },
                            { machine_id: { not: null } }
                        ]
                    },
                    include: {
                        MachineTypes: true,
                        Machines: true
                    },
                    orderBy: { created_at: 'asc' }
                });
            }

            return { documents }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getAllDocumentByTypeId(type: string, type_id: string): Promise<{ documents: any }> {
        try {
            let documents;
            if (type === "crop") {
                documents = type_id ? (await prisma.documents.findMany({
                    where: {
                        crop_id: type_id
                    },
                    include: {
                        CropTypes: true,
                        Crops: true
                    },
                    orderBy: { created_at: 'asc' }
                })) : (await prisma.documents.findMany({
                    where: {
                        OR: [
                            { crop_type_id: { not: null } },
                            { crop_id: { not: null } }
                        ]
                    },
                    include: {
                        CropTypes: true,
                        Crops: true
                    },
                    orderBy: { created_at: 'asc' }
                }))
            } else if (type === "livestock") {
                documents = type_id ? (await prisma.documents.findMany({
                    where: {
                        livestock_id: type_id
                    },
                    include: {
                        Livestocks: true
                    },
                    orderBy: { created_at: 'asc' }
                })) : (await prisma.documents.findMany({
                    where: {
                        livestock_id: { not: null } 
                    },
                    include: {
                        Livestocks: true
                    },
                    orderBy: { created_at: 'asc' }
                }));
            } else if (type === "fish") {
                documents = type_id ? (await prisma.documents.findMany({
                    where: {
                        fish_id: type_id
                    },
                    include: {
                        Fishs: true
                    },
                    orderBy: { created_at: 'asc' }
                })) : (await prisma.documents.findMany({
                    where: {
                        fish_id: { not: null }
                    },
                    include: {
                        Fishs: true
                    },
                    orderBy: { created_at: 'asc' }
                }));
            } else if (type === "machine") {
                documents = type_id ? (await prisma.documents.findMany({
                    where: {
                        machine_id: type_id
                    },
                    include: {
                        MachineTypes: true,
                        Machines: true
                    },
                    orderBy: { created_at: 'asc' }
                })) : (await prisma.documents.findMany({
                    where: {
                        OR: [
                            { machine_type_id: { not: null } },
                            { machine_id: { not: null } }
                        ]
                    },
                    include: {
                        MachineTypes: true,
                        Machines: true
                    },
                    orderBy: { created_at: 'asc' }
                }));
            }

            return { documents }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async addNewDocument(title: string, author: string, file_urls: string[], size: number, crop_type_id: string, livestock_type_id: string, machine_type_id: string, crop_id: string, livestock_id: string, machine_id: string, fish_id: string, article: boolean, agromet_bulletin: boolean ): Promise<{ document: any }> {
        try {
            const document = await prisma.documents.create({
                data: {
                    title,
                    author,
                    file_urls,
                    size,
                    crop_type_id: crop_type_id || null,
                    machine_type_id: machine_type_id || null,
                    crop_id: crop_id || null,
                    livestock_id: livestock_id || null,
                    machine_id: machine_id || null,
                    fish_id: fish_id || null,
                    article,
                    agromet_bulletin
                }
            })

            return { document };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async updateDocument(id: string, title: string, author: string, file_urls: string[], crop_type_id: string, livestock_type_id: string, machine_type_id: string, crop_id: string, livestock_id: string, machine_id: string, fish_id: string, article: boolean, agromet_bulletin: boolean  ): Promise<{ document: any }> {
        try {
            const document = await prisma.documents.update({
                where: { id },
                data: {
                    title,
                    author,
                    file_urls,
                    crop_type_id: crop_type_id || null,
                    machine_type_id: machine_type_id || null,
                    crop_id: crop_id || null,
                    livestock_id: livestock_id || null,
                    machine_id: machine_id || null,
                    fish_id: fish_id || null,
                    article,
                    agromet_bulletin
                }
            })

            return { document };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async deleteDocuments(ids: string[]): Promise<void> {
        try {
            for (const documentId of ids) {
                const document = await prisma.documents.findUnique({
                    where: { id: documentId },
                });
                if (document) {
                    await deleteFile(document.file_urls);
                    await prisma.documents.delete({
                        where: { id: documentId },
                    });
                }
            }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }
}
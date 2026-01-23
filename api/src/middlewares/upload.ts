import fs from 'fs';
import multer, { StorageEngine } from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Request } from 'express';
import path from 'path';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const baseFolder = process.env.CLOUDINARY_FOLDER || 'AyarFarm';

const uploadDir = path.join(process.cwd(), 'upload');

const ensureUploadDir = (): void => {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
};

const apkDiskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadDir();
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${Date.now()}${ext}`);
    },
});

const createApkAwareStorage = (cloudinaryStorage: StorageEngine): StorageEngine => ({
    _handleFile(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.apk') {
            ensureUploadDir();
            (apkDiskStorage as any)._handleFile(req, file, cb);
        } else {
            (cloudinaryStorage as any)._handleFile(req, file, cb);
        }
    },
    _removeFile(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.apk' && typeof (apkDiskStorage as any)._removeFile === 'function') {
            (apkDiskStorage as any)._removeFile(req, file, cb);
        } else if (typeof (cloudinaryStorage as any)._removeFile === 'function') {
            (cloudinaryStorage as any)._removeFile(req, file, cb);
        } else {
            cb(null);
        }
    },
});

const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: `${baseFolder}/images`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    } as any,
});

const videoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: `${baseFolder}/videos`,
        allowed_formats: ['mp4', 'avi', 'mov', 'mkv'],
        resource_type: 'video',
    } as any,
});

const fileCloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        return {
            folder: `${baseFolder}/files`,
            resource_type: 'raw',
            public_id: `${name}-${Date.now()}${ext}`,
        };
    }
});

const fileStorage = createApkAwareStorage(fileCloudinaryStorage);

const resourceCloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);

        if (file.mimetype.startsWith('image/')) {
            return {
                folder: `${baseFolder}/images`,
                resource_type: 'image',
                public_id: `${name}-${Date.now()}`,
            };
        } else if (file.mimetype.startsWith('video/')) {
            return {
                folder: `${baseFolder}/videos`,
                resource_type: 'video',
                public_id: `${name}-${Date.now()}`,
            };
        } else {
            return {
                folder: `${baseFolder}/files`,
                resource_type: 'raw',
                public_id: `${name}-${Date.now()}${ext}`,
            };
        }
    }
});

const resourceStorage = createApkAwareStorage(resourceCloudinaryStorage);

export const uploadImage = multer({ storage: imageStorage });
export const uploadVideo = multer({ storage: videoStorage });
export const uploadFile = multer({ storage: fileStorage });
export const uploadResource = multer({ storage: resourceStorage });
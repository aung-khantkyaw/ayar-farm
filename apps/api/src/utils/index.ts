import { v2 as cloudinary } from 'cloudinary';

export const formatDate = (date: Date, format: string): string => {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

export const isEmpty = (value: any): boolean => {
    return value === null || value === undefined || (typeof value === 'object' && Object.keys(value).length === 0);
};

export const generateOTP = (length: number = 6): string => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getPublicIdFromUrl = (url: string, resourceType: 'image' | 'video' | 'raw'): string => {
    try {
        const decodedUrl = decodeURIComponent(url);

        if (resourceType === 'raw') {
            const regex = /\/v\d+\/(.+)$/i;
            const match = decodedUrl.match(regex);
            return match ? match[1] : decodedUrl;
        }

        // Matches pattern like /v1234567890/folder/filename.ext
        // Captures 'folder/filename'
        const regex = /\/v\d+\/(.+)\.[a-z0-9]+$/i;
        const match = decodedUrl.match(regex);
        return match ? match[1] : decodedUrl;
    } catch (error) {
        return url;
    }
};

const deleteResource = async (urlOrPublicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') => {
    if (!urlOrPublicId) return;
    
    const publicId = getPublicIdFromUrl(urlOrPublicId, resourceType);
    
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`Deleted ${resourceType} (${publicId}):`, result.result);
    } catch (error) {
        console.error(`Error deleting ${resourceType} ${publicId}:`, error);
    }
};

export const deleteImage = async (urls: string | string[]) => {
    const list = Array.isArray(urls) ? urls : [urls];
    if (list.length === 0) return;
    await Promise.all(list.map(url => deleteResource(url, 'image')));
};

export const deleteVideo = async (urls: string | string[]) => {
    const list = Array.isArray(urls) ? urls : [urls];
    if (list.length === 0) return;
    await Promise.all(list.map(url => deleteResource(url, 'video')));
};

export const deleteFile = async (urls: string | string[]) => {
    const list = Array.isArray(urls) ? urls : [urls];
    if (list.length === 0) return;
    await Promise.all(list.map(url => deleteResource(url, 'raw')));
};

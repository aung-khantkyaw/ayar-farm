"use client";

import { createContext, useContext } from "react";
import type { Crop, CropType, Document } from "@/lib/interface";

export interface CropContextType {
  // Data
  cropTypes: CropType[];
  crops: Crop[];
  documents: Document[];

  // Loading states
  isLoading: boolean;
  isUploadingFile: boolean;
  error: string | null;

  // Fetch functions
  fetchCropTypes: () => Promise<CropType[]>;
  fetchCrops: () => Promise<Crop[]>;
  fetchDocuments: () => Promise<Document[]>;
  refreshAll: () => Promise<void>;

  // CRUD operations for Crop Types
  createCropType: (data: FormData) => Promise<boolean>;
  updateCropType: (id: string, data: FormData) => Promise<boolean>;
  deleteCropType: (id: string) => Promise<boolean>;
  bulkDeleteCropTypes: (ids: string[]) => Promise<boolean>;

  // CRUD operations for Crops
  createCrop: (data: FormData) => Promise<boolean>;
  updateCrop: (id: string, data: FormData) => Promise<boolean>;
  deleteCrop: (id: string) => Promise<boolean>;
  bulkDeleteCrops: (ids: string[]) => Promise<boolean>;

  // CRUD operations for Documents
  createDocument: (data: FormData) => Promise<boolean>;
  updateDocument: (id: string, data: FormData) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;

  // Utility functions
  getCropTypeById: (id: string) => CropType | undefined;
  getCropById: (id: string) => Crop | undefined;
  getDocumentById: (id: string) => Document | undefined;
  getCropsByType: (typeId: string) => Crop[];
  getDocumentsByCropType: (typeId: string) => Document[];
  getDocumentsByCrop: (typeId: string) => Document[];
  getTotalCropTypes: () => number;
  getTotalCrops: () => number;
  getTotalDocuments: () => number;
}

export const CropContext = createContext<CropContextType | undefined>(
  undefined
);

export const useCrop = (): CropContextType => {
  const context = useContext(CropContext);
  if (context === undefined) {
    throw new Error("useCrop must be used within a CropProvider");
  }
  return context;
};

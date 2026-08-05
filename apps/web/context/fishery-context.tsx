"use client";

import { createContext, useContext } from "react";
import type { Fishery, Document } from "@/lib/interface";

export interface FisheryContextType {
  fisheries: Fishery[];
  documents: Document[];

  isLoading: boolean;
  isUploadingFile: boolean;
  error: string | null;

  fetchFisheries: () => Promise<void>;
  fetchDocuments: () => Promise<Document[]>;
  refreshAll: () => Promise<void>;

  createFishery: (data: FormData) => Promise<boolean>;
  updateFishery: (id: string, data: FormData) => Promise<boolean>;
  deleteFishery: (id: string) => Promise<boolean>;
  bulkDeleteFisheries: (ids: string[]) => Promise<boolean>;

  createDocument: (data: FormData) => Promise<boolean>;
  updateDocument: (id: string, data: FormData) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;

  getFisheryById: (id: string) => Fishery | undefined;
  getDocumentById: (id: string) => Document | undefined;
  getTotalFisheriesCount: () => number;
  getTotalDocumentsCount: () => number;
}

export const FisheryContext = createContext<FisheryContextType | undefined>(
  undefined
);

export const useFishery = (): FisheryContextType => {
  const context = useContext(FisheryContext);
  if (context === undefined) {
    throw new Error("useFishery must be used within a FisheryProvider");
  }
  return context;
};

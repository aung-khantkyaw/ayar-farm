"use client";

import { createContext, useContext } from "react";
import type { Livestock, Document } from "@/lib/interface";

export interface LivestockContextType {
  livestocks: Livestock[];
  documents: Document[];

  isLoading: boolean;
  isUploadingFile: boolean;
  error: string | null;

  fetchLivestock: () => Promise<void>;
  fetchDocuments: () => Promise<Document[]>;
  refreshAll: () => Promise<void>;

  createLivestock: (data: FormData) => Promise<boolean>;
  updateLivestock: (id: string, data: FormData) => Promise<boolean>;
  deleteLivestock: (id: string) => Promise<boolean>;
  bulkDeleteLivestock: (ids: string[]) => Promise<boolean>;

  createDocument: (data: FormData) => Promise<boolean>;
  updateDocument: (id: string, data: FormData) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;

  getLivestockById: (id: string) => Livestock | undefined;
  getDocumentById: (id: string) => Document | undefined;
  getTotalLivestockCount: () => number;
  getTotalDocumentsCount: () => number;
}

export const LivestockContext = createContext<LivestockContextType | undefined>(
  undefined
);

export const useLivestock = () => {
  const context = useContext(LivestockContext);
  if (context === undefined) {
    throw new Error("useLivestock must be used within a LivestockProvider");
  }
  return context;
};

"use client";

import { createContext, useContext } from "react";
import type { MachineType, Machine, Document } from "@/lib/interface";

export interface MachineContextType {
  // Data
  machineTypes: MachineType[];
  machines: Machine[];
  documents: Document[];

  // Loading state
  isLoading: boolean;
  isUploadingFile: boolean;
  error: string | null;

  // Fetch functions
  fetchMachineTypes: () => Promise<MachineType[]>;
  fetchMachines: () => Promise<Machine[]>;
  fetchDocuments: () => Promise<Document[]>;
  refreshAll: () => Promise<void>;

  // CRUD operations for Machine Types
  createMachineType: (data: FormData) => Promise<boolean>;
  updateMachineType: (id: string, data: FormData) => Promise<boolean>;
  deleteMachineType: (id: string) => Promise<boolean>;
  bulkDeleteMachineTypes: (ids: string[]) => Promise<boolean>;

  // CRUD operations for Machines
  createMachine: (data: FormData) => Promise<boolean>;
  updateMachine: (id: string, data: FormData) => Promise<boolean>;
  deleteMachine: (id: string) => Promise<boolean>;
  bulkDeleteMachines: (ids: string[]) => Promise<boolean>;

  // CRUD operations for Documents
  createDocument: (data: FormData) => Promise<boolean>;
  updateDocument: (id: string, data: FormData) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;

  // Utility functions
  getMachineTypeById: (id: string) => MachineType | undefined;
  getMachineById: (id: string) => Machine | undefined;
  getDocumentById: (id: string) => Document | undefined;
  getMachinesByType: (typeId: string) => Machine[];
  getTotalMachineTypes: () => number;
  getTotalMachines: () => number;
  getTotalDocumentsCount: () => number;
}

export const MachineContext = createContext<MachineContextType | undefined>(
  undefined
);

export const useMachine = (): MachineContextType => {
  const context = useContext(MachineContext);
  if (context === undefined) {
    throw new Error("useMachine must be used within a MachineProvider");
  }
  return context;
};

import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

import type { MachineType, Machine, Document } from "@/lib/interface";
import {
  MachineContext,
  type MachineContextType,
} from "@/context/machine-context";

export const MachineProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMachineTypes = async (): Promise<MachineType[]> => {
    try {
      setError(null);
      const response = await api.get("/agriindustry/machinetypes");
      const data = response.data;

      if (Array.isArray(data)) {
        setMachineTypes(data);
        return data;
      } else if (data && data.machineTypes) {
        setMachineTypes(data.machineTypes);
        return data.machineTypes;
      } else {
        if (!data) {
          setMachineTypes([]);
          return [];
        }
        console.warn("Unexpected response format for machine types:", response);
        return [];
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching machine types";
      setError(errorMessage);
      console.error("Error fetching machine types:", errorMessage);
      throw error;
    }
  };

  const fetchMachines = async (): Promise<Machine[]> => {
    try {
      setError(null);
      const response = await api.get("/agriindustry/machines");
      const data = response.data;

      if (Array.isArray(data)) {
        const fetchedMachines = data.map((machine: any) => ({
          ...machine,
          type: machine.MachineTypes,
          type_id: machine.machine_type_id,
        }));
        setMachines(fetchedMachines);
        return fetchedMachines;
        // setMachines(data);
        // return data;
      } else if (data && data.machines) {
        const fetchedMachines = data.crops.map((machine: any) => ({
          ...machine,
          type: machine.MachineTypes,
          type_id: machine.machine_type_id,
        }));
        setMachines(fetchedMachines);
        return fetchedMachines;
        // setMachines(data.machines);
        // return data.machines;
      } else {
        if (!data) {
          setMachines([]);
          return [];
        }
        console.warn("Unexpected response format for machines:", response);
        return [];
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching machines";
      setError(errorMessage);
      console.error("Error fetching machines:", errorMessage);
      throw error;
    }
  };

  const fetchDocuments = async (): Promise<Document[]> => {
    try {
      setError(null);
      const response = await api.get("/document/documents?type=machine");
      const data = response.documents;

      if (Array.isArray(data)) {
        setDocuments(data);
        return data;
      } else if (response.data && Array.isArray(response.data)) {
        setDocuments(response.data);
        return response.data;
      } else {
        if (!data) {
          setDocuments([]);
          return [];
        }
        console.warn("Unexpected response format for documents:", response);
        return [];
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch documents";
      setError(errorMessage);
      console.error("Fetch documents error:", err);
      throw err;
    }
  };

  const refreshAll = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchMachineTypes(),
        fetchMachines(),
        fetchDocuments(),
      ]);

      const failures = results.filter((result) => result.status === "rejected");

      if (failures.length === 0) {
        toast.success("Data Fetched successfully");
      } else if (failures.length === results.length) {
        toast.error("Failed to fetch data - server or database may be offline");
      } else {
        toast.warning(
          `Partially fetched - ${failures.length} of ${results.length} requests failed`,
        );
      }
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error("Refresh all error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createMachineType = async (data: FormData): Promise<boolean> => {
    try {
      setIsUploadingFile(true);
      const token = localStorage.getItem("token");
      const response = await api.post(
        "/agriindustry/machinetypes",
        data,
        token || undefined,
      );

      const result = response.data;
      if (result) {
        setMachineTypes((prev) => [...prev, result]);
        toast.success("Machine type created successfully");
        return true;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create machine type";
      setError(errorMessage);
      console.error("Create machine type error:", errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUploadingFile(false);
    }
  };

  const updateMachineType = async (
    id: string,
    data: FormData,
  ): Promise<boolean> => {
    try {
      setIsUploadingFile(true);
      const token = localStorage.getItem("token");
      const response = await api.put(
        `/agriindustry/machinetypes/${id}`,
        data,
        token || undefined,
      );

      const result = response.data;
      if (result) {
        setMachineTypes((prev) =>
          prev.map((type) => (type.id === id ? result : type)),
        );
        toast.success("Machine type updated successfully");
        return true;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update machine type";
      setError(errorMessage);
      console.error("Update machine type error:", errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUploadingFile(false);
    }
  };

  const deleteMachineType = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/agriindustry/machinetypes/${id}`, token || undefined);
      setMachineTypes((prev) => prev.filter((type) => type.id !== id));
      toast.success("Machine type deleted successfully");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete machine type";
      setError(errorMessage);
      console.error("Delete machine type error:", errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const bulkDeleteMachineTypes = async (ids: string[]): Promise<boolean> => {
    try {
      console.log("Selected Crop Types for bulk delete:", ids);

      const token = localStorage.getItem("token");
      const response = await api.delete(
        `/agriindustry/machinetypes`,
        token || undefined,
        { ids },
      );

      if (response && !response.error) {
        toast.success(`${ids.length} machine types deleted successfully`);
        await Promise.all([fetchMachineTypes(), fetchMachines()]);
        return true;
      } else {
        throw new Error(response.error || "Failed to delete machine types");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete machine types";
      toast.error(errorMessage);
      return false;
    }
  };

  const createMachine = async (data: FormData): Promise<boolean> => {
    try {
      setIsUploadingFile(true);
      const token = localStorage.getItem("token");
      const response = await api.post(
        "/agriindustry/machines",
        data,
        token || undefined,
      );

      const result = response.data;
      if (result) {
        setMachines((prev) => [...prev, result]);
        toast.success("Machine created successfully");
        return true;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create machine";
      setError(errorMessage);
      console.error("Create machine error:", errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUploadingFile(false);
    }
  };

  const updateMachine = async (
    id: string,
    data: FormData,
  ): Promise<boolean> => {
    try {
      setIsUploadingFile(true);
      const token = localStorage.getItem("token");
      const response = await api.put(
        `/agriindustry/machines/${id}`,
        data,
        token || undefined,
      );

      const result = response.data;
      if (result) {
        setMachines((prev) =>
          prev.map((machine) => (machine.id === id ? result : machine)),
        );
        toast.success("Machine updated successfully");
        return true;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update machine";
      setError(errorMessage);
      console.error("Update machine error:", errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUploadingFile(false);
    }
  };

  const deleteMachine = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/agriindustry/machines/${id}`, token || undefined);
      setMachines((prev) => prev.filter((machine) => machine.id !== id));
      toast.success("Machine deleted successfully");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete machine";
      setError(errorMessage);
      console.error("Delete machine error:", errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const bulkDeleteMachines = async (ids: string[]): Promise<boolean> => {
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error("Invalid request: IDs array is required");
      }

      const token = localStorage.getItem("token");
      const response = await api.delete(
        "/agriindustry/machines",
        token || undefined,
        { ids },
      );

      if (response && !response.error) {
        toast.success(`${ids.length} machines deleted successfully`);
        await fetchMachines();
        return true;
      } else {
        throw new Error(response.error || "Failed to delete machines");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete machines";
      toast.error(errorMessage);
      return false;
    }
  };

  const createDocument = async (formData: FormData): Promise<boolean> => {
    try {
      setIsUploadingFile(true);
      const token = localStorage.getItem("token");
      const response = await api.post(
        "/document/documents",
        formData,
        token || undefined,
      );

      if (response && !response.error) {
        toast.success("Document uploaded successfully");
        await fetchDocuments();
        return true;
      } else {
        throw new Error("Failed to upload document");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload document";
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUploadingFile(false);
    }
  };

  const updateDocument = async (
    id: string,
    formData: FormData,
  ): Promise<boolean> => {
    try {
      setIsUploadingFile(true);
      const token = localStorage.getItem("token");
      const response = await api.put(
        `/document/documents/${id}`,
        formData,
        token || undefined,
      );

      if (response && !response.error) {
        toast.success("Document updated successfully");
        await fetchDocuments();
        return true;
      } else {
        throw new Error("Failed to update document");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update document";
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUploadingFile(false);
    }
  };

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.delete(
        `/document/documents/${id}`,
        token || undefined,
      );
      if (response && !response.error) {
        toast.success("Document deleted successfully");
        await fetchDocuments();
        return true;
      } else {
        throw new Error("Failed to delete document");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete document";
      toast.error(errorMessage);
      return false;
    }
  };

  const getMachineTypeById = (id: string): MachineType | undefined => {
    return machineTypes.find((type) => type.id === id);
  };

  const getMachineById = (id: string): Machine | undefined => {
    return machines.find((machine) => machine.id === id);
  };

  const getDocumentById = (id: string): Document | undefined => {
    return documents.find((doc) => doc.id === id);
  };

  const getMachinesByType = (typeId: string): Machine[] => {
    return machines.filter((machine) => machine.type_id === typeId);
  };

  const getTotalMachineTypes = (): number => {
    return machineTypes.length;
  };

  const getTotalMachines = (): number => {
    return machines.length;
  };

  const getTotalDocumentsCount = (): number => {
    const machineDocuments = documents.filter(
      (doc) => doc.machine_id || doc.machine_type_id,
    );
    return machineDocuments.length;
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const value: MachineContextType = {
    machineTypes,
    machines,
    documents,

    isLoading,
    isUploadingFile,
    error,

    fetchMachineTypes,
    fetchMachines,
    fetchDocuments,
    refreshAll,

    createMachineType,
    updateMachineType,
    deleteMachineType,
    bulkDeleteMachineTypes,

    createMachine,
    updateMachine,
    deleteMachine,
    bulkDeleteMachines,

    createDocument,
    updateDocument,
    deleteDocument,

    getMachineTypeById,
    getMachineById,
    getDocumentById,
    getMachinesByType,
    getTotalMachineTypes,
    getTotalMachines,
    getTotalDocumentsCount,
  };

  return (
    <MachineContext.Provider value={value}>{children}</MachineContext.Provider>
  );
};

export default MachineProvider;

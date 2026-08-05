"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

import type { Livestock, Document } from "@/lib/interface";
import { LivestockContext } from "@/context/livestock-context";

const LivestockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [livestocks, setLivestocks] = useState<Livestock[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLivestock = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/livestockindustry/livestocks");
      setLivestocks(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(async (): Promise<Document[]> => {
    try {
      setError(null);
      const response = await api.get("/document/documents?type=livestock");
      const fetchedDocuments = response.documents || [];
      setDocuments(fetchedDocuments);
      return fetchedDocuments;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch documents";
      setError(errorMessage);
      console.error("Fetch documents error:", err);
      throw err;
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchLivestock(),
        fetchDocuments(),
      ]);

      const failures = results.filter((result) => result.status === "rejected");

      let totalDataCount = 0;
      // Count livestock
      if (livestocks.length > 0) totalDataCount += livestocks.length;
      // Count documents
      if (documents.length > 0) totalDataCount += documents.length;

      if (failures.length === 0) {
        if (totalDataCount > 0) {
          toast.success("Data Fetched successfully!");
        } else {
          toast.info("Data Fetched - no records found");
        }
      } else if (failures.length === results.length) {
        toast.error(
          "Failed to fetch all data - server or database may be offline",
        );
      } else {
        toast.warning(
          `Partially fetched - ${failures.length} of ${results.length} requests failed`,
        );
      }
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error("Error refreshing data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchLivestock, fetchDocuments, livestocks.length, documents.length]);

  // CRUD operations for Livestock
  const createLivestock = useCallback(
    async (data: FormData): Promise<boolean> => {
      setIsUploadingFile(true);
      try {
        const token = localStorage.getItem("token");
        const response = await api.post(
          "/livestockindustry/livestocks",
          data,
          token || undefined,
        );
        toast.success("Livestock created successfully!");
        setLivestocks((prev) => [response.data, ...prev]);
        return true;
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || err.message || "Unknown error",
        );
        return false;
      } finally {
        setIsUploadingFile(false);
      }
    },
    [],
  );

  const updateLivestock = useCallback(
    async (id: string, data: FormData): Promise<boolean> => {
      setIsUploadingFile(true);
      try {
        const token = localStorage.getItem("token");
        const response = await api.put(
          `/livestockindustry/livestocks/${id}`,
          data,
          token || undefined,
        );
        toast.success("Livestock updated successfully!");
        setLivestocks((prev) =>
          prev.map((item) => (item.id === id ? response.data : item)),
        );
        return true;
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || err.message || "Unknown error",
        );
        return false;
      } finally {
        setIsUploadingFile(false);
      }
    },
    [],
  );

  const deleteLivestock = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(
        `/livestockindustry/livestocks/${id}`,
        token || undefined,
      );
      toast.success("Livestock deleted successfully!");
      setLivestocks((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || "Unknown error",
      );
      return false;
    }
  }, []);

  const bulkDeleteLivestock = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          throw new Error("Invalid request: IDs array is required");
        }

        const token = localStorage.getItem("token");
        const response = await api.delete(
          "/livestockindustry/livestocks/",
          token || undefined,
          { ids },
        );

        if (response && !response.error) {
          toast.success(`${ids.length} livestocks deleted successfully`);
          await fetchLivestock();
          return true;
        } else {
          throw new Error(response.error || "Failed to delete livestocks");
        }
      } catch (err: any) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete Livestock";
        toast.error(errorMessage);
        return false;
      }
    },
    [fetchLivestock],
  );

  // CRUD operations for Documents
  const createDocument = useCallback(
    async (data: FormData): Promise<boolean> => {
      setIsUploadingFile(true);
      try {
        const token = localStorage.getItem("token");
        const response = await api.post(
          "/document/documents",
          data,
          token || undefined,
        );
        toast.success("Document created successfully!");
        setDocuments((prev) => [response.data, ...prev]);
        return true;
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || err.message || "Unknown error",
        );
        return false;
      } finally {
        setIsUploadingFile(false);
      }
    },
    [],
  );

  const updateDocument = useCallback(
    async (id: string, data: FormData): Promise<boolean> => {
      setIsUploadingFile(true);
      try {
        const token = localStorage.getItem("token");
        const response = await api.put(
          `/document/documents/${id}`,
          data,
          token || undefined,
        );
        toast.success("Document updated successfully!");
        setDocuments((prev) =>
          prev.map((item) => (item.id === id ? response.data : item)),
        );
        return true;
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || err.message || "Unknown error",
        );
        return false;
      } finally {
        setIsUploadingFile(false);
      }
    },
    [],
  );

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/document/documents/${id}`, token || undefined);
      toast.success("Document deleted successfully!");
      setDocuments((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || "Unknown error",
      );
      return false;
    }
  }, []);

  const getLivestockById = useCallback(
    (id: string) => livestocks.find((l) => l.id === id),
    [livestocks],
  );

  const getDocumentById = useCallback(
    (id: string) => documents.find((d) => d.id === id),
    [documents],
  );

  const getTotalLivestockCount = useCallback(
    () => livestocks.length,
    [livestocks],
  );
  const getTotalDocumentsCount = useCallback(
    () => documents.length,
    [documents],
  );

  useEffect(() => {
    fetchLivestock();
    fetchDocuments();
  }, []);

  const value = useMemo(
    () => ({
      livestocks,
      documents,
      isLoading,
      isUploadingFile,
      error,
      fetchLivestock,
      fetchDocuments,
      refreshAll,
      createLivestock,
      updateLivestock,
      deleteLivestock,
      bulkDeleteLivestock,
      createDocument,
      updateDocument,
      deleteDocument,
      getLivestockById,
      getDocumentById,
      getTotalLivestockCount,
      getTotalDocumentsCount,
    }),
    [
      livestocks,
      documents,
      isLoading,
      isUploadingFile,
      error,
      fetchLivestock,
      fetchDocuments,
      refreshAll,
      createLivestock,
      updateLivestock,
      deleteLivestock,
      bulkDeleteLivestock,
      createDocument,
      updateDocument,
      deleteDocument,
      getLivestockById,
      getDocumentById,
      getTotalLivestockCount,
      getTotalDocumentsCount,
    ],
  );

  return (
    <LivestockContext.Provider value={value}>
      {children}
    </LivestockContext.Provider>
  );
};

export default LivestockProvider;

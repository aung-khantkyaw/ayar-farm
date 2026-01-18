import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import type { Fishery, Document } from "@/lib/interface";
import { api } from "@/lib/api";
import { FisheryContext } from "@/context/fishery-context";

export const FisheryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [fisheries, setFisheries] = useState<Fishery[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFisheries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/fishery/fishs");
      setFisheries(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(async (): Promise<Document[]> => {
    try {
      setError(null);
      const response = await api.get("/document/documents?type=fish");
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
        fetchFisheries(),
        fetchDocuments(),
      ]);

      const failures = results.filter((result) => result.status === "rejected");
      const successes = results.filter(
        (result) => result.status === "fulfilled",
      );

      let totalDataCount = 0;
      successes.forEach((result) => {
        if (result.value && Array.isArray(result.value)) {
          totalDataCount += result.value.length;
        }
      });

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
  }, [fetchFisheries, fetchDocuments]);

  // CRUD operations for Fisheries
  const createFishery = useCallback(
    async (data: FormData): Promise<boolean> => {
      setIsUploadingFile(true);
      try {
        const token = localStorage.getItem("token");
        const response = await api.post(
          "/fishery/fishs",
          data,
          token || undefined,
        );
        toast.success("Fishery created successfully");
        setFisheries((prev) => [response.data, ...prev]);
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

  const updateFishery = useCallback(
    async (id: string, data: FormData): Promise<boolean> => {
      setIsUploadingFile(true);
      try {
        const token = localStorage.getItem("token");
        const response = await api.put(
          `/fishery/fishs/${id}`,
          data,
          token || undefined,
        );
        toast.success("Fishery updated successfully");
        setFisheries((prev) =>
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

  const deleteFishery = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/fishery/fishs/${id}`, token || undefined);
      toast.success("Fishery deleted successfully");
      setFisheries((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || "Unknown error",
      );
      return false;
    }
  }, []);

  const bulkDeleteFisheries = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          throw new Error("Invalid request: IDs array is required");
        }

        const token = localStorage.getItem("token");
        const response = await api.delete(
          `/fishery/fishs`,
          token || undefined,
          { ids },
        );

        if (response && !response.error) {
          toast.success(`${ids.length} fishes deleted successfully`);
          await fetchFisheries();
          return true;
        } else {
          throw new Error(response.error || "Failed to delete fishes");
        }
      } catch (err: any) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete fishes";
        toast.error(errorMessage);
        return false;
      }
    },
    [fetchFisheries],
  );

  const getFisheryById = useCallback(
    (id: string): Fishery | undefined => {
      return fisheries.find((fishery) => fishery.id === id);
    },
    [fisheries],
  );

  const getTotalFisheriesCount = useCallback((): number => {
    return fisheries.length;
  }, [fisheries]);

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

  const getDocumentById = useCallback(
    (id: string): Document | undefined => {
      return documents.find((doc) => doc.id === id);
    },
    [documents],
  );

  const getTotalDocumentsCount = useCallback((): number => {
    const fisheryDocuments = documents.filter((doc) => doc.fish_id);
    return fisheryDocuments.length;
  }, [documents]);

  useEffect(() => {
    refreshAll();
  }, []);

  const value = useMemo(
    () => ({
      fisheries,
      documents,

      isLoading,
      isUploadingFile,
      error,

      fetchFisheries,
      fetchDocuments,
      refreshAll,

      createFishery,
      updateFishery,
      deleteFishery,
      bulkDeleteFisheries,

      createDocument,
      updateDocument,
      deleteDocument,

      getFisheryById,
      getDocumentById,
      getTotalFisheriesCount,
      getTotalDocumentsCount,
    }),
    [
      fisheries,
      documents,
      isLoading,
      isUploadingFile,
      error,
      fetchFisheries,
      fetchDocuments,
      refreshAll,
      createFishery,
      updateFishery,
      deleteFishery,
      bulkDeleteFisheries,
      createDocument,
      updateDocument,
      deleteDocument,
      getFisheryById,
      getDocumentById,
      getTotalFisheriesCount,
      getTotalDocumentsCount,
    ],
  );

  return (
    <FisheryContext.Provider value={value}>{children}</FisheryContext.Provider>
  );
};

export default FisheryProvider;

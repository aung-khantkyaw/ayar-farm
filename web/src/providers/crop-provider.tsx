import { api } from "@/lib/api";
import type { Crop, CropType, Document } from "@/lib/interface";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { CropContext, type CropContextType } from "@/context/crop-context";

const CropProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cropTypes, setCropTypes] = useState<CropType[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch functions
  const fetchCropTypes = useCallback(async (): Promise<CropType[]> => {
    try {
      setError(null);
      const response = await api.get("/cropsandpulses/croptypes/");
      const data = response.data;

      if (Array.isArray(data)) {
        setCropTypes(data);
        return data;
      } else if (data && data.cropTypes) {
        setCropTypes(data.cropTypes);
        return data.cropTypes;
      } else {
        if (!data) {
          setCropTypes([]);
          return [];
        }
        console.warn("Unexpected response format for crop types:", response);
        return [];
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch crop types";
      setError(errorMessage);
      console.error("Fetch crop types error:", err);
      throw err;
    }
  }, []);

  const fetchCrops = useCallback(async (): Promise<Crop[]> => {
    try {
      setError(null);
      const response = await api.get("/cropsandpulses/crops");
      const data = response.data;

      if (Array.isArray(data)) {
        const fetchedCrops = data.map((crop: any) => ({
          ...crop,
          type: crop.CropTypes,
          type_id: crop.crop_type_id,
        }));
        setCrops(fetchedCrops);
        return fetchedCrops;
      } else if (data && data.crops) {
        const fetchedCrops = data.crops.map((crop: any) => ({
          ...crop,
          type: crop.CropTypes,
          type_id: crop.crop_type_id,
        }));
        setCrops(fetchedCrops);
        return fetchedCrops;
      } else {
        if (!data) {
          setCrops([]);
          return [];
        }
        console.warn("Unexpected response format for crops:", response);
        return [];
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch crops";
      setError(errorMessage);
      console.error("Fetch crops error:", err);
      throw err;
    }
  }, []);

  const fetchDocuments = useCallback(async (): Promise<Document[]> => {
    try {
      setError(null);
      const response = await api.get("/document/documents?type=crop");
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
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use Promise.allSettled to get results of all promises regardless of success/failure
      const results = await Promise.allSettled([
        fetchCropTypes(),
        fetchCrops(),
        fetchDocuments(),
      ]);

      const failures = results.filter((result) => result.status === "rejected");
      const successes = results.filter(
        (result) => result.status === "fulfilled",
      );

      // Check the actual fetched data from successful promises
      let totalDataCount = 0;
      successes.forEach((result) => {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          totalDataCount += result.value.length;
        }
      });

      if (failures.length === 0) {
        if (totalDataCount > 0) {
          toast.success("Data Fetched successfully");
        } else {
          toast.info("Data Fetched - no records found");
        }
      } else if (failures.length === results.length) {
        toast.error("Failed to fetch data - server or database may be offline");
      } else {
        toast.warning(
          `Partially fetched - ${failures.length} of ${results.length} requests failed`,
        );
      }
    } catch (err) {
      toast.error("Failed to fetch data");
      console.error("Refresh all error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCropTypes, fetchCrops, fetchDocuments]);

  const createCropType = useCallback(
    async (formData: FormData): Promise<boolean> => {
      try {
        setIsUploadingFile(true);
        const token = localStorage.getItem("token");
        const response = await api.post(
          "/cropsandpulses/croptypes",
          formData,
          token || undefined,
        );

        const result = response.data;
        if (result) {
          setCropTypes((prev) => [...prev, result]);
          toast.success("Crop type created successfully");
          return true;
        } else {
          throw new Error(response.error || "Failed to create crop type");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create crop type";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsUploadingFile(false);
      }
    },
    [],
  );

  const updateCropType = useCallback(
    async (id: string, formData: FormData): Promise<boolean> => {
      try {
        setIsUploadingFile(true);
        const token = localStorage.getItem("token");
        const response = await api.put(
          `/cropsandpulses/croptypes/${id}`,
          formData,
          token || undefined,
        );

        const result = response.data;
        if (result) {
          setCropTypes((prev) =>
            prev.map((type) => (type.id === id ? result : type)),
          );
          toast.success("Crop type updated successfully");
          return true;
        } else {
          throw new Error(response.error || "Failed to update crop type");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update crop type";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsUploadingFile(false);
      }
    },
    [],
  );

  const deleteCropType = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/cropsandpulses/croptypes/${id}`, token || undefined);
      setCropTypes((prev) => prev.filter((type) => type.id !== id));
      toast.success("Crop type deleted successfully");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete crop type";
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const bulkDeleteCropTypes = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.delete(
          "/cropsandpulses/croptypes",
          token || undefined,
          { ids },
        );

        if (response && !response.error) {
          toast.success(`${ids.length} crop types deleted successfully`);
          await Promise.all([fetchCropTypes(), fetchCrops()]);
          return true;
        } else {
          throw new Error(response.error || "Failed to delete crop types");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete crop types";
        toast.error(errorMessage);
        return false;
      }
    },
    [fetchCropTypes, fetchCrops],
  );

  const createCrop = useCallback(
    async (formData: FormData): Promise<boolean> => {
      try {
        setIsUploadingFile(true);
        const token = localStorage.getItem("token");
        const response = await api.post(
          "/cropsandpulses/crops",
          formData,
          token || undefined,
        );

        const result = response.data;
        if (result) {
          const newCrop = {
            ...result,
            type: result.CropTypes,
            type_id: result.crop_type_id,
          };
          setCrops((prev) => [...prev, newCrop]);
          toast.success("Crop created successfully");
          return true;
        } else {
          throw new Error(response.error || "Failed to create crop");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create crop";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsUploadingFile(false);
      }
    },
    [],
  );

  const updateCrop = useCallback(
    async (id: string, formData: FormData): Promise<boolean> => {
      try {
        setIsUploadingFile(true);
        const token = localStorage.getItem("token");
        const response = await api.put(
          `/cropsandpulses/crops/${id}`,
          formData,
          token || undefined,
        );

        const result = response.data;
        if (result) {
          const updatedCrop = {
            ...result,
            type: result.CropTypes,
            type_id: result.crop_type_id,
          };
          setCrops((prev) =>
            prev.map((crop) => (crop.id === id ? updatedCrop : crop)),
          );
          toast.success("Crop updated successfully");
          return true;
        } else {
          throw new Error(response.error || "Failed to update crop");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update crop";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsUploadingFile(false);
      }
    },
    [],
  );

  const deleteCrop = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/cropsandpulses/crops/${id}`, token || undefined);
      setCrops((prev) => prev.filter((crop) => crop.id !== id));
      toast.success("Crop deleted successfully");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete crop";
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const bulkDeleteCrops = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          throw new Error("Invalid request: IDs array is required");
        }

        const token = localStorage.getItem("token");
        const response = await api.delete(
          "/cropsandpulses/crops",
          token || undefined,
          { ids },
        );

        if (response && !response.error) {
          toast.success(`${ids.length} crops deleted successfully`);
          await fetchCrops();
          return true;
        } else {
          throw new Error(response.error || "Failed to delete crops");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete crops";
        toast.error(errorMessage);
        return false;
      }
    },
    [fetchCrops],
  );

  // Document CRUD operations
  const createDocument = useCallback(
    async (formData: FormData): Promise<boolean> => {
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
          throw new Error(response.error || "Failed to upload document");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload document";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsUploadingFile(false);
      }
    },
    [fetchDocuments],
  );

  const updateDocument = useCallback(
    async (id: string, formData: FormData): Promise<boolean> => {
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
          throw new Error(response.error || "Failed to update document");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update document";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsUploadingFile(false);
      }
    },
    [fetchDocuments],
  );

  const deleteDocument = useCallback(
    async (id: string): Promise<boolean> => {
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
          throw new Error(response.error || "Failed to delete document");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete document";
        toast.error(errorMessage);
        return false;
      }
    },
    [fetchDocuments],
  );

  // Utility functions
  const getCropTypeById = useCallback(
    (id: string): CropType | undefined => {
      return cropTypes.find((type) => type.id === id);
    },
    [cropTypes],
  );

  const getCropById = useCallback(
    (id: string): Crop | undefined => {
      return crops.find((crop) => crop.id === id);
    },
    [crops],
  );

  const getCropsByType = useCallback(
    (typeId: string): Crop[] => {
      return crops.filter((crop) => crop.type_id === typeId);
    },
    [crops],
  );

  const getDocumentById = useCallback(
    (id: string): Document | undefined => {
      return documents.find((doc) => doc.id === id);
    },
    [documents],
  );

  const getDocumentsByCropType = useCallback(
    (typeId: string): Document[] => {
      return documents.filter((doc) => doc.crop_type_id === typeId);
    },
    [documents],
  );

  const getDocumentsByCrop = useCallback(
    (cropId: string): Document[] => {
      return documents.filter((doc) => doc.crop_id === cropId);
    },
    [documents],
  );

  const getTotalCropTypes = useCallback((): number => {
    return cropTypes.length;
  }, [cropTypes]);

  const getTotalCrops = useCallback((): number => {
    return crops.length;
  }, [crops]);

  const getTotalDocuments = useCallback((): number => {
    return documents.length;
  }, [documents]);

  // Auto-fetch data on mount
  useEffect(() => {
    refreshAll();
  }, []);

  const value = useMemo<CropContextType>(
    () => ({
      // Data
      cropTypes,
      crops,
      documents,

      // Loading states
      isLoading,
      isUploadingFile,
      error,

      // Fetch functions
      fetchCropTypes,
      fetchCrops,
      fetchDocuments,
      refreshAll,

      // CRUD operations for Crop Types
      createCropType,
      updateCropType,
      deleteCropType,
      bulkDeleteCropTypes,

      // CRUD operations for Crops
      createCrop,
      updateCrop,
      deleteCrop,
      bulkDeleteCrops,

      // CRUD operations for Documents
      createDocument,
      updateDocument,
      deleteDocument,

      // Utility functions
      getCropTypeById,
      getCropById,
      getDocumentById,
      getCropsByType,
      getDocumentsByCrop,
      getDocumentsByCropType,
      getTotalCropTypes,
      getTotalCrops,
      getTotalDocuments,
    }),
    [
      cropTypes,
      crops,
      documents,
      isLoading,
      isUploadingFile,
      error,
      // Functions are stable as they are defined inside the component but don't depend on state directly (except via closure, but we want them to be fresh if state changes? No, they use setState which is stable. But they use state variables inside? No, they use functional updates or don't use state. Wait, getCropTypeById uses cropTypes. So if cropTypes changes, we need new functions? No, the functions are defined in the render scope. If we memoize the value, we need to make sure the functions capture the latest state OR the functions are also memoized/stable.
      // Actually, the functions defined in the component body (like getCropTypeById) capture the current render's scope. If we put them in useMemo dependency array, they will change on every render because they are re-created on every render.
      // To properly optimize, we should wrap the functions in useCallback OR just include them in the dependency array (which defeats the purpose if they are re-created every time).
      // However, since the state variables (cropTypes, etc.) are in the dependency array, the value will be re-created whenever data changes, which is correct.
      // The issue is that `fetchCropTypes` etc are re-created on every render.
      // Let's just wrap the value object construction in useMemo. Since the functions are re-created every render, we can't easily make them stable without wrapping ALL of them in useCallback.
      // But wait, if I put `fetchCropTypes` in the dependency array, and `fetchCropTypes` is re-created every render, then `value` is re-created every render.
      // So I need to wrap ALL functions in useCallback first? That's a lot of changes.
      // Alternatively, I can just NOT include the functions in the dependency array if I know they are stable enough or if I don't care about their identity changing. But they capture state?
      // `getCropTypeById` uses `cropTypes`. If I don't update it, it will use stale `cropTypes`.
      // So `getCropTypeById` MUST be re-created or use a ref.
      // Actually, the best pattern here without refactoring everything to useCallback is to just accept that functions change.
      // BUT, the goal is to avoid re-renders when NOTHING changes.
      // If nothing changes, `cropTypes` is the same object reference (from useState).
      // But `fetchCropTypes` is a NEW function every render.
      // So `value` will be new every render if I include functions in deps.
      // So I MUST wrap functions in useCallback.
    ],
  );

  return <CropContext.Provider value={value}>{children}</CropContext.Provider>;
};

export default CropProvider;

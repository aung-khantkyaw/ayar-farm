"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import CropProvider from "@/providers/crop-provider";
import { useCrop } from "@/context/crop-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Add this import
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Tag,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown,
  FileText,
  RefreshCw,
  Loader2,
  Leaf, // Add this for crops icon
  Layers, // Add this for crop types icon
  BookOpen, // Add this for IFS documents icon
} from "lucide-react"; // Add this import for spinner
import { toast } from "sonner";
import type { Crop, CropType, Document } from "@/lib/interface";

const CropsManagement = () => {
  const {
    cropTypes,
    crops,
    documents,

    isLoading,
    isUploadingFile,

    createCropType,
    updateCropType,
    deleteCropType,
    bulkDeleteCropTypes,

    createCrop,
    updateCrop,
    deleteCrop,
    bulkDeleteCrops,

    createDocument,
    updateDocument,
    deleteDocument,

    getTotalCropTypes,
    getTotalCrops,
    getTotalDocuments,

    refreshAll,
  } = useCrop();

  // UI State - only keeping what's not handled by the provider
  const [cropTypeSearchTerm, setCropTypeSearchTerm] = useState("");
  const [isCropTypeDialogOpen, setIsCropTypeDialogOpen] = useState(false);
  const [editingCropType, setEditingCropType] = useState<CropType | null>(null);
  const [cropTypeFormData, setCropTypeFormData] = useState({
    name: "",
    image: null as File | null,
  });
  const [selectedCropTypes, setSelectedCropTypes] = useState<string[]>([]);

  // Crops UI state
  const [cropSearchTerm, setCropSearchTerm] = useState("");
  const [selectedCropType, setSelectedCropType] = useState<string>("");
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [cropFormData, setCropFormData] = useState({
    name: "",
    type_id: "",
    image: null as File | null,
  });
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Document UI state
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [selectedDocumentCropType, setSelectedDocumentCropType] =
    useState<string>("");
  const [selectedDocumentCrop, setSelectedDocumentCrop] = useState<string>("");
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [documentFormData, setDocumentFormData] = useState({
    crop_type_id: "none",
    crop_id: "none",
    title: "",
    author: "",
    pdfFile: null as File | null,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Crop Types pagination and sorting state
  const [cropTypeCurrentPage, setCropTypeCurrentPage] = useState(1);
  const [cropTypePageSize, setCropTypePageSize] = useState(10);
  const [cropTypeSortBy, setCropTypeSortBy] = useState<string>("");
  const [cropTypeSortOrder, setCropTypeSortOrder] = useState<"asc" | "desc">(
    "asc",
  );

  // Document pagination and sorting state
  const [documentCurrentPage, setDocumentCurrentPage] = useState(1);
  const [documentPageSize, setDocumentPageSize] = useState(10);
  const [documentSortBy, setDocumentSortBy] = useState<string>("");
  const [documentSortOrder, setDocumentSortOrder] = useState<"asc" | "desc">(
    "asc",
  );

  // Delete confirmation dialog states
  const [deleteCropTypeId, setDeleteCropTypeId] = useState<string | null>(null);
  const [isDeleteCropTypeDialogOpen, setIsDeleteCropTypeDialogOpen] =
    useState(false);
  const [deleteCropId, setDeleteCropId] = useState<string | null>(null);
  const [isDeleteCropDialogOpen, setIsDeleteCropDialogOpen] = useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [isDeleteDocumentDialogOpen, setIsDeleteDocumentDialogOpen] =
    useState(false);
  const [deleteCropTypeLoading, setDeleteCropTypeLoading] = useState(false);
  const [deleteCropLoading, setDeleteCropLoading] = useState(false);
  const [deleteDocumentLoading, setDeleteDocumentLoading] = useState(false);

  // Filter and sort functions
  const filteredAndSortedCropTypes = useMemo(() => {
    const filtered = cropTypes.filter((type) =>
      (type.name || "")
        .toLowerCase()
        .includes(cropTypeSearchTerm.toLowerCase()),
    );

    return filtered.sort((a, b) => {
      if (!cropTypeSortBy) return 0;

      let aValue: any = a;
      let bValue: any = b;

      if (cropTypeSortBy === "name") {
        aValue = a.name || "";
        bValue = b.name || "";
      } else if (cropTypeSortBy === "cropsCount") {
        aValue = a._count?.crops || 0;
        bValue = b._count?.crops || 0;
      } else if (cropTypeSortBy === "created_at") {
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      } else if (cropTypeSortBy === "updated_at") {
        aValue = new Date(a.updated_at);
        bValue = new Date(b.updated_at);
      }

      if (cropTypeSortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [cropTypes, cropTypeSearchTerm, cropTypeSortBy, cropTypeSortOrder]);

  // Crop Types pagination logic
  const cropTypeTotalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedCropTypes.length / cropTypePageSize),
  );
  const cropTypeStartIndex = (cropTypeCurrentPage - 1) * cropTypePageSize;
  const cropTypeEndIndex = cropTypeStartIndex + cropTypePageSize;
  const paginatedCropTypes = useMemo(
    () =>
      filteredAndSortedCropTypes.slice(cropTypeStartIndex, cropTypeEndIndex),
    [filteredAndSortedCropTypes, cropTypeStartIndex, cropTypeEndIndex],
  );

  const filteredAndSortedCrops = useMemo(() => {
    return crops
      .filter((crop) => {
        const matchesSearch = (crop.name || "")
          .toLowerCase()
          .includes(cropSearchTerm.toLowerCase());
        const matchesType =
          selectedCropType === "" ||
          selectedCropType === "all" ||
          crop.type_id === selectedCropType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (!sortBy) return 0;

        let aValue: any = a;
        let bValue: any = b;

        if (sortBy === "name") {
          aValue = a.name || "";
          bValue = b.name || "";
        } else if (sortBy === "type") {
          aValue = a.type?.name || "";
          bValue = b.type?.name || "";
        } else if (sortBy === "created_at") {
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
        } else if (sortBy === "updated_at") {
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [crops, cropSearchTerm, selectedCropType, sortBy, sortOrder]);

  const filteredAndSortedDocuments = useMemo(() => {
    const filtered = documents.filter((doc) => {
      const searchTerm = documentSearchTerm.toLowerCase();
      const matchesSearch =
        !documentSearchTerm ||
        (doc.CropTypes?.name || "").toLowerCase().includes(searchTerm) ||
        (doc.Crops?.name || "").toLowerCase().includes(searchTerm) ||
        (doc.title || "").toLowerCase().includes(searchTerm);

      const matchesCropType =
        selectedDocumentCropType === "" ||
        selectedDocumentCropType === "all" ||
        doc.crop_type_id === selectedDocumentCropType;

      const matchesCrop =
        selectedDocumentCrop === "" ||
        selectedDocumentCrop === "all" ||
        doc.crop_id === selectedDocumentCrop;

      return matchesSearch && matchesCropType && matchesCrop;
    });

    return filtered.sort((a, b) => {
      if (!documentSortBy) return 0;

      let aValue: any = a;
      let bValue: any = b;

      if (documentSortBy === "file") {
        aValue = a.id;
        bValue = b.id;
      } else if (documentSortBy === "cropType") {
        aValue = a.CropTypes?.name || "";
        bValue = b.CropTypes?.name || "";
      } else if (documentSortBy === "crop") {
        aValue = a.Crops?.name || "";
        bValue = b.Crops?.name || "";
      } else if (documentSortBy === "created_at") {
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      }

      if (documentSortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [
    documents,
    documentSearchTerm,
    selectedDocumentCropType,
    selectedDocumentCrop,
    documentSortBy,
    documentSortOrder,
  ]);

  // Document pagination logic
  const documentTotalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedDocuments.length / documentPageSize),
  );
  const documentStartIndex = (documentCurrentPage - 1) * documentPageSize;
  const documentEndIndex = documentStartIndex + documentPageSize;
  const paginatedDocuments = useMemo(
    () =>
      filteredAndSortedDocuments.slice(documentStartIndex, documentEndIndex),
    [filteredAndSortedDocuments, documentStartIndex, documentEndIndex],
  );

  // Pagination logic
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedCrops.length / pageSize),
  );
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCrops = useMemo(
    () => filteredAndSortedCrops.slice(startIndex, endIndex),
    [filteredAndSortedCrops, startIndex, endIndex],
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [cropSearchTerm, selectedCropType, sortBy, sortOrder]);

  // Reset crop types pagination when filters change
  useEffect(() => {
    setCropTypeCurrentPage(1);
  }, [cropTypeSearchTerm, cropTypeSortBy, cropTypeSortOrder]);

  // Reset Document pagination when filters change
  useEffect(() => {
    setDocumentCurrentPage(1);
  }, [
    documentSearchTerm,
    selectedDocumentCropType,
    selectedDocumentCrop,
    documentSortBy,
    documentSortOrder,
  ]);

  // Auto-adjust page if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (cropTypeCurrentPage > cropTypeTotalPages && cropTypeTotalPages > 0) {
      setCropTypeCurrentPage(cropTypeTotalPages);
    }
  }, [cropTypeCurrentPage, cropTypeTotalPages]);

  useEffect(() => {
    if (documentCurrentPage > documentTotalPages && documentTotalPages > 0) {
      setDocumentCurrentPage(documentTotalPages);
    }
  }, [documentCurrentPage, documentTotalPages]);

  // CropType CRUD operations
  const handleCropTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cropTypeFormData.name) {
      return;
    }

    const formData = new FormData();
    formData.append("name", cropTypeFormData.name);
    if (cropTypeFormData.image) {
      formData.append("image_urls", cropTypeFormData.image);
    }

    const success = editingCropType
      ? await updateCropType(editingCropType.id, formData)
      : await createCropType(formData);

    if (success) {
      setIsCropTypeDialogOpen(false);
      resetCropTypeForm();
    }
  };

  const handleDeleteCropType = async () => {
    if (!deleteCropTypeId) return;
    setDeleteCropTypeLoading(true);
    await deleteCropType(deleteCropTypeId);
    setDeleteCropTypeLoading(false);
    setIsDeleteCropTypeDialogOpen(false);
    setDeleteCropTypeId(null);
  };

  // Open Crop Type delete dialog
  const openDeleteCropTypeDialog = (id: string) => {
    setDeleteCropTypeId(id);
    setIsDeleteCropTypeDialogOpen(true);
  };

  // Crop CRUD operations
  const handleCropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cropFormData.name || !cropFormData.type_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!editingCrop && !cropFormData.image) {
      toast.error("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("name", cropFormData.name);
    formData.append("crop_type_id", cropFormData.type_id);
    if (cropFormData.image) {
      formData.append("image_urls", cropFormData.image);
    }

    const success = editingCrop
      ? await updateCrop(editingCrop.id, formData)
      : await createCrop(formData);

    if (success) {
      setIsCropDialogOpen(false);
      resetCropForm();
    }
  };

  const handleDeleteCrop = async () => {
    if (!deleteCropId) return;
    setDeleteCropLoading(true);
    await deleteCrop(deleteCropId);
    setDeleteCropLoading(false);
    setIsDeleteCropDialogOpen(false);
    setDeleteCropId(null);
  };

  // Open Crop delete dialog
  const openDeleteCropDialog = (id: string) => {
    setDeleteCropId(id);
    setIsDeleteCropDialogOpen(true);
  };

  // Document CRUD operations
  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentFormData.pdfFile && !editingDocument) {
      toast.error("Please select a PDF file");
      return;
    }

    const formData = new FormData();
    if (
      documentFormData.crop_type_id &&
      documentFormData.crop_type_id !== "none"
    ) {
      formData.append("crop_type_id", documentFormData.crop_type_id);
    }
    if (documentFormData.crop_id && documentFormData.crop_id !== "none") {
      formData.append("crop_id", documentFormData.crop_id);
    }
    formData.append("title", documentFormData.title);
    formData.append("author", documentFormData.author);
    if (documentFormData.pdfFile) {
      formData.append("file_urls", documentFormData.pdfFile);
    }

    const success = editingDocument
      ? await updateDocument(editingDocument.id, formData)
      : await createDocument(formData);

    if (success) {
      setIsDocumentDialogOpen(false);
      resetDocumentForm();
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteDocumentId) return;
    setDeleteDocumentLoading(true);
    await deleteDocument(deleteDocumentId);
    setDeleteDocumentLoading(false);
    setIsDeleteDocumentDialogOpen(false);
    setDeleteDocumentId(null);
  };

  // Form reset functions
  const resetCropTypeForm = () => {
    setCropTypeFormData({ name: "", image: null });
    setEditingCropType(null);
  };

  const resetCropForm = () => {
    setCropFormData({ name: "", type_id: "", image: null });
    setEditingCrop(null);
  };

  const resetDocumentForm = () => {
    setDocumentFormData({
      crop_type_id: "none",
      crop_id: "none",
      title: "",
      author: "",
      pdfFile: null,
    });
    setEditingDocument(null);
  };

  // Edit handlers
  const handleEditCropType = (cropType: CropType) => {
    setEditingCropType(cropType);
    setCropTypeFormData({
      name: cropType.name ?? "",
      image: null,
    });
    setIsCropTypeDialogOpen(true);
  };

  // Open Document delete dialog
  const openDeleteDocumentDialog = (id: string) => {
    setDeleteDocumentId(id);
    setIsDeleteDocumentDialogOpen(true);
  };

  const handleEditCrop = (crop: Crop) => {
    setEditingCrop(crop);
    setCropFormData({
      name: crop.name ?? "",
      type_id: crop.type_id ?? "",
      image: null,
    });
    setIsCropDialogOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setDocumentFormData({
      crop_type_id: doc.crop_type_id || "none",
      crop_id: doc.crop_id || "none",
      title: doc.title ?? "",
      author: doc.author ?? "",
      pdfFile: null,
    });
    setIsDocumentDialogOpen(true);
  };

  // Dialog close handlers
  const handleCropTypeDialogClose = () => {
    setIsCropTypeDialogOpen(false);
    resetCropTypeForm();
  };

  const handleCropDialogClose = () => {
    setIsCropDialogOpen(false);
    resetCropForm();
  };

  const handleDocumentDialogClose = () => {
    setIsDocumentDialogOpen(false);
    resetDocumentForm();
  };

  // Selection handlers
  const handleSelectCropType = (typeId: string) => {
    setSelectedCropTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  const handleSelectCrop = (cropId: string) => {
    setSelectedCrops((prev) =>
      prev.includes(cropId)
        ? prev.filter((id) => id !== cropId)
        : [...prev, cropId],
    );
  };

  // Bulk delete handlers
  const handleBulkDeleteCropTypes = async () => {
    if (selectedCropTypes.length === 0) return;
    const success = await bulkDeleteCropTypes(selectedCropTypes);
    if (success) {
      setSelectedCropTypes([]);
    }
  };

  const handleBulkDeleteCrops = async () => {
    if (selectedCrops.length === 0) return;

    const success = await bulkDeleteCrops(selectedCrops);
    if (success) {
      setSelectedCrops([]);
    }
  };

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Crop Types sorting handler
  const handleSortCropType = (column: string) => {
    if (cropTypeSortBy === column) {
      setCropTypeSortOrder(cropTypeSortOrder === "asc" ? "desc" : "asc");
    } else {
      setCropTypeSortBy(column);
      setCropTypeSortOrder("asc");
    }
  };

  // Document sorting handler
  const handleSortDocument = (column: string) => {
    if (documentSortBy === column) {
      setDocumentSortOrder(documentSortOrder === "asc" ? "desc" : "asc");
    } else {
      setDocumentSortBy(column);
      setDocumentSortOrder("asc");
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Clear Document filters function
  const clearDocumentFilters = () => {
    setDocumentSearchTerm("");
    setSelectedDocumentCropType("");
    setSelectedDocumentCrop("");
  };

  // Handle Document crop type change - reset crop filter when crop type changes
  const handleDocumentCropTypeChange = (value: string) => {
    setSelectedDocumentCropType(value);
    setSelectedDocumentCrop(""); // Reset crop selection when crop type changes
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crops Management</h1>
          <p className="text-gray-600 mt-2">
            Manage crop types, crops, and integrated farming system documents
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAll}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Crop Types Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-bl-full"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Layers className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">
                    Crop Types
                  </CardTitle>
                  <p className="text-xs text-emerald-600/80 mt-0.5">
                    Total categories
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="text-3xl font-bold text-emerald-900">
                {getTotalCropTypes()}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-medium">
                  {
                    new Set(
                      cropTypes
                        .filter(
                          (type) =>
                            type.crops?.length && type.crops?.length > 0,
                        )
                        .map((type) => type.id),
                    ).size
                  }{" "}
                  Crop Types Active
                </span>
                <div className="flex items-center space-x-1 text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crops Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-bl-full"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Leaf className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                    Total Crops
                  </CardTitle>
                  <p className="text-xs text-blue-600/80 mt-0.5">
                    All varieties
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="text-3xl font-bold text-blue-900">
                {getTotalCrops()}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-700 font-medium">
                  {new Set(crops.map((crop) => crop.type_id)).size} Crop Types
                </span>
                <div className="flex items-center space-x-1 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-bl-full"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-violet-800 uppercase tracking-wide">
                    Documents
                  </CardTitle>
                  <p className="text-xs text-violet-600/80 mt-0.5">
                    Knowledge base
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="text-3xl font-bold text-violet-900">
                {getTotalDocuments()}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-violet-700 font-medium">
                  {
                    [
                      ...new Set(
                        documents
                          .map((doc) => doc.crop_id)
                          .filter((id) => id !== null),
                      ),
                    ].length
                  }{" "}
                  Crops Linked
                </span>
                <div className="flex items-center space-x-1 text-violet-600">
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="crop-types" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="crop-types">Crop Types</TabsTrigger>
          <TabsTrigger value="crops">Crops</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* CROP TYPES TAB */}
        <TabsContent value="crop-types" className="space-y-4">
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between w-full">
            <div className="flex flex-wrap gap-2 items-center min-w-0 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search crop types..."
                  value={cropTypeSearchTerm}
                  onChange={(e) => setCropTypeSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[300px]"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
              {selectedCropTypes.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteCropTypes}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedCropTypes.length})
                </Button>
              )}
              <Dialog
                open={isCropTypeDialogOpen}
                onOpenChange={setIsCropTypeDialogOpen}
              >
                <DialogTrigger>
                  <Button
                    onClick={() => setEditingCropType(null)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Crop Type
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCropType ? "Edit Crop Type" : "Add New Crop Type"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCropType
                        ? "Update crop type information"
                        : "Create a new crop type"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCropTypeSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cropTypeName" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="cropTypeName"
                          value={cropTypeFormData.name}
                          onChange={(e) =>
                            setCropTypeFormData({
                              ...cropTypeFormData,
                              name: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Enter crop type name"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cropTypeImage" className="text-right">
                          Image
                        </Label>
                        <Input
                          id="cropTypeImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setCropTypeFormData({
                              ...cropTypeFormData,
                              image: file || null,
                            });
                          }}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCropTypeDialogClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUploadingFile}>
                        {isUploadingFile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingCropType ? "Updating..." : "Creating..."}
                          </>
                        ) : editingCropType ? (
                          "Update"
                        ) : (
                          "Create"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedCropTypes.length ===
                          paginatedCropTypes.length &&
                        paginatedCropTypes.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCropTypes(
                            paginatedCropTypes.map((t) => t.id),
                          );
                        } else {
                          setSelectedCropTypes([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortCropType("name")}
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortCropType("cropsCount")}
                  >
                    <div className="flex items-center">
                      Crops Count
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortCropType("created_at")}
                  >
                    <div className="flex items-center">
                      Created
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortCropType("updated_at")}
                  >
                    <div className="flex items-center">
                      Updated
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCropTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm">
                      No crop types found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCropTypes.map((cropType) => (
                    <TableRow key={cropType.id || `crop-type-${Math.random()}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCropTypes.includes(cropType.id)}
                          onCheckedChange={() =>
                            handleSelectCropType(cropType.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <img
                          src={
                            (cropType.image_urls?.length
                              ? cropType.image_urls[
                                  cropType.image_urls.length - 1
                                ]
                              : undefined) ||
                            cropType.image_url ||
                            "/placeholder-image.png"
                          }
                          alt={cropType.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {cropType.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cropType.crops?.length || 0} crops
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(cropType.created_at)}</TableCell>
                      <TableCell>{formatDate(cropType.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditCropType(cropType)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                openDeleteCropTypeDialog(cropType.id)
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Crop Types Pagination */}
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between px-2 w-full">
            <div className="flex flex-wrap gap-2 items-center min-w-0 w-full md:w-auto">
              <div className="text-sm text-muted-foreground w-full sm:w-auto">
                Showing {cropTypeStartIndex + 1}-
                {Math.min(cropTypeEndIndex, filteredAndSortedCropTypes.length)}{" "}
                of {filteredAndSortedCropTypes.length} crop types
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={cropTypePageSize.toString()}
                  onValueChange={(value) => {
                    setCropTypePageSize(Number(value));
                    setCropTypeCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCropTypeCurrentPage(cropTypeCurrentPage - 1)}
                disabled={cropTypeCurrentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {cropTypeCurrentPage} of {cropTypeTotalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCropTypeCurrentPage(cropTypeCurrentPage + 1)}
                disabled={cropTypeCurrentPage === cropTypeTotalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* CROPS TAB */}
        <TabsContent value="crops" className="space-y-4">
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between w-full">
            <div className="flex flex-wrap gap-2 items-center min-w-0 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search crops..."
                  value={cropSearchTerm}
                  onChange={(e) => setCropSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[300px]"
                />
              </div>
              <Select
                value={selectedCropType}
                onValueChange={value => setSelectedCropType(value || "all")}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by Crop Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {cropTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
              {selectedCrops.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteCrops}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedCrops.length})
                </Button>
              )}
              <Dialog
                open={isCropDialogOpen}
                onOpenChange={setIsCropDialogOpen}
              >
                <DialogTrigger>
                  <Button
                    onClick={() => setEditingCrop(null)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Crop
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCrop ? "Edit Crop" : "Add New Crop"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCrop
                        ? "Update crop information"
                        : "Create a new crop"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCropSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cropName" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="cropName"
                          value={cropFormData.name}
                          onChange={(e) =>
                            setCropFormData({
                              ...cropFormData,
                              name: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Enter crop name"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cropType" className="text-right">
                          Type
                        </Label>
                        <Select
                          value={cropFormData.type_id}
                          onValueChange={(value) =>
                            setCropFormData({
                              ...cropFormData,
                              type_id: value || "",
                            })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select crop type" />
                          </SelectTrigger>
                          <SelectContent>
                            {cropTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cropImage" className="text-right">
                          Image
                        </Label>
                        <Input
                          id="cropImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setCropFormData({
                              ...cropFormData,
                              image: file || null,
                            });
                          }}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCropDialogClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUploadingFile}>
                        {isUploadingFile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingCrop ? "Updating..." : "Creating..."}
                          </>
                        ) : editingCrop ? (
                          "Update"
                        ) : (
                          "Create"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedCrops.length === paginatedCrops.length &&
                        paginatedCrops.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCrops(paginatedCrops.map((c) => c.id));
                        } else {
                          setSelectedCrops([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center">
                      Type
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center">
                      Created
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("updated_at")}
                  >
                    <div className="flex items-center">
                      Updated
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCrops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm">
                      No crop found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCrops.map((crop) => (
                    <TableRow key={crop.id || `crop-${Math.random()}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCrops.includes(crop.id)}
                          onCheckedChange={() => handleSelectCrop(crop.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <img
                          src={
                            (crop.image_urls?.length
                              ? crop.image_urls[crop.image_urls.length - 1]
                              : undefined) ||
                            crop.image_url ||
                            "/placeholder-image.png"
                          }
                          alt={crop.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{crop.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-green-600/10 text-green-600"
                        >
                          <Tag className="h-4 w-4 mr-1" />
                          {crop.type?.name || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(crop.created_at)}</TableCell>
                      <TableCell>{formatDate(crop.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleEditCrop(crop)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteCropDialog(crop.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between px-2 w-full">
            <div className="flex flex-wrap gap-2 items-center min-w-0 w-full md:w-auto">
              <div className="text-sm text-muted-foreground w-full sm:w-auto">
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredAndSortedCrops.length)} of{" "}
                {filteredAndSortedCrops.length} crops
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between w-full">
            <div className="flex flex-wrap gap-2 items-center min-w-0 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={documentSearchTerm}
                  onChange={(e) => setDocumentSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[300px]"
                />
              </div>
              <Select
                value={selectedDocumentCropType}
                onValueChange={value => handleDocumentCropTypeChange(value || "all")}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by Crop Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crop Types</SelectItem>
                  {cropTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedDocumentCrop}
                onValueChange={value => setSelectedDocumentCrop(value || "all")}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by Crop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  {crops
                    .filter(
                      (crop) =>
                        selectedDocumentCropType === "" ||
                        selectedDocumentCropType === "all" ||
                        crop.type_id === selectedDocumentCropType,
                    )
                    .map((crop) => (
                      <SelectItem key={crop.id} value={crop.id}>
                        {crop.name} ({crop.type?.name})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {(documentSearchTerm ||
                selectedDocumentCropType ||
                selectedDocumentCrop) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDocumentFilters}
                  className="px-3"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
              <Dialog
                open={isDocumentDialogOpen}
                onOpenChange={setIsDocumentDialogOpen}
              >
                <DialogTrigger>
                  <Button
                    onClick={() => setEditingDocument(null)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingDocument ? "Edit Document" : "Add New Document"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingDocument
                        ? "Update document information"
                        : "Upload a new document"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDocumentSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="documentCropType"
                          className="text-right"
                        >
                          Crop Type
                        </Label>
                        <Select
                          value={documentFormData.crop_type_id}
                          onValueChange={(value) =>
                            setDocumentFormData({
                              ...documentFormData,
                              crop_type_id: value || "",
                              crop_id: "none", // Reset crop selection when crop type changes
                            })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select crop type (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {cropTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="documentCrop" className="text-right">
                          Crop
                        </Label>
                        <Select
                          value={documentFormData.crop_id}
                          onValueChange={(value) =>
                            setDocumentFormData({
                              ...documentFormData,
                              crop_id: value || "",
                            })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select crop (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {crops
                              .filter(
                                (crop) =>
                                  documentFormData.crop_type_id === "none" ||
                                  !documentFormData.crop_type_id ||
                                  crop.type_id ===
                                    documentFormData.crop_type_id,
                              )
                              .map((crop) => (
                                <SelectItem key={crop.id} value={crop.id}>
                                  {crop.name} ({crop.type?.name})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="documentTitle" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="documentTitle"
                          value={documentFormData.title}
                          onChange={(e) =>
                            setDocumentFormData({
                              ...documentFormData,
                              title: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Enter document title"
                          required={!editingDocument}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="documentAuthor" className="text-right">
                          Author
                        </Label>
                        <Input
                          id="documentAuthor"
                          value={documentFormData.author}
                          onChange={(e) =>
                            setDocumentFormData({
                              ...documentFormData,
                              author: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Enter document author"
                          required={!editingDocument}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="documentPdf" className="text-right">
                          PDF File
                        </Label>
                        <Input
                          id="documentPdf"
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setDocumentFormData({
                              ...documentFormData,
                              pdfFile: file || null,
                            });
                          }}
                          className="col-span-3"
                          required={!editingDocument}
                        />
                        {editingDocument && (
                          <p className="col-span-4 text-xs text-muted-foreground text-center">
                            Leave empty to keep the current PDF file
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDocumentDialogClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUploadingFile}>
                        {isUploadingFile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingDocument ? "Updating..." : "Uploading..."}
                          </>
                        ) : editingDocument ? (
                          "Update"
                        ) : (
                          "Upload"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filter Summary */}
          {(documentSearchTerm ||
            selectedDocumentCropType ||
            selectedDocumentCrop) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
              <span>Filters applied:</span>
              {documentSearchTerm && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  Search: "{documentSearchTerm}"
                </span>
              )}
              {selectedDocumentCropType && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  Crop Type:{" "}
                  {selectedDocumentCropType === "all"
                    ? "All"
                    : cropTypes.find((t) => t.id === selectedDocumentCropType)
                        ?.name}
                </span>
              )}
              {selectedDocumentCrop && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  Crop:{" "}
                  {selectedDocumentCrop === "all"
                    ? "All"
                    : crops.find((c) => c.id === selectedDocumentCrop)?.name}
                </span>
              )}
              <span className="ml-auto font-medium">
                {filteredAndSortedDocuments.length} document
                {filteredAndSortedDocuments.length !== 1 ? "s" : ""} found
              </span>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortDocument("cropType")}
                  >
                    <div className="flex items-center">
                      Crop Type
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortDocument("crop")}
                  >
                    <div className="flex items-center">
                      Crop
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortDocument("created_at")}
                  >
                    <div className="flex items-center">
                      Upload Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm">
                      No Document found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDocuments.map((doc) => (
                    <TableRow key={doc.id || `doc-${Math.random()}`}>
                      <TableCell>
                        <span className="font-medium">{doc.title}</span>
                      </TableCell>
                      <TableCell>{doc.author}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-red-600" />
                          <a
                            href={doc.file_urls?.[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View PDF
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.CropTypes ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-600/10 text-green-600"
                          >
                            <Tag className="h-4 w-4 mr-1" />
                            {doc.CropTypes.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.Crops ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-600/10 text-green-600"
                          >
                            <Tag className="h-4 w-4 mr-1" />
                            {doc.Crops.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(doc.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleEditDocument(doc)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDocumentDialog(doc.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Document Pagination */}
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between px-2 w-full">
            <div className="flex flex-wrap gap-2 items-center min-w-0 w-full md:w-auto">
              <div className="text-sm text-muted-foreground w-full sm:w-auto">
                Showing {documentStartIndex + 1}-
                {Math.min(documentEndIndex, filteredAndSortedDocuments.length)}{" "}
                of {filteredAndSortedDocuments.length} documents
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={documentPageSize.toString()}
                  onValueChange={(value) => {
                    setDocumentPageSize(Number(value));
                    setDocumentCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDocumentCurrentPage(documentCurrentPage - 1)}
                disabled={documentCurrentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {documentCurrentPage} of {documentTotalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDocumentCurrentPage(documentCurrentPage + 1)}
                disabled={documentCurrentPage === documentTotalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Crop Type Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteCropTypeDialogOpen}
        onOpenChange={setIsDeleteCropTypeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Crop Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this crop type? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteCropTypeDialogOpen(false)}
              disabled={deleteCropTypeLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCropType}
              disabled={deleteCropTypeLoading}
            >
              {deleteCropTypeLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crop Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteCropDialogOpen}
        onOpenChange={setIsDeleteCropDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Crop</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this crop? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteCropDialogOpen(false)}
              disabled={deleteCropLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCrop}
              disabled={deleteCropLoading}
            >
              {deleteCropLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDocumentDialogOpen}
        onOpenChange={setIsDeleteDocumentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDocumentDialogOpen(false)}
              disabled={deleteDocumentLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDocument}
              disabled={deleteDocumentLoading}
            >
              {deleteDocumentLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AdminCropPage = () => {
  return (
    <CropProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <CropsManagement />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CropProvider>
  );
};

export default AdminCropPage;

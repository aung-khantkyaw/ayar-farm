import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import MachineProvider from "@/providers/machine-provider";
import { useMachine } from "@/context/machine-context";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown,
  FileText,
  RefreshCw,
  Loader2,
  Settings,
  Cog,
  BookOpen,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import type { MachineType, Machine, Document } from "@/lib/interface";

const MachinesManagement = () => {
  const {
    machineTypes,
    machines,
    documents,

    isLoading,
    isUploadingFile,

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

    getTotalMachineTypes,
    getTotalMachines,
    getTotalDocumentsCount,

    refreshAll,
  } = useMachine();

  // Machine UI state
  const [machineSearchTerm, setMachineSearchTerm] = useState("");
  const [selectedMachineType, setSelectedMachineType] = useState<string>("");
  const [isMachineDialogOpen, setIsMachineDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [machineFormData, setMachineFormData] = useState({
    name: "",
    type_id: "",
    image: null as File | null,
  });
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Machine Types UI state
  const [machineTypeSearchTerm, setMachineTypeSearchTerm] = useState("");
  const [isMachineTypeDialogOpen, setIsMachineTypeDialogOpen] = useState(false);
  const [editingMachineType, setEditingMachineType] =
    useState<MachineType | null>(null);
  const [machineTypeFormData, setMachineTypeFormData] = useState({
    name: "",
    image: null as File | null,
  });
  const [selectedMachineTypes, setSelectedMachineTypes] = useState<string[]>(
    [],
  );
  const [machineTypeSortBy, setMachineTypeSortBy] = useState<string>("");
  const [machineTypeSortOrder, setMachineTypeSortOrder] = useState<
    "asc" | "desc"
  >("asc");

  // Document UI state
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [selectedDocumentMachineType, setSelectedDocumentMachineType] =
    useState<string>("");
  const [selectedDocumentMachine, setSelectedDocumentMachine] =
    useState<string>("");
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [documentFormData, setDocumentFormData] = useState({
    machine_type_id: "",
    machine_id: "",
    title: "",
    author: "",
    pdfFile: null as File | null,
  });
  const [documentSortBy, setDocumentSortBy] = useState<string>("");
  const [documentSortOrder, setDocumentSortOrder] = useState<"asc" | "desc">(
    "asc",
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [machineTypeCurrentPage, setMachineTypeCurrentPage] = useState(1);
  const [machineTypePageSize, setMachineTypePageSize] = useState(10);
  const [documentCurrentPage, setDocumentCurrentPage] = useState(1);
  const [documentPageSize, setDocumentPageSize] = useState(10);

  // Delete confirmation dialog states
  const [deleteMachineId, setDeleteMachineId] = useState<string | null>(null);
  const [isDeleteMachineDialogOpen, setIsDeleteMachineDialogOpen] =
    useState(false);
  const [deleteMachineTypeId, setDeleteMachineTypeId] = useState<string | null>(
    null,
  );
  const [isDeleteMachineTypeDialogOpen, setIsDeleteMachineTypeDialogOpen] =
    useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [isDeleteDocumentDialogOpen, setIsDeleteDocumentDialogOpen] =
    useState(false);
  const [deleteMachineLoading, setDeleteMachineLoading] = useState(false);
  const [deleteMachineTypeLoading, setDeleteMachineTypeLoading] =
    useState(false);
  const [deleteDocumentLoading, setDeleteDocumentLoading] = useState(false);

  // Filter and sort functions for Machines
  const filteredAndSortedMachines = machines
    .filter((machine) => {
      const matchesSearch = (machine.name || "")
        .toLowerCase()
        .includes(machineSearchTerm.toLowerCase());
      const matchesType =
        selectedMachineType === "" ||
        selectedMachineType === "all" ||
        machine.type_id === selectedMachineType;
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
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Filter and sort functions for Machine Types
  const filteredAndSortedMachineTypes = machineTypes
    .filter((type) =>
      (type.name || "")
        .toLowerCase()
        .includes(machineTypeSearchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (!machineTypeSortBy) return 0;

      let aValue: any = a;
      let bValue: any = b;

      if (machineTypeSortBy === "name") {
        aValue = a.name || "";
        bValue = b.name || "";
      } else if (machineTypeSortBy === "machinesCount") {
        aValue = a._count?.machines || 0;
        bValue = b._count?.machines || 0;
      } else if (machineTypeSortBy === "created_at") {
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      }

      if (machineTypeSortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const filteredDocuments = documents.filter((doc) => {
    const searchTerm = documentSearchTerm.toLowerCase();
    const matchesSearch =
      (doc.MachineTypes?.name || "").toLowerCase().includes(searchTerm) ||
      (doc.Machines?.name || "").toLowerCase().includes(searchTerm) ||
      (doc.title || "").toLowerCase().includes(searchTerm);

    const matchesMachineType =
      selectedDocumentMachineType === "" ||
      selectedDocumentMachineType === "all" ||
      doc.machine_type_id === selectedDocumentMachineType;

    const matchesMachine =
      selectedDocumentMachine === "" ||
      selectedDocumentMachine === "all" ||
      doc.machine_id === selectedDocumentMachine;

    return matchesSearch && matchesMachineType && matchesMachine;
  });

  // Filter and sort functions for Documents
  const filteredAndSortedDocuments = filteredDocuments.sort((a, b) => {
    if (!documentSortBy) return 0;

    let aValue: any = a;
    let bValue: any = b;

    if (documentSortBy === "title") {
      aValue = a.title || "";
      bValue = b.title || "";
    } else if (documentSortBy === "author") {
      aValue = a.author || "";
      bValue = b.author || "";
    } else if (documentSortBy === "file_url") {
      aValue = a.file_urls?.[0] || "";
      bValue = b.file_urls?.[0] || "";
    } else if (documentSortBy === "machineType") {
      aValue = a.MachineTypes?.name || "";
      bValue = b.MachineTypes?.name || "";
    } else if (documentSortBy === "machine") {
      aValue = a.Machines?.name || "";
      bValue = b.Machines?.name || "";
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

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedMachines.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMachines = filteredAndSortedMachines.slice(
    startIndex,
    endIndex,
  );

  const machineTypeTotalPages = Math.ceil(
    filteredAndSortedMachineTypes.length / machineTypePageSize,
  );
  const machineTypeStartIndex =
    (machineTypeCurrentPage - 1) * machineTypePageSize;
  const machineTypeEndIndex = machineTypeStartIndex + machineTypePageSize;
  const paginatedMachineTypes = filteredAndSortedMachineTypes.slice(
    machineTypeStartIndex,
    machineTypeEndIndex,
  );

  const documentTotalPages = Math.ceil(
    filteredAndSortedDocuments.length / documentPageSize,
  );
  const documentStartIndex = (documentCurrentPage - 1) * documentPageSize;
  const documentEndIndex = documentStartIndex + documentPageSize;
  const paginatedDocuments = filteredAndSortedDocuments.slice(
    documentStartIndex,
    documentEndIndex,
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [machineSearchTerm, selectedMachineType, sortBy, sortOrder]);

  useEffect(() => {
    setMachineTypeCurrentPage(1);
  }, [machineTypeSearchTerm, machineTypeSortBy, machineTypeSortOrder]);

  useEffect(() => {
    setDocumentCurrentPage(1);
  }, [
    documentSearchTerm,
    selectedDocumentMachineType,
    selectedDocumentMachine,
    documentSortBy,
    documentSortOrder,
  ]);

  // CRUD operations for Machines
  const handleMachineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!machineFormData.name || !machineFormData.type_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", machineFormData.name);
    formData.append("machine_type_id", machineFormData.type_id);
    if (machineFormData.image) {
      formData.append("image_urls", machineFormData.image);
    }

    const success = editingMachine
      ? await updateMachine(editingMachine.id, formData)
      : await createMachine(formData);

    if (success) {
      setIsMachineDialogOpen(false);
      resetMachineForm();
    }
  };

  const handleDeleteMachine = async () => {
    if (!deleteMachineId) return;
    setDeleteMachineLoading(true);
    await deleteMachine(deleteMachineId);
    setDeleteMachineLoading(false);
    setIsDeleteMachineDialogOpen(false);
    setDeleteMachineId(null);
  };

  // CRUD operations for Machine Types
  const handleMachineTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!machineTypeFormData.name) {
      toast.error("Please enter a machine type name");
      return;
    }

    const formData = new FormData();
    formData.append("name", machineTypeFormData.name);
    if (machineTypeFormData.image) {
      formData.append("image_urls", machineTypeFormData.image);
    }

    const success = editingMachineType
      ? await updateMachineType(editingMachineType.id, formData)
      : await createMachineType(formData);

    if (success) {
      setIsMachineTypeDialogOpen(false);
      resetMachineTypeForm();
    }
  };

  const handleDeleteMachineType = async () => {
    if (!deleteMachineTypeId) return;
    setDeleteMachineTypeLoading(true);
    await deleteMachineType(deleteMachineTypeId);
    setDeleteMachineTypeLoading(false);
    setIsDeleteMachineTypeDialogOpen(false);
    setDeleteMachineTypeId(null);
  };

  // CRUD operations for Documents
  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentFormData.pdfFile && !editingDocument) {
      toast.error("Please select a PDF file");
      return;
    }

    const formData = new FormData();
    if (documentFormData.machine_type_id) {
      formData.append("machine_type_id", documentFormData.machine_type_id);
    }
    if (documentFormData.machine_id) {
      formData.append("machine_id", documentFormData.machine_id);
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
  const resetMachineForm = () => {
    setMachineFormData({
      name: "",
      type_id: "",
      image: null,
    });
    setEditingMachine(null);
  };

  const resetMachineTypeForm = () => {
    setMachineTypeFormData({ name: "", image: null });
    setEditingMachineType(null);
  };

  const resetDocumentForm = () => {
    setDocumentFormData({
      machine_type_id: "",
      machine_id: "",
      title: "",
      author: "",
      pdfFile: null,
    });
    setEditingDocument(null);
  };

  // Edit handlers
  const handleEditMachine = (machine: Machine) => {
    setEditingMachine(machine);
    setMachineFormData({
      name: machine.name ?? "",
      type_id: machine.type_id ?? "",
      image: null,
    });
    setIsMachineDialogOpen(true);
  };

  const handleEditMachineType = (machineType: MachineType) => {
    setEditingMachineType(machineType);
    setMachineTypeFormData({
      name: machineType.name ?? "",
      image: null,
    });
    setIsMachineTypeDialogOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setDocumentFormData({
      machine_type_id: doc.machine_type_id || "",
      machine_id: doc.machine_id || "",
      title: doc.title || "",
      author: doc.author || "",
      pdfFile: null,
    });
    setIsDocumentDialogOpen(true);
  };

  // Dialog close handlers
  const handleMachineDialogClose = () => {
    setIsMachineDialogOpen(false);
    resetMachineForm();
  };

  const handleMachineTypeDialogClose = () => {
    setIsMachineTypeDialogOpen(false);
    resetMachineTypeForm();
  };

  const handleDocumentDialogClose = () => {
    setIsDocumentDialogOpen(false);
    resetDocumentForm();
  };

  // Delete dialog handlers
  const openDeleteMachineDialog = (id: string) => {
    setDeleteMachineId(id);
    setIsDeleteMachineDialogOpen(true);
  };

  const openDeleteMachineTypeDialog = (id: string) => {
    setDeleteMachineTypeId(id);
    setIsDeleteMachineTypeDialogOpen(true);
  };

  const openDeleteDocumentDialog = (id: string) => {
    setDeleteDocumentId(id);
    setIsDeleteDocumentDialogOpen(true);
  };

  // Selection handlers
  const handleSelectMachine = (machineId: string) => {
    setSelectedMachines((prev) =>
      prev.includes(machineId)
        ? prev.filter((id) => id !== machineId)
        : [...prev, machineId],
    );
  };

  const handleSelectMachineType = (typeId: string) => {
    setSelectedMachineTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  // Bulk delete handlers
  const handleBulkDeleteMachines = async () => {
    if (selectedMachines.length === 0) return;
    const success = await bulkDeleteMachines(selectedMachines);
    if (success) {
      setSelectedMachines([]);
    }
  };

  const handleBulkDeleteMachineTypes = async () => {
    if (selectedMachineTypes.length === 0) return;
    const success = await bulkDeleteMachineTypes(selectedMachineTypes);
    if (success) {
      setSelectedMachineTypes([]);
    }
  };

  // Sorting handlers
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleSortMachineType = (column: string) => {
    if (machineTypeSortBy === column) {
      setMachineTypeSortOrder(machineTypeSortOrder === "asc" ? "desc" : "asc");
    } else {
      setMachineTypeSortBy(column);
      setMachineTypeSortOrder("asc");
    }
  };

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
    setSelectedDocumentMachineType("");
    setSelectedDocumentMachine("");
  };

  // Handle Document machine type change - reset machine filter when machine type changes
  const handleDocumentMachineTypeChange = (value: string) => {
    setSelectedDocumentMachineType(value);
    setSelectedDocumentMachine(""); // Reset machine selection when machine type changes
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Machines Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage machines, machine types, and documents
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
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-bl-full"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Settings className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">
                    Machine Types
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
                {getTotalMachineTypes()}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-medium">
                  {
                    new Set(
                      machineTypes
                        .filter((type) => (type.machines?.length || 0) > 0)
                        .map((type) => type.id),
                    ).size
                  }{" "}
                  Machine Types Active
                </span>
                <div className="flex items-center space-x-1 text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-bl-full"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Cog className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                    Total Machine
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
                {getTotalMachines()}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-700 font-medium">
                  {new Set(machines.map((machine) => machine.type_id)).size}{" "}
                  Machine Types
                </span>
                <div className="flex items-center space-x-1 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                {getTotalDocumentsCount()}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-violet-700 font-medium">
                  {
                    [
                      ...new Set(
                        documents
                          .map((doc) => doc.machine_id)
                          .filter((id) => id !== null),
                      ),
                    ].length
                  }{" "}
                  Machine(s) Linked
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

      <Tabs defaultValue="machine-types" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="machine-types">Machine Types</TabsTrigger>
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Machine Types Tab */}
        <TabsContent value="machine-types" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto md:items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search machine types..."
                  value={machineTypeSearchTerm}
                  onChange={(e) => setMachineTypeSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[220px] md:w-[300px]"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
              {selectedMachineTypes.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteMachineTypes}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedMachineTypes.length})
                </Button>
              )}
              <Dialog
                open={isMachineTypeDialogOpen}
                onOpenChange={setIsMachineTypeDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setEditingMachineType(null)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Machine Type
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingMachineType
                        ? "Edit Machine Type"
                        : "Add New Machine Type"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingMachineType
                        ? "Update machine type information"
                        : "Create a new machine type"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleMachineTypeSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="machineTypeName" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="machineTypeName"
                          value={machineTypeFormData.name}
                          onChange={(e) =>
                            setMachineTypeFormData({
                              ...machineTypeFormData,
                              name: e.target.value,
                            })
                          }
                          className="sm:col-span-3"
                          placeholder="Enter machine type name"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="machineTypeImage"
                          className="text-right"
                        >
                          Image
                        </Label>
                        <Input
                          id="machineTypeImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setMachineTypeFormData({
                              ...machineTypeFormData,
                              image: file || null,
                            });
                          }}
                          className="sm:col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleMachineTypeDialogClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUploadingFile}>
                        {isUploadingFile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingMachineType ? "Updating..." : "Creating..."}
                          </>
                        ) : editingMachineType ? (
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
                        selectedMachineTypes.length ===
                          paginatedMachineTypes.length &&
                        paginatedMachineTypes.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMachineTypes(
                            paginatedMachineTypes.map((t) => t.id),
                          );
                        } else {
                          setSelectedMachineTypes([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortMachineType("name")}
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortMachineType("machinesCount")}
                  >
                    <div className="flex items-center">
                      Machines Count
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortMachineType("created_at")}
                  >
                    <div className="flex items-center">
                      Created
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortMachineType("updated_at")}
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
                {paginatedMachineTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm">
                      No machine types found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMachineTypes.map((machineType) => (
                    <TableRow
                      key={machineType.id || `machine-type-${Math.random()}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedMachineTypes.includes(
                            machineType.id,
                          )}
                          onCheckedChange={() =>
                            handleSelectMachineType(machineType.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <img
                          src={
                            (machineType.image_urls?.length
                              ? machineType.image_urls[
                                  machineType.image_urls.length - 1
                                ]
                              : undefined) || "/placeholder-image.png"
                          }
                          alt={machineType.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {machineType.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {machineType.machines?.length || 0} machines
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(machineType.created_at)}
                      </TableCell>
                      <TableCell>
                        {formatDate(machineType.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditMachineType(machineType)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                openDeleteMachineTypeDialog(machineType.id)
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

          {/* Machine Types Pagination */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto md:items-center">
              <div className="text-sm text-muted-foreground">
                Showing {machineTypeStartIndex + 1}-
                {Math.min(
                  machineTypeEndIndex,
                  filteredAndSortedMachineTypes.length,
                )}{" "}
                of {filteredAndSortedMachineTypes.length} machine types
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={String(machineTypePageSize)}
                  onValueChange={(v) => {
                    setMachineTypePageSize(Number(v));
                    setMachineTypeCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px]">
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
            <div className="flex items-center gap-2 w-full md:w-auto justify-end mt-2 md:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setMachineTypeCurrentPage(machineTypeCurrentPage - 1)
                }
                disabled={machineTypeCurrentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {machineTypeCurrentPage} of {machineTypeTotalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setMachineTypeCurrentPage(machineTypeCurrentPage + 1)
                }
                disabled={machineTypeCurrentPage === machineTypeTotalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Machines Tab */}
        <TabsContent value="machines" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto md:items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search machines..."
                  value={machineSearchTerm}
                  onChange={(e) => setMachineSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[220px] md:w-[300px]"
                />
              </div>
              <Select
                value={selectedMachineType}
                onValueChange={setSelectedMachineType}
              >
                <SelectTrigger className="w-full sm:w-[180px] md:w-[200px]">
                  <SelectValue placeholder="Filter by Machine Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {machineTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
              {selectedMachines.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteMachines}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedMachines.length})
                </Button>
              )}
              <Dialog
                open={isMachineDialogOpen}
                onOpenChange={setIsMachineDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setEditingMachine(null)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Machine
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingMachine ? "Edit Machine" : "Add New Machine"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingMachine
                        ? "Update machine information"
                        : "Create a new machine"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleMachineSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="machineName" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="machineName"
                          value={machineFormData.name}
                          onChange={(e) =>
                            setMachineFormData({
                              ...machineFormData,
                              name: e.target.value,
                            })
                          }
                          className="sm:col-span-3"
                          placeholder="Enter machine name"
                          required={!editingMachine}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="machineType" className="text-right">
                          Type
                        </Label>
                        <Select
                          value={machineFormData.type_id}
                          onValueChange={(value) =>
                            setMachineFormData({
                              ...machineFormData,
                              type_id: value,
                            })
                          }
                          required={!editingMachine}
                        >
                          <SelectTrigger className="sm:col-span-3">
                            <SelectValue placeholder="Select machine type" />
                          </SelectTrigger>
                          <SelectContent>
                            {machineTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="machineImage" className="text-right">
                          Image
                        </Label>
                        <Input
                          id="machineImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setMachineFormData({
                              ...machineFormData,
                              image: file || null,
                            });
                          }}
                          className="sm:col-span-3"
                        />
                        {editingMachine && (
                          <p className="sm:col-span-4 text-xs text-muted-foreground text-center">
                            Leave empty to keep the current image
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleMachineDialogClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUploadingFile}>
                        {isUploadingFile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingMachine ? "Updating..." : "Creating..."}
                          </>
                        ) : editingMachine ? (
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
                        selectedMachines.length === paginatedMachines.length &&
                        paginatedMachines.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMachines(
                            paginatedMachines.map((m) => m.id),
                          );
                        } else {
                          setSelectedMachines([]);
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
                {paginatedMachines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm">
                      No machine found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMachines.map((machine) => (
                    <TableRow key={machine.id || `machine-${Math.random()}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMachines.includes(machine.id)}
                          onCheckedChange={() =>
                            handleSelectMachine(machine.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <img
                          src={
                            (machine.image_urls?.length
                              ? machine.image_urls[
                                  machine.image_urls.length - 1
                                ]
                              : undefined) || "/placeholder-image.png"
                          }
                          alt={machine.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {machine.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-green-600/10 text-green-600"
                        >
                          <Tag className="h-4 w-4 mr-1" />
                          {machine.type?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(machine.created_at)}</TableCell>
                      <TableCell>{formatDate(machine.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditMachine(machine)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                openDeleteMachineDialog(machine.id)
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

          {/* Pagination */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto md:items-center">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredAndSortedMachines.length)} of{" "}
                {filteredAndSortedMachines.length} machines
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px]">
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
            <div className="flex items-center gap-2 w-full md:w-auto justify-end mt-2 md:mt-0">
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

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto md:items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={documentSearchTerm}
                  onChange={(e) => setDocumentSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[220px] md:w-[300px]"
                />
              </div>
              <Select
                value={selectedDocumentMachineType}
                onValueChange={handleDocumentMachineTypeChange}
              >
                <SelectTrigger className="w-full sm:w-[180px] md:w-[200px]">
                  <SelectValue placeholder="Filter by Machine Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Machine Types</SelectItem>
                  {machineTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedDocumentMachine}
                onValueChange={setSelectedDocumentMachine}
              >
                <SelectTrigger className="w-full sm:w-[180px] md:w-[200px]">
                  <SelectValue placeholder="Filter by Machine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Machines</SelectItem>
                  {Array.from(
                    new Map(
                      machines
                        .filter(
                          (machine) =>
                            selectedDocumentMachineType === "" ||
                            selectedDocumentMachineType === "all" ||
                            machine.type_id === selectedDocumentMachineType,
                        )
                        .map((machine) => [machine.name, machine]),
                    ).values(),
                  ).map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name} ({machine.type?.name || "Unknown"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(documentSearchTerm ||
                selectedDocumentMachineType ||
                selectedDocumentMachine) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDocumentFilters}
                  className="px-3 w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Dialog
                open={isDocumentDialogOpen}
                onOpenChange={setIsDocumentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setEditingDocument(null)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
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
                          htmlFor="documentMachineType"
                          className="text-right"
                        >
                          Machine Type
                        </Label>
                        <Select
                          value={documentFormData.machine_type_id}
                          onValueChange={(value) =>
                            setDocumentFormData({
                              ...documentFormData,
                              machine_type_id: value,
                              machine_id: "none", // Reset machine selection when machine type changes
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select machine type (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {machineTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="documentMachine" className="text-right">
                          Machine
                        </Label>
                        <Select
                          value={documentFormData.machine_id}
                          onValueChange={(value) =>
                            setDocumentFormData({
                              ...documentFormData,
                              machine_id: value,
                            })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select machine (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {Array.from(
                              new Map(
                                machines
                                  .filter(
                                    (machine) =>
                                      documentFormData.machine_type_id ===
                                        "none" ||
                                      !documentFormData.machine_type_id ||
                                      machine.type_id ===
                                        documentFormData.machine_type_id,
                                  )
                                  .map((machine) => [machine.name, machine]), // Use name as key
                              ).values(),
                            ).map((machine) => (
                              <SelectItem key={machine.id} value={machine.id}>
                                {machine.name} (
                                {machine.type?.name || "Unknown"})
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortDocument("title")}
                  >
                    <div className="flex items-center">
                      Title
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortDocument("author")}
                  >
                    <div className="flex items-center">
                      Author
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortDocument("file_url")}
                  >
                    <div className="flex items-center">
                      PDF File
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortDocument("machineType")}
                  >
                    <div className="flex items-center">
                      Machine Type
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortDocument("machine")}
                  >
                    <div className="flex items-center">
                      Machine
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
                    <TableCell colSpan={8} className="h-24 text-center text-sm">
                      No Document found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDocuments.map((doc) => (
                    <TableRow key={doc.id || `doc-${Math.random()}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="font-medium">{doc.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {doc.author || "Unknown"}
                        </span>
                      </TableCell>
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
                        {doc.MachineTypes ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-600/10 text-green-600"
                          >
                            <Tag className="h-4 w-4 mr-1" />
                            {doc.MachineTypes.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.Machines?.name ? (
                          <div className="flex justify-start items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="bg-green-600/10 text-green-600"
                            >
                              <Tag className="h-4 w-4 mr-1" />
                              {doc.Machines.name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(doc.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditDocument(doc)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto md:items-center">
              <div className="text-sm text-muted-foreground">
                Showing {documentStartIndex + 1}-
                {Math.min(documentEndIndex, filteredAndSortedDocuments.length)}{" "}
                of {filteredAndSortedDocuments.length} documents
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={String(documentPageSize)}
                  onValueChange={(v) => {
                    setDocumentPageSize(Number(v));
                    setDocumentCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px]">
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
            <div className="flex items-center gap-2 w-full md:w-auto justify-end mt-2 md:mt-0">
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

      {/* Delete Confirmation Dialogs */}
      <Dialog
        open={isDeleteMachineDialogOpen}
        onOpenChange={setIsDeleteMachineDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Machine</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this machine? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteMachineDialogOpen(false)}
              disabled={deleteMachineLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMachine}
              disabled={deleteMachineLoading}
            >
              {deleteMachineLoading ? (
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

      <Dialog
        open={isDeleteMachineTypeDialogOpen}
        onOpenChange={setIsDeleteMachineTypeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Machine Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this machine type? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteMachineTypeDialogOpen(false)}
              disabled={deleteMachineTypeLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMachineType}
              disabled={deleteMachineTypeLoading}
            >
              {deleteMachineTypeLoading ? (
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

const AdminMachinePage = () => {
  return (
    <MachineProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties & { [key: string]: string }
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <MachinesManagement />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </MachineProvider>
  );
};

export default AdminMachinePage;

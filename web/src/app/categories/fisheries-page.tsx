import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import FisheryProvider from "@/providers/fishery-provider";
import { useFishery } from "@/context/fishery-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useState, useEffect, useMemo } from "react";
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
  Fish,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Fishery, Document } from "@/lib/interface";

const FisheriesManagement = () => {
  const {
    fisheries,
    documents,
    isLoading,
    isUploadingFile,
    createFishery,
    updateFishery,
    deleteFishery,
    bulkDeleteFisheries: bulkDeleteFishery,
    createDocument,
    updateDocument,
    deleteDocument,
    getTotalFisheriesCount: getTotalFisheryCount,
    getTotalDocumentsCount,
    refreshAll,
  } = useFishery();

  // UI State for Fishery
  const [fisherySearchTerm, setFisherySearchTerm] = useState("");
  const [isFisheryDialogOpen, setIsFisheryDialogOpen] = useState(false);
  const [editingFishery, setEditingFishery] = useState<Fishery | null>(null);
  const [fisheryFormData, setFisheryFormData] = useState({
    name: "",
    image: null as File | null,
  });
  const [selectedFishery, setSelectedFishery] = useState<string[]>([]);

  // Document UI state
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [selectedDocumentFishery, setSelectedDocumentFishery] =
    useState<string>("all_fisheries");
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [documentFormData, setDocumentFormData] = useState({
    fish_id: "none",
    title: "",
    author: "",
    pdfFile: null as File | null,
  });

  // Pagination state for Fishery
  const [fisheryCurrentPage, setFisheryCurrentPage] = useState(1);
  const [fisheryPageSize, setFisheryPageSize] = useState(10);
  const [fisherySortBy, setFisherySortBy] = useState<string>("");
  const [fisherySortOrder, setFisherySortOrder] = useState<"asc" | "desc">(
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
  const [deleteFisheryId, setDeleteFisheryId] = useState<string | null>(null);
  const [isDeleteFisheryDialogOpen, setIsDeleteFisheryDialogOpen] =
    useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [isDeleteDocumentDialogOpen, setIsDeleteDocumentDialogOpen] =
    useState(false);
  const [deleteFisheryLoading, setDeleteFisheryLoading] = useState(false);
  const [deleteDocumentLoading, setDeleteDocumentLoading] = useState(false);

  // Filter and sort functions for Fishery
  const filteredAndSortedFishery = useMemo(() => {
    const filtered = fisheries.filter((fishery) =>
      (fishery.name || "")
        .toLowerCase()
        .includes(fisherySearchTerm.toLowerCase()),
    );

    return filtered.sort((a, b) => {
      if (!fisherySortBy) return 0;

      let aValue: any = a;
      let bValue: any = b;

      if (fisherySortBy === "name") {
        aValue = a.name || "";
        bValue = b.name || "";
      } else if (fisherySortBy === "created_at") {
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      } else if (fisherySortBy === "updated_at") {
        aValue = new Date(a.updated_at);
        bValue = new Date(b.updated_at);
      }

      if (fisherySortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [fisheries, fisherySearchTerm, fisherySortBy, fisherySortOrder]);

  // Fishery pagination logic
  const fisheryTotalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedFishery.length / fisheryPageSize),
  );
  const fisheryStartIndex = (fisheryCurrentPage - 1) * fisheryPageSize;
  const fisheryEndIndex = fisheryStartIndex + fisheryPageSize;
  const paginatedFishery = useMemo(
    () => filteredAndSortedFishery.slice(fisheryStartIndex, fisheryEndIndex),
    [filteredAndSortedFishery, fisheryStartIndex, fisheryEndIndex],
  );

  const documentsWithFishery = useMemo(
    () =>
      documents.map((doc) => ({
        ...doc,
        Fisheries: doc.Fisheries || fisheries.find((l) => l.id === doc.fish_id),
      })),
    [documents, fisheries],
  );

  // Filter and sort functions for Document (only show those with fish_id)
  const filteredAndSortedDocuments = useMemo(() => {
    const filtered = documentsWithFishery
      .filter((doc) => doc.fish_id != null)
      .filter((doc) => {
        const searchTerm = documentSearchTerm.toLowerCase();
        const matchesSearch =
          (doc.Fisheries?.name || "").toLowerCase().includes(searchTerm) ||
          (doc.title || "").toLowerCase().includes(searchTerm) ||
          (doc.author || "").toLowerCase().includes(searchTerm);

        const matchesFishery =
          selectedDocumentFishery === "" ||
          selectedDocumentFishery === "all_fisheries" ||
          doc.fish_id === selectedDocumentFishery;

        return matchesSearch && matchesFishery;
      });

    return filtered.sort((a, b) => {
      if (!documentSortBy) return 0;

      let aValue: any = a;
      let bValue: any = b;

      if (documentSortBy === "title") {
        aValue = a.title || "";
        bValue = b.title || "";
      } else if (documentSortBy === "author") {
        aValue = a.author || "";
        bValue = b.author || "";
      } else if (documentSortBy === "fishery") {
        aValue = a.Fisheries?.name || "";
        bValue = b.Fisheries?.name || "";
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
    documentsWithFishery,
    documentSearchTerm,
    selectedDocumentFishery,
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

  // Reset pagination when filters change
  useEffect(() => {
    setFisheryCurrentPage(1);
  }, [fisherySearchTerm, fisherySortBy, fisherySortOrder]);

  useEffect(() => {
    setDocumentCurrentPage(1);
  }, [
    documentSearchTerm,
    selectedDocumentFishery,
    documentSortBy,
    documentSortOrder,
  ]);

  // Auto-adjust page if current page exceeds total pages
  useEffect(() => {
    if (fisheryCurrentPage > fisheryTotalPages && fisheryTotalPages > 0) {
      setFisheryCurrentPage(fisheryTotalPages);
    }
  }, [fisheryCurrentPage, fisheryTotalPages]);

  useEffect(() => {
    if (documentCurrentPage > documentTotalPages && documentTotalPages > 0) {
      setDocumentCurrentPage(documentTotalPages);
    }
  }, [documentCurrentPage, documentTotalPages]);

  // Fishery CRUD operations
  const handleFisherySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fisheryFormData.name) {
      toast.error("Please enter fishery name");
      return;
    }

    const formData = new FormData();
    formData.append("name", fisheryFormData.name);
    if (fisheryFormData.image) {
      formData.append("image_urls", fisheryFormData.image);
    }

    const success = editingFishery
      ? await updateFishery(editingFishery.id, formData)
      : await createFishery(formData);

    if (success) {
      setIsFisheryDialogOpen(false);
      resetFisheryForm();
    }
  };

  const handleDeleteFishery = async () => {
    if (!deleteFisheryId) return;
    setDeleteFisheryLoading(true);
    await deleteFishery(deleteFisheryId);
    setDeleteFisheryLoading(false);
    setIsDeleteFisheryDialogOpen(false);
    setDeleteFisheryId(null);
  };

  // Document CRUD operations
  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentFormData.title || !documentFormData.author) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!documentFormData.pdfFile && !editingDocument) {
      toast.error("Please select a PDF file");
      return;
    }

    const formData = new FormData();
    if (documentFormData.fish_id && documentFormData.fish_id !== "none") {
      formData.append("fish_id", documentFormData.fish_id);
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
  const resetFisheryForm = () => {
    setFisheryFormData({ name: "", image: null });
    setEditingFishery(null);
  };

  const resetDocumentForm = () => {
    setDocumentFormData({
      fish_id: "none",
      title: "",
      author: "",
      pdfFile: null,
    });
    setEditingDocument(null);
  };

  // Edit handlers
  const handleEditFishery = (fishery: Fishery) => {
    setEditingFishery(fishery);
    setFisheryFormData({
      name: fishery.name ?? "",
      image: null,
    });
    setIsFisheryDialogOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setDocumentFormData({
      fish_id: doc.fish_id || "none",
      title: doc.title ?? "",
      author: doc.author ?? "",
      pdfFile: null,
    });
    setIsDocumentDialogOpen(true);
  };

  // Dialog close handlers
  const handleFisheryDialogClose = () => {
    setIsFisheryDialogOpen(false);
    resetFisheryForm();
  };

  const handleDocumentDialogClose = () => {
    setIsDocumentDialogOpen(false);
    resetDocumentForm();
  };

  // Selection handlers
  const handleSelectFishery = (fisheryId: string) => {
    setSelectedFishery((prev) =>
      prev.includes(fisheryId)
        ? prev.filter((id) => id !== fisheryId)
        : [...prev, fisheryId],
    );
  };

  // Bulk delete handlers
  const handleBulkDeleteFishery = async () => {
    if (selectedFishery.length === 0) return;
    const success = await bulkDeleteFishery(selectedFishery);
    if (success) {
      setSelectedFishery([]);
    }
  };

  // Sorting handlers
  const handleSortFishery = (column: string) => {
    if (fisherySortBy === column) {
      setFisherySortOrder(fisherySortOrder === "asc" ? "desc" : "asc");
    } else {
      setFisherySortBy(column);
      setFisherySortOrder("asc");
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

  // Open delete dialogs
  const openDeleteFisheryDialog = (id: string) => {
    setDeleteFisheryId(id);
    setIsDeleteFisheryDialogOpen(true);
  };

  const openDeleteDocumentDialog = (id: string) => {
    setDeleteDocumentId(id);
    setIsDeleteDocumentDialogOpen(true);
  };

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Fisheries Management
          </h1>
          <p className="text-gray-600 mt-2">Manage fisheries and documents</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Fishery Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-bl-full"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Fish className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                    Total Fisheries
                  </CardTitle>
                  <p className="text-xs text-blue-600/80 mt-0.5">
                    All aquatic species
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="text-3xl font-bold text-blue-900">
                {getTotalFisheryCount()}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-700 font-medium">
                  Active Records
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
                {getTotalDocumentsCount()}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-violet-700 font-medium">
                  {
                    [
                      ...new Set(
                        documents
                          .map((doc) => doc.fish_id)
                          .filter((id) => id !== null),
                      ),
                    ].length
                  }{" "}
                  Fisheries Linked
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

      <Tabs defaultValue="fishery" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fishery">Fisheries</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* FISHERY TAB */}
        <TabsContent value="fishery" className="space-y-4">
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between w-full">
            <div className="flex flex-wrap gap-2 items-center min-w-0 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fisheries..."
                  value={fisherySearchTerm}
                  onChange={(e) => setFisherySearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[300px]"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
              {selectedFishery.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteFishery}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedFishery.length})
                </Button>
              )}
              <Dialog
                open={isFisheryDialogOpen}
                onOpenChange={setIsFisheryDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setEditingFishery(null)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fishery
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingFishery ? "Edit Fishery" : "Add New Fishery"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingFishery
                        ? "Update fishery information"
                        : "Create a new fishery record"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleFisherySubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fisheryName" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="fisheryName"
                          value={fisheryFormData.name}
                          onChange={(e) =>
                            setFisheryFormData({
                              ...fisheryFormData,
                              name: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Enter fishery name"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fisheryImage" className="text-right">
                          Image
                        </Label>
                        <Input
                          id="fisheryImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setFisheryFormData({
                              ...fisheryFormData,
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
                        onClick={handleFisheryDialogClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUploadingFile}>
                        {isUploadingFile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingFishery ? "Updating..." : "Creating..."}
                          </>
                        ) : editingFishery ? (
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
                        selectedFishery.length === paginatedFishery.length &&
                        paginatedFishery.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFishery(paginatedFishery.map((l) => l.id));
                        } else {
                          setSelectedFishery([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortFishery("name")}
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortFishery("created_at")}
                  >
                    <div className="flex items-center">
                      Created
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortFishery("updated_at")}
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
                {paginatedFishery.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm">
                      No fisheries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFishery.map((fishery) => (
                    <TableRow key={fishery.id || `fishery-${Math.random()}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedFishery.includes(fishery.id)}
                          onCheckedChange={() =>
                            handleSelectFishery(fishery.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <img
                          src={
                            (fishery.image_urls?.length
                              ? fishery.image_urls[
                                  fishery.image_urls.length - 1
                                ]
                              : undefined) || "/placeholder-image.png"
                          }
                          alt={fishery.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {fishery.name}
                      </TableCell>
                      <TableCell>{formatDate(fishery.created_at)}</TableCell>
                      <TableCell>{formatDate(fishery.updated_at)}</TableCell>
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
                              onClick={() => handleEditFishery(fishery)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                openDeleteFisheryDialog(fishery.id)
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

          {/* Fishery Pagination */}
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between px-2 w-full">
            <div className="flex flex-wrap gap-2 items-center min-w-0 w-full md:w-auto">
              <div className="text-sm text-muted-foreground w-full sm:w-auto">
                Showing {fisheryStartIndex + 1}-
                {Math.min(fisheryEndIndex, filteredAndSortedFishery.length)} of{" "}
                {filteredAndSortedFishery.length} fisheries
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={fisheryPageSize.toString()}
                  onValueChange={(value) => {
                    setFisheryPageSize(Number(value));
                    setFisheryCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFisheryCurrentPage(Math.max(1, fisheryCurrentPage - 1))
                }
                disabled={fisheryCurrentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {fisheryCurrentPage} of {fisheryTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFisheryCurrentPage(
                    Math.min(fisheryTotalPages, fisheryCurrentPage + 1),
                  )
                }
                disabled={fisheryCurrentPage === fisheryTotalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* DocumentS TAB */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between w-full">
            <div className="flex flex-wrap gap-2 items-center min-w-0 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={documentSearchTerm}
                  onChange={(e) => setDocumentSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[250px]"
                />
              </div>
              <Select
                value={selectedDocumentFishery}
                onValueChange={setSelectedDocumentFishery}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by fishery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_fisheries">All Fisheries</SelectItem>
                  {fisheries.map((fishery) => (
                    <SelectItem key={fishery.id} value={fishery.id}>
                      {fishery.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-center">
              <Dialog
                open={isDocumentDialogOpen}
                onOpenChange={setIsDocumentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingDocument(null)}>
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
                        ? "Update Document information"
                        : "Create a new Document"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDocumentSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="Fishery" className="text-right">
                          Fishery
                        </Label>
                        <Select
                          value={documentFormData.fish_id}
                          onValueChange={(value) =>
                            setDocumentFormData({
                              ...documentFormData,
                              fish_id: value,
                            })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select fishery (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {fisheries.map((fishery) => (
                              <SelectItem key={fishery.id} value={fishery.id}>
                                {fishery.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="Title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="Title"
                          value={documentFormData.title}
                          onChange={(e) =>
                            setDocumentFormData({
                              ...documentFormData,
                              title: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Enter document title"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="Author" className="text-right">
                          Author
                        </Label>
                        <Input
                          id="Author"
                          value={documentFormData.author}
                          onChange={(e) =>
                            setDocumentFormData({
                              ...documentFormData,
                              author: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Enter author name"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="Pdf" className="text-right">
                          PDF File
                        </Label>
                        <Input
                          id="Pdf"
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
                        />
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
                            {editingDocument ? "Updating..." : "Creating..."}
                          </>
                        ) : editingDocument ? (
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
                  <TableHead>PDF File</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortDocument("fishery")}
                  >
                    <div className="flex items-center">
                      Fishery
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSortDocument("created_at")}
                  >
                    <div className="flex items-center">
                      Created
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
                      No documents found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDocuments.map((doc) => (
                    <TableRow key={doc.id || `doc-${Math.random()}`}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>{doc.author}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-red-500 mr-2" />
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
                        {doc.Fisheries ? (
                          <Badge variant="outline">{doc.Fisheries?.name}</Badge>
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

          {/*  Pagination */}
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
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDocumentCurrentPage(Math.max(1, documentCurrentPage - 1))
                }
                disabled={documentCurrentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {documentCurrentPage} of {documentTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDocumentCurrentPage(
                    Math.min(documentTotalPages, documentCurrentPage + 1),
                  )
                }
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
        open={isDeleteFisheryDialogOpen}
        onOpenChange={setIsDeleteFisheryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this fishery? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteFisheryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFishery}
              disabled={deleteFisheryLoading}
            >
              {deleteFisheryLoading ? (
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
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this Document? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDocumentDialogOpen(false)}
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

const AdminFisheriesPage = () => {
  return (
    <FisheryProvider>
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
              <FisheriesManagement />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </FisheryProvider>
  );
};

export default AdminFisheriesPage;

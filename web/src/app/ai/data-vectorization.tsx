import { AppSidebar } from "@/components/app-sidebar";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/providers/auth-provider.tsx";
import LoadingSpinner from "@/components/LoadingSpinner.tsx";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  RefreshCw,
  FileText,
  Database,
  Check,
  Loader2,
  ArrowUpDown,
  BookOpen,
  Eye,
} from "lucide-react";

interface PendingItem {
  id: string;
  type: "post" | "document" | "knowledgeBase";
  title: string;
  content?: string;
  author?: string;
  user_type?: string;
  file_urls?: string[];
  embeddingStatus: string;
  created_at: string;
}

const DataVectorization = () => {
  const { user, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<PendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewItem, setPreviewItem] = useState<PendingItem | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const fetchPendingItems = async () => {
    try {
      const token = localStorage.getItem("token") || undefined;
      const result = await api.get("/data-vectorization/all", token);
      if (result.items) {
        setItems(result.items);
      }
    } catch (error) {
      toast.error("Failed to fetch items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPendingItems();
  }, [user]);

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item.id));
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const filteredItems = items
    .filter((item) => {
      const matchesType = activeTab === "all" || item.type === activeTab;
      const matchesStatus = statusFilter === "all" || item.embeddingStatus === statusFilter;
      return matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;

      let aValue: any = a;
      let bValue: any = b;

      if (sortBy === "title") {
        aValue = a.title || "";
        bValue = b.title || "";
      } else if (sortBy === "type") {
        aValue = a.type || "";
        bValue = b.type || "";
      } else if (sortBy === "author") {
        aValue = a.author || "";
        bValue = b.author || "";
      } else if (sortBy === "embeddingStatus") {
        aValue = a.embeddingStatus || "";
        bValue = b.embeddingStatus || "";
      } else if (sortBy === "created_at") {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const postCount = items.filter((item) => item.type === "post").length;
  const documentCount = items.filter((item) => item.type === "document").length;
  const knowledgeBaseCount = items.filter((item) => item.type === "knowledgeBase").length;

  const postPendingCount = items.filter((item) => item.type === "post" && item.embeddingStatus === "PENDING").length;
  const postProcessingCount = items.filter((item) => item.type === "post" && item.embeddingStatus === "PROCESSING").length;
  const postCompletedCount = items.filter((item) => item.type === "post" && item.embeddingStatus === "COMPLETED").length;
  const postFailedCount = items.filter((item) => item.type === "post" && item.embeddingStatus === "FAILED").length;

  const documentPendingCount = items.filter((item) => item.type === "document" && item.embeddingStatus === "PENDING").length;
  const documentProcessingCount = items.filter((item) => item.type === "document" && item.embeddingStatus === "PROCESSING").length;
  const documentCompletedCount = items.filter((item) => item.type === "document" && item.embeddingStatus === "COMPLETED").length;
  const documentFailedCount = items.filter((item) => item.type === "document" && item.embeddingStatus === "FAILED").length;

  const knowledgeBasePendingCount = items.filter((item) => item.type === "knowledgeBase" && item.embeddingStatus === "PENDING").length;
  const knowledgeBaseProcessingCount = items.filter((item) => item.type === "knowledgeBase" && item.embeddingStatus === "PROCESSING").length;
  const knowledgeBaseCompletedCount = items.filter((item) => item.type === "knowledgeBase" && item.embeddingStatus === "COMPLETED").length;
  const knowledgeBaseFailedCount = items.filter((item) => item.type === "knowledgeBase" && item.embeddingStatus === "FAILED").length;

  const handleBulkProcess = async (
    status: "PROCESSING" | "COMPLETED" | "FAILED",
  ) => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to process");
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token") || undefined;
      const updates = selectedItems.map((id) => {
        const item = items.find((i) => i.id === id);
        return {
          type: item?.type,
          id,
          status,
        };
      });

      await api.put("/data-vectorization/status/bulk", { updates }, token);
      toast.success(`Items marked as ${status}`);
      setSelectedItems([]);
      fetchPendingItems();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleProcess = async (
    item: PendingItem,
    status: "PROCESSING" | "COMPLETED" | "FAILED",
  ) => {
    try {
      const token = localStorage.getItem("token") || undefined;
      await api.put(
        "/data-vectorization/status",
        { type: item.type, id: item.id, status },
        token,
      );
      toast.success(`Item marked as ${status}`);
      fetchPendingItems();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handlePreview = (item: PendingItem) => {
    if (item.type === "post") {
      setPreviewItem(item);
      setIsPreviewDialogOpen(true);
    } else if (item.file_urls && item.file_urls.length > 0) {
      window.open(item.file_urls[0], "_blank");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "post":
        return <FileText className="h-4 w-4" />;
      case "document":
        return <Database className="h-4 w-4" />;
      case "knowledgeBase":
        return <Database className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "PROCESSING":
        return "default";
      case "COMPLETED":
        return "default";
      case "FAILED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (authLoading) return <LoadingSpinner />;
  if (!user || user.user_type !== "ADMIN") return <Navigate to="/" />;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 space-y-4 p-8">
          <div className="rounded-xl border bg-background/80 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Data Vectorization
                </h2>
                <p className="text-muted-foreground">
                  Manage embedding status for Posts, Documents, and Knowledge
                  Base
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={fetchPendingItems}
                  variant="outline"
                  size="icon"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-bl-full"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-violet-500/10 rounded-lg">
                        <FileText className="h-6 w-6 text-violet-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-violet-800 uppercase tracking-wide">
                          Posts
                        </CardTitle>
                        <p className="text-xs text-violet-600/80 mt-0.5">
                          Social media posts
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-violet-900">
                      {postCount}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-violet-600">Pending:</span>
                        <span className="font-medium text-violet-800">{postPendingCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-violet-600">Processing:</span>
                        <span className="font-medium text-violet-800">{postProcessingCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-violet-600">Completed:</span>
                        <span className="font-medium text-violet-800">{postCompletedCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-violet-600">Failed:</span>
                        <span className="font-medium text-violet-800">{postFailedCount}</span>
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
                        <Database className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                          Documents
                        </CardTitle>
                        <p className="text-xs text-blue-600/80 mt-0.5">
                          Reference documents
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-blue-900">
                      {documentCount}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600">Pending:</span>
                        <span className="font-medium text-blue-800">{documentPendingCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600">Processing:</span>
                        <span className="font-medium text-blue-800">{documentProcessingCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600">Completed:</span>
                        <span className="font-medium text-blue-800">{documentCompletedCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600">Failed:</span>
                        <span className="font-medium text-blue-800">{documentFailedCount}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-bl-full"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <BookOpen className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">
                          Knowledge Base
                        </CardTitle>
                        <p className="text-xs text-emerald-600/80 mt-0.5">
                          Knowledge entries
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-emerald-900">
                      {knowledgeBaseCount}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-600">Pending:</span>
                        <span className="font-medium text-emerald-800">{knowledgeBasePendingCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-600">Processing:</span>
                        <span className="font-medium text-emerald-800">{knowledgeBaseProcessingCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-600">Completed:</span>
                        <span className="font-medium text-emerald-800">{knowledgeBaseCompletedCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-600">Failed:</span>
                        <span className="font-medium text-emerald-800">{knowledgeBaseFailedCount}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedItems.length} item(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkProcess("PROCESSING")}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Vectorize Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="post">Posts</TabsTrigger>
              <TabsTrigger value="document">Documents</TabsTrigger>
              <TabsTrigger value="knowledgeBase">Knowledge Base</TabsTrigger>
            </TabsList>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground">Filter by status:</span>
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "PENDING" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("PENDING")}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "PROCESSING" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("PROCESSING")}
              >
                Processing
              </Button>
              <Button
                variant={statusFilter === "COMPLETED" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("COMPLETED")}
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === "FAILED" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("FAILED")}
              >
                Failed
              </Button>
            </div>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedItems.length === filteredItems.length &&
                              filteredItems.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
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
                          onClick={() => handleSort("title")}
                        >
                          <div className="flex items-center">
                            Title
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("author")}
                        >
                          <div className="flex items-center">
                            Author
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("embeddingStatus")}
                        >
                          <div className="flex items-center">
                            Status
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-sm">
                            No items found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={() => handleSelectItem(item.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTypeIcon(item.type)}
                                <Badge variant="outline" className="capitalize">
                                  {item.type}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.author || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusColor(item.embeddingStatus) as any}
                              >
                                {item.embeddingStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreview(item)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Preview
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleSingleProcess(item, "PROCESSING")
                                  }
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Vectorize Now
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Preview Dialog */}
          <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post Preview</DialogTitle>
                <DialogDescription>
                  View post content and details
                </DialogDescription>
              </DialogHeader>
              {previewItem && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Title</Label>
                    <p className="font-medium">{previewItem.title}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Author</Label>
                    <p className="font-medium">{previewItem.author ? `${previewItem.author} (${previewItem.user_type})` : "—"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Content</Label>
                    <p className="text-sm whitespace-pre-wrap">{previewItem.content || "—"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Embedding Status</Label>
                    <Badge variant="outline">
                      {previewItem.embeddingStatus}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Created At</Label>
                    <p className="font-medium">
                      {new Date(previewItem.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DataVectorization;

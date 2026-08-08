import { AppSidebar } from "@/components/app-sidebar";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/providers/auth-provider.tsx";
import LoadingSpinner from "@/components/LoadingSpinner.tsx";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  RefreshCw,
  FileText,
  Plus,
  Trash2,
  Edit,
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Check,
  Eye,
} from "lucide-react";

const KnowledgeBaseManagement = () => {
  const { user, isLoading: authLoading } = useAuth();

  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Create/Edit dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    file: null as File | null,
  });

  const fetchKnowledgeBase = async () => {
    try {
      const token = localStorage.getItem("token") || undefined;
      const result = await api.get("/knowledge-base", token);
      if (result.knowledgeBase) {
        setKnowledgeBase(result.knowledgeBase);
      }
    } catch (error) {
      toast.error("Failed to fetch knowledge base");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchKnowledgeBase();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || undefined;

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("author", formData.author);
      if (formData.file) {
        formDataToSend.append("file_urls", formData.file);
      }

      const endpoint = editingItem
        ? `/knowledge-base/${editingItem.id}`
        : `/knowledge-base`;

      if (editingItem) {
        await api.put(endpoint, formDataToSend, token);
      } else {
        await api.post(endpoint, formDataToSend, token);
      }

      toast.success(
        editingItem ? "Knowledge base updated" : "Knowledge base created",
      );
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        title: "",
        author: "",
        file: null,
      });
      fetchKnowledgeBase();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this knowledge base item?"))
      return;
    try {
      const token = localStorage.getItem("token") || undefined;
      await api.delete(`/knowledge-base/${id}`, token);
      toast.success("Knowledge base deleted");
      fetchKnowledgeBase();
    } catch (error) {
      toast.error("Failed to delete knowledge base");
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      author: item.author,
      file: null,
    });
    setIsDialogOpen(true);
  };

  const handleView = (item: any) => {
    if (item.file_urls && item.file_urls.length > 0) {
      window.open(item.file_urls[0], "_blank");
    }
  };

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

  const filteredItems = knowledgeBase
    .filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;

      let aValue: any = a;
      let bValue: any = b;

      if (sortBy === "title") {
        aValue = a.title || "";
        bValue = b.title || "";
      } else if (sortBy === "author") {
        aValue = a.author || "";
        bValue = b.author || "";
      } else if (sortBy === "file_urls") {
        aValue = a.file_urls?.length || 0;
        bValue = b.file_urls?.length || 0;
      } else if (sortBy === "size") {
        aValue = a.size || 0;
        bValue = b.size || 0;
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

  const totalItems = knowledgeBase.length;
  const pendingCount = knowledgeBase.filter(
    (item) => item.embeddingStatus === "PENDING",
  ).length;
  const processingCount = knowledgeBase.filter(
    (item) => item.embeddingStatus === "PROCESSING",
  ).length;
  const completedCount = knowledgeBase.filter(
    (item) => item.embeddingStatus === "COMPLETED",
  ).length;

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
                  Knowledge Base Management
                </h2>
                <p className="text-muted-foreground">
                  Manage AI knowledge base documents
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={fetchKnowledgeBase}
                  variant="outline"
                  size="icon"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingItem(null);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Knowledge Base
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem
                          ? "Edit Knowledge Base"
                          : "Add New Knowledge Base"}
                      </DialogTitle>
                      <DialogDescription>
                        Add or edit knowledge base documents for AI
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="Enter document title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Author</Label>
                        <Input
                          placeholder="Enter author name"
                          value={formData.author}
                          onChange={(e) =>
                            setFormData({ ...formData, author: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>File</Label>
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setFormData({ ...formData, file: file || null });
                          }}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit">
                          {editingItem ? "Update" : "Create"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-bl-full"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <FileText className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
                          Pending
                        </CardTitle>
                        <p className="text-xs text-amber-600/80 mt-0.5">
                          Awaiting processing
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-amber-900">
                      {pendingCount}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-700 font-medium">
                        {totalItems > 0 ? ((pendingCount / totalItems) * 100).toFixed(0) : 0}% of total
                      </span>
                      <div className="flex items-center space-x-1 text-amber-600">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
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
                        <RefreshCw className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                          Processing
                        </CardTitle>
                        <p className="text-xs text-blue-600/80 mt-0.5">
                          Currently processing
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-blue-900">
                      {processingCount}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-700 font-medium">
                        {totalItems > 0 ? ((processingCount / totalItems) * 100).toFixed(0) : 0}% of total
                      </span>
                      <div className="flex items-center space-x-1 text-blue-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
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
                        <Check className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">
                          Completed
                        </CardTitle>
                        <p className="text-xs text-emerald-600/80 mt-0.5">
                          Successfully processed
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-emerald-900">
                      {completedCount}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-medium">
                        {totalItems > 0 ? ((completedCount / totalItems) * 100).toFixed(0) : 0}% of total
                      </span>
                      <div className="flex items-center space-x-1 text-emerald-600">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

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
                      onClick={() => handleSort("file_urls")}
                    >
                      <div className="flex items-center">
                        Files
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("size")}
                    >
                      <div className="flex items-center">
                        Size
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
                      <TableCell colSpan={8} className="h-24 text-center text-sm">
                        No knowledge base items found.
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
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.author || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.file_urls?.length || 0}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.size ? `${(item.size / 1024).toFixed(2)} KB` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.embeddingStatus || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleView(item)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(item.id)}
                                className="text-destructive"
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
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default KnowledgeBaseManagement;

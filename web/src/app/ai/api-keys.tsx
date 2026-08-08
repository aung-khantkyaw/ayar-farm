import { AppSidebar } from "@/components/app-sidebar";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/providers/auth-provider.tsx";
import LoadingSpinner from "@/components/LoadingSpinner.tsx";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  Key as KeyIcon,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Search,
  X,
  Check,
  ArrowUpDown,
  MoreHorizontal,
} from "lucide-react";

const AI_PROVIDERS = ["OPENROUTER", "OPENAI", "ANTHROPIC", "GOOGLE", "CUSTOM"];

const ApiKeysManagement = () => {
  const { user, isLoading: authLoading } = useAuth();

  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Create/Edit dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<any | null>(null);
  const [viewingKey, setViewingKey] = useState<any | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    provider: "OPENAI",
    llmModelName: "",
    embeddingModelName: "",
    vectorSize: 1536,
    apiKey: "",
    baseUrl: "",
    limit: 0,
    expiresAt: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem("token") || undefined;
      const result = await api.get("/api-keys", token);
      console.log("API Response:", result);
      if (result.data) {
        setApiKeys(result.data);
      } else if (Array.isArray(result)) {
        setApiKeys(result);
      }
    } catch (error) {
      toast.error("Failed to fetch API keys");
      console.error("Error fetching API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchApiKeys();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || undefined;
      const endpoint = editingKey ? `/api-keys/${editingKey.id}` : `/api-keys`;

      if (editingKey) {
        await api.put(endpoint, formData, token);
      } else {
        await api.post(endpoint, formData, token);
      }

      toast.success(editingKey ? "API key updated" : "API key created");
      setIsDialogOpen(false);
      setEditingKey(null);
      setFormData({
        provider: "OPENAI",
        llmModelName: "",
        embeddingModelName: "",
        vectorSize: 1536,
        apiKey: "",
        baseUrl: "",
        limit: 0,
        expiresAt: "",
      });
      fetchApiKeys();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    try {
      const token = localStorage.getItem("token") || undefined;
      await api.delete(`/api-keys/${id}`, token);
      toast.success("API key deleted");
      fetchApiKeys();
    } catch (error) {
      toast.error("Failed to delete API key");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const token = localStorage.getItem("token") || undefined;
      
      // If activating, first deactivate all other keys
      if (!currentActive) {
        const activeKeys = apiKeys.filter((key) => key.active && key.id !== id);
        for (const key of activeKeys) {
          await api.put(`/api-keys/${key.id}`, { ...key, active: false }, token);
        }
      }
      
      // Toggle the selected key
      await api.put(`/api-keys/${id}`, { active: !currentActive }, token);
      toast.success(!currentActive ? "API key activated" : "API key deactivated");
      fetchApiKeys();
    } catch (error) {
      toast.error("Failed to toggle API key status");
    }
  };

  const handleEdit = (key: any) => {
    setEditingKey(key);
    setFormData({
      provider: key.provider,
      llmModelName: key.llmModelName,
      embeddingModelName: key.embeddingModelName,
      vectorSize: key.vectorSize,
      apiKey: key.apiKey || "",
      baseUrl: key.baseUrl || "",
      limit: key.limit,
      expiresAt: key.expiresAt ? key.expiresAt.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleView = (key: any) => {
    setViewingKey(key);
    setIsViewDialogOpen(true);
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredKeys.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredKeys.map((key) => key.id));
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

  const filteredKeys = apiKeys
    .filter((key) => {
      const matchesSearch =
        key.llmModelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.embeddingModelName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvider =
        filterProvider === "all" || key.provider === filterProvider;
      const matchesActive =
        filterActive === "all" ||
        (filterActive === "active" && key.active) ||
        (filterActive === "inactive" && !key.active);
      return matchesSearch && matchesProvider && matchesActive;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;

      let aValue: any = a;
      let bValue: any = b;

      if (sortBy === "provider") {
        aValue = a.provider || "";
        bValue = b.provider || "";
      } else if (sortBy === "llmModelName") {
        aValue = a.llmModelName || "";
        bValue = b.llmModelName || "";
      } else if (sortBy === "embeddingModelName") {
        aValue = a.embeddingModelName || "";
        bValue = b.embeddingModelName || "";
      } else if (sortBy === "vectorSize") {
        aValue = a.vectorSize || 0;
        bValue = b.vectorSize || 0;
      } else if (sortBy === "baseUrl") {
        aValue = a.baseUrl || "";
        bValue = b.baseUrl || "";
      } else if (sortBy === "used") {
        aValue = a.used || 0;
        bValue = b.used || 0;
      } else if (sortBy === "expiresAt") {
        aValue = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
        bValue = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
      } else if (sortBy === "active") {
        aValue = a.active ? 1 : 0;
        bValue = b.active ? 1 : 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const activeCount = apiKeys.filter((key) => key.active).length;
  const inactiveCount = apiKeys.length - activeCount;

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
                  API Keys Management
                </h2>
                <p className="text-muted-foreground">
                  Manage AI provider API keys for the application
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchApiKeys} variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingKey(null);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingKey ? "Edit API Key" : "Add New API Key"}
                      </DialogTitle>
                      <DialogDescription>
                        Configure AI provider API key settings
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Provider</Label>
                          <Select
                            value={formData.provider}
                            onValueChange={(value) =>
                              setFormData({ ...formData, provider: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AI_PROVIDERS.map((provider) => (
                                <SelectItem key={provider} value={provider}>
                                  {provider}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Vector Size</Label>
                          <Input
                            type="number"
                            value={formData.vectorSize}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                vectorSize: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>LLM Model Name</Label>
                        <Input
                          placeholder="e.g., gemini-1.5-flash, gpt-4"
                          value={formData.llmModelName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              llmModelName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Embedding Model Name</Label>
                        <Input
                          placeholder="e.g., text-embedding-004, text-embedding-3-small"
                          value={formData.embeddingModelName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              embeddingModelName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showApiKey ? "text" : "password"}
                            placeholder="Enter API key"
                            value={formData.apiKey}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                apiKey: e.target.value,
                              })
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Base URL (Optional)</Label>
                        <Input
                          placeholder="e.g., https://api.openai.com/v1"
                          value={formData.baseUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              baseUrl: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Usage Limit (0 = Unlimited)</Label>
                          <Input
                            type="number"
                            value={formData.limit}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                limit: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Expires At (Optional)</Label>
                          <Input
                            type="date"
                            value={formData.expiresAt}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                expiresAt: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">
                          {editingKey ? "Update" : "Create"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>API Key Details</DialogTitle>
                  <DialogDescription>
                    View detailed information about this API key
                  </DialogDescription>
                </DialogHeader>
                {viewingKey && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Provider</Label>
                        <p className="font-medium">{viewingKey.provider}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Status</Label>
                        <Badge variant={viewingKey.active ? "default" : "secondary"}>
                          {viewingKey.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">LLM Model</Label>
                        <p className="font-medium">{viewingKey.llmModelName || "—"}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Embedding Model</Label>
                        <p className="font-medium">{viewingKey.embeddingModelName || "—"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Vector Size</Label>
                        <p className="font-medium">{viewingKey.vectorSize || "—"}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Base URL</Label>
                        <p className="font-medium">{viewingKey.baseUrl || "—"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Usage</Label>
                        <p className="font-medium">
                          {viewingKey.used} / {viewingKey.limit === 0 ? "Unlimited" : viewingKey.limit}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Expires At</Label>
                        <p className="font-medium">
                          {viewingKey.expiresAt
                            ? new Date(viewingKey.expiresAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Created At</Label>
                      <p className="font-medium">
                        {new Date(viewingKey.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Updated At</Label>
                      <p className="font-medium">
                        {new Date(viewingKey.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Separator className="my-4" />
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-bl-full"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <KeyIcon className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">
                          Total
                        </CardTitle>
                        <p className="text-xs text-emerald-600/80 mt-0.5">
                          All API keys
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-emerald-900">
                      {apiKeys.length}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-medium">
                        Configured providers
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
                        <Check className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                          Active
                        </CardTitle>
                        <p className="text-xs text-blue-600/80 mt-0.5">
                          Currently in use
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-blue-900">
                      {activeCount}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-700 font-medium">
                        {((activeCount / apiKeys.length) * 100).toFixed(0)}% of total
                      </span>
                      <div className="flex items-center space-x-1 text-blue-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-bl-full"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <X className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
                          Inactive
                        </CardTitle>
                        <p className="text-xs text-amber-600/80 mt-0.5">
                          Disabled keys
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-amber-900">
                      {inactiveCount}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-700 font-medium">
                        {((inactiveCount / apiKeys.length) * 100).toFixed(0)}% of total
                      </span>
                      <div className="flex items-center space-x-1 text-amber-600">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
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
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by model name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select
                  value={filterProvider}
                  onValueChange={setFilterProvider}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {AI_PROVIDERS.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-full md:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
                          selectedItems.length === filteredKeys.length &&
                          filteredKeys.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("provider")}
                    >
                      <div className="flex items-center">
                        Provider
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("llmModelName")}
                    >
                      <div className="flex items-center">
                        LLM Model
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("embeddingModelName")}
                    >
                      <div className="flex items-center">
                        Embedding Model
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("vectorSize")}
                    >
                      <div className="flex items-center">
                        Vector Size
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("baseUrl")}
                    >
                      <div className="flex items-center">
                        Base URL
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("used")}
                    >
                      <div className="flex items-center">
                        Usage
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("expiresAt")}
                    >
                      <div className="flex items-center">
                        Expires At
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("active")}
                    >
                      <div className="flex items-center">
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center text-sm">
                        No API keys found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(key.id)}
                            onCheckedChange={() => handleSelectItem(key.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{key.provider}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {key.llmModelName || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {key.embeddingModelName || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {key.vectorSize || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {key.baseUrl || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {key.used} / {key.limit === 0 ? "Unlimited" : key.limit}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {key.expiresAt
                            ? new Date(key.expiresAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={key.active}
                            onCheckedChange={() => handleToggleActive(key.id, key.active)}
                          />
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
                              <DropdownMenuItem onClick={() => handleView(key)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(key)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(key.id)}
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

export default ApiKeysManagement;

import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/providers/auth-provider.tsx";
import { api } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  Download,
  Upload,
  FileText,
  RefreshCw,
  Newspaper,
} from "lucide-react";
import { toast } from "sonner";
import type { Document } from "@/lib/interface";

function AgrometBulletinManagement() {
  const { user, isLoading } = useAuth();
  const [bulletins, setBulletins] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bulletinToDelete, setBulletinToDelete] = useState<Document | null>(
    null,
  );
  const [formData, setFormData] = useState({
    title: "",
    author: "",
  });

  const fetchBulletins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const data = await api.get(
        "/document/documents?agromet_bulletin=true",
        token || undefined,
      );
      setBulletins(data.documents || []);
    } catch (error) {
      console.error("Error fetching bulletins:", error);
      toast.error("Failed to fetch bulletins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulletins();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a bulletin file");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!formData.author.trim()) {
      toast.error("Please enter an author");
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("file_urls", selectedFile);
    uploadData.append("title", formData.title);
    uploadData.append("author", formData.author);
    uploadData.append("article", "false");
    uploadData.append("agromet_bulletin", "true");

    try {
      const token = localStorage.getItem("token");
      await api.post("/document/documents", uploadData, token || undefined);

      toast.success("Agromet Bulletin uploaded successfully!");
      setSelectedFile(null);
      setFormData({
        title: "",
        author: "",
      });
      // Reset file input
      const fileInput = document.getElementById(
        "bulletin-file",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      fetchBulletins();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!bulletinToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(
        `/document/documents/${bulletinToDelete.id}`,
        token || undefined,
      );

      toast.success("Agromet Bulletin deleted successfully!");
      fetchBulletins();
    } catch (error) {
      console.error("Error deleting bulletin:", error);
      toast.error("Failed to delete bulletin");
    } finally {
      setBulletinToDelete(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Agromet Bulletin Management
            </h1>
            <p className="text-gray-600 mt-2">
              Upload and manage agromet bulletins for users
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New Agromet Bulletin
            </CardTitle>
            <CardDescription>
              Upload agromet bulletin files for users to read
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulletin-file">Bulletin File</Label>
              <Input
                id="bulletin-file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                className="cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Bulletin title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  placeholder="Bulletin author"
                  value={formData.author}
                  onChange={(e) => handleInputChange("author", e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload Bulletin"}
            </Button>
          </CardContent>
        </Card>

        {/* Bulletins List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5" />
                  Uploaded Agromet Bulletins
                </CardTitle>
                <CardDescription>
                  Manage your uploaded agromet bulletins
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  fetchBulletins();
                }}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {bulletins.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No bulletins uploaded
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload your first agromet bulletin to get started
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulletins.map((bulletin) => (
                      <TableRow key={bulletin.id}>
                        <TableCell className="font-medium">
                          {bulletin.title}
                        </TableCell>
                        <TableCell className="font-medium">
                          {bulletin.author}
                        </TableCell>
                        <TableCell>
                          {formatFileSize(bulletin.size || 0)}
                        </TableCell>
                        <TableCell>
                          {new Date(bulletin.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() =>
                                window.open(bulletin.file_urls[0], "_blank")
                              }
                              variant="outline"
                              size="sm"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Bulletin
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {bulletin.title}"? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      setBulletinToDelete(bulletin);
                                      confirmDelete();
                                    }}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete Bulletin
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResourceAgrometBulletinsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.user_type !== "ADMIN") {
    return <Navigate to="/auth/unauthorized" />;
  }

  return (
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
          <div className="@container/main flex flex-1 flex-col">
            <AgrometBulletinManagement />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default ResourceAgrometBulletinsPage;

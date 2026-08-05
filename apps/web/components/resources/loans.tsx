"use client"

import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
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
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import type { Document } from "@/lib/interface";

function LoanManagement() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<Document | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
  });

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const data = await api.get(
        "/document/documents?loan=true",
        token || undefined,
      );
      setLoans(data.documents || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to fetch loans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
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
      toast.error("Please select an loan file");
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
    uploadData.append("loan", "true");
    uploadData.append("agromet_bulletin", "false");

    try {
      const token = localStorage.getItem("token");
      await api.post("/document/documents", uploadData, token || undefined);

      toast.success("Loan uploaded successfully!");
      setSelectedFile(null);
      setFormData({
        title: "",
        author: "",
      });
      // Reset file input
      const fileInput = document.getElementById(
        "loan-file",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      fetchLoans();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!loanToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(
        `/document/documents/${loanToDelete.id}`,
        token || undefined,
      );

      toast.success("Loan deleted successfully!");
      fetchLoans();
    } catch (error) {
      console.error("Error deleting loan:", error);
      toast.error("Failed to delete loan");
    } finally {
      setLoanToDelete(null);
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
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Loan Management
            </h1>
            <p className="text-gray-600 mt-2">
              Upload and manage loans for users
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New Loan
            </CardTitle>
            <CardDescription>
              Upload loan files for users to read
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loan-file">Loan File</Label>
              <Input
                id="loanle"
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
                  placeholder="Loan title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  placeholder="Loan author"
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
              {uploading ? "Uploading..." : "Upload Loan"}
            </Button>
          </CardContent>
        </Card>

        {/* Loans List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Uploaded Loans
                </CardTitle>
                <CardDescription>Manage your uploaded loans</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  fetchLoans();
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
            {loans.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No loans uploaded
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload your first loan to get started
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
                    {loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">
                          {loan.title}
                        </TableCell>
                        <TableCell className="font-medium">
                          {loan.author}
                        </TableCell>
                        <TableCell>{formatFileSize(loan.size || 0)}</TableCell>
                        <TableCell>
                          {new Date(loan.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() =>
                                window.open(loan.file_urls[0], "_blank")
                              }
                              variant="outline"
                              size="sm"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger>
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
                                    Delete Loan
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {loan.title}
                                    "? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      setLoanToDelete(loan);
                                      confirmDelete();
                                    }}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete Loan
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

function ResourceLoansPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (user.user_type !== "ADMIN") {
    router.push("/auth/unauthorized");
    return null;
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
            <LoanManagement />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default ResourceLoansPage;

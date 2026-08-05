"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Upload,
} from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the Resource interface since it's not in the interface file
interface Resource {
  id: string;
  type: string;
  title: string;
  description?: string;
  author?: string;
  resource_url: string[];
  image_url?: string[];
  filename?: string;
  size?: number;
  version?: string;
  platform?: string;
  download_count?: number;
  is_active: boolean;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export default function SystemDocumentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentAuthor, setDocumentAuthor] = useState("");
  const [documentType, setDocumentType] = useState<
    "PRIVACY_POLICY" | "HELP_RESOURCE" | ""
  >("");

  // Check if user is authenticated and has admin privileges
  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.user_type !== "ADMIN" && user.user_type !== "SUPER_ADMIN")) {
        router.push("/auth/unauthorized");
      }
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user || (user.user_type !== "ADMIN" && user.user_type !== "SUPER_ADMIN")) {
    return null;
  }

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);

        // Fetch both resource types concurrently for better performance
        const [privacyResponse, helpResponse] = await Promise.all([
          api.get(
            "/resources/resources?type=PRIVACY_POLICY",
            localStorage.getItem("token") || "",
          ),
          api.get(
            "/resources/resources?type=HELP_RESOURCE",
            localStorage.getItem("token") || "",
          ),
        ]);

        // Combine both arrays
        let allResources: Resource[] = [];

        if (privacyResponse && privacyResponse.resources) {
          allResources = [
            ...allResources,
            ...(privacyResponse.resources as Resource[]),
          ];
        }

        if (helpResponse && helpResponse.resources) {
          allResources = [
            ...allResources,
            ...(helpResponse.resources as Resource[]),
          ];
        }

        setDocuments(allResources);
      } catch (error) {
        console.error("Error fetching resources:", error);
        toast.error("Failed to load resources");
        setDocuments([]); // Set empty array on error to prevent crashes
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Filter resources based on search term
  const filteredDocuments = useMemo(() => {
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.author &&
          doc.author.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [documents, searchTerm]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle resource upload
  const handleUpload = async () => {
    if (!selectedFile || !documentTitle || !documentAuthor || !documentType) {
      toast.error("Please fill in all fields and select a file and type");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("resource", selectedFile); // Changed to match the API expectation
      formData.append("type", documentType);
      formData.append("title", documentTitle);
      formData.append("author", documentAuthor);

      // Use the resource endpoint
      await api.post(
        "/resources/resources/",
        formData,
        localStorage.getItem("token") || "",
      );

      toast.success("Resource uploaded successfully");
      setIsDialogOpen(false);

      // Reset form
      setSelectedFile(null);
      setDocumentTitle("");
      setDocumentAuthor("");
      setDocumentType("");

      // Refresh resources list
      // Fetch both resource types concurrently for better performance
      const [updatedPrivacyResponse, updatedHelpResponse] = await Promise.all([
        api.get(
          "/resources/resources?type=PRIVACY_POLICY",
          localStorage.getItem("token") || "",
        ),
        api.get(
          "/resources/resources?type=HELP_RESOURCE",
          localStorage.getItem("token") || "",
        ),
      ]);

      // Combine both arrays
      let allResources: Resource[] = [];

      if (
        updatedPrivacyResponse.data &&
        updatedPrivacyResponse.data.resources
      ) {
        allResources = [
          ...allResources,
          ...(updatedPrivacyResponse.data.resources as Resource[]),
        ];
      }

      if (updatedHelpResponse.data && updatedHelpResponse.data.resources) {
        allResources = [
          ...allResources,
          ...(updatedHelpResponse.data.resources as Resource[]),
        ];
      }

      setDocuments(allResources);
    } catch (error) {
      console.error("Error uploading resource:", error);
      toast.error("Failed to upload resource");
    }
  };

  // Handle resource deletion
  const handleDelete = async (id: string) => {
    try {
      await api.delete(
        `/resources/resources/${id}`,
        localStorage.getItem("token") || "",
      );
      toast.success("Resource deleted successfully");

      // Refresh resources list
      // Fetch both resource types concurrently for better performance
      const [updatedPrivacyResponse, updatedHelpResponse] = await Promise.all([
        api.get(
          "/resources/resources?type=PRIVACY_POLICY",
          localStorage.getItem("token") || "",
        ),
        api.get(
          "/resources/resources?type=HELP_RESOURCE",
          localStorage.getItem("token") || "",
        ),
      ]);

      // Combine both arrays
      let allResources: Resource[] = [];

      if (
        updatedPrivacyResponse.data &&
        updatedPrivacyResponse.data.resources
      ) {
        allResources = [
          ...allResources,
          ...(updatedPrivacyResponse.data.resources as Resource[]),
        ];
      }

      if (updatedHelpResponse.data && updatedHelpResponse.data.resources) {
        allResources = [
          ...allResources,
          ...(updatedHelpResponse.data.resources as Resource[]),
        ];
      }

      setDocuments(allResources);
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  // Handle resource download
  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Define columns for the data table
  const columns = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: { row: any }) => (
        <Badge variant="secondary" className="capitalize">
          {row.getValue("type")}
        </Badge>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }: { row: any }) => (
        <div className="font-medium">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "author",
      header: "Author",
      cell: ({ row }: { row: any }) => (
        <div className="capitalize">{row.getValue("author") || "N/A"}</div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }: { row: any }) => (
        <div>{new Date(row.getValue("created_at")).toLocaleDateString()}</div>
      ),
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }: { row: any }) => (
        <div>
          {row.original.size
            ? `${(row.original.size / 1024).toFixed(2)} KB`
            : "N/A"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: any }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleDownload(
                row.original.resource_url[0],
                row.original.filename || row.original.title,
              )
            }
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // View resource logic (could open in a modal or new tab)
              window.open(row.original.resource_url[0], "_blank");
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="p-4 md:p-6">
          <Card className="w-full">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  System Resources Management
                </CardTitle>
                <CardDescription>
                  Manage system resources, policies, and help documents
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoading(true);
                    // Refresh resources
                    const fetchResources = async () => {
                      try {
                        // Fetch both resource types concurrently for better performance
                        const [privacyResponse, helpResponse] =
                          await Promise.all([
                            api.get(
                              "/resources/resources?type=PRIVACY_POLICY",
                              localStorage.getItem("token") || "",
                            ),
                            api.get(
                              "/resources/resources?type=HELP_RESOURCE",
                              localStorage.getItem("token") || "",
                            ),
                          ]);

                        // Combine both arrays
                        let allResources: Resource[] = [];

                        if (
                          privacyResponse.data &&
                          privacyResponse.data.resources
                        ) {
                          allResources = [
                            ...allResources,
                            ...(privacyResponse.data.resources as Resource[]),
                          ];
                        }

                        if (helpResponse.data && helpResponse.data.resources) {
                          allResources = [
                            ...allResources,
                            ...(helpResponse.data.resources as Resource[]),
                          ];
                        }

                        setDocuments(allResources);
                      } catch (error) {
                        console.error("Error fetching resources:", error);
                        toast.error("Failed to refresh resources");
                      } finally {
                        setLoading(false);
                      }
                    };

                    fetchResources();
                  }}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  <span className="ml-2 hidden sm:inline">Refresh</span>
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Upload New Resource</DialogTitle>
                      <DialogDescription>
                        Upload a new system resource to the management system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                          Type
                        </Label>
                        <Select
                          value={documentType}
                          onValueChange={(value) =>
                            setDocumentType(value as "PRIVACY_POLICY" | "HELP_RESOURCE")
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRIVACY_POLICY">
                              Privacy Policy
                            </SelectItem>
                            <SelectItem value="HELP_RESOURCE">
                              Help Resource
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="title"
                          value={documentTitle}
                          onChange={(e) => setDocumentTitle(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="author" className="text-right">
                          Author
                        </Label>
                        <Input
                          id="author"
                          value={documentAuthor}
                          onChange={(e) => setDocumentAuthor(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="file" className="text-right">
                          File
                        </Label>
                        <Input
                          id="file"
                          type="file"
                          onChange={handleFileChange}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleUpload}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Resource
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              <div className="border rounded-md">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      {columns.map((column, index) => (
                        <th
                          key={`header-${index}-${column.accessorKey as string}`}
                          className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                        >
                          {column.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((resource) => (
                        <tr
                          key={resource.id}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          {columns.map((column) => (
                            <td
                              key={`${resource.id}-${column.accessorKey as string}`}
                              className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                            >
                              {column.cell
                                ? column.cell({
                                    row: {
                                      getValue: (key: keyof Resource) =>
                                        resource[key],
                                      original: resource,
                                    },
                                  })
                                : resource[
                                    column.accessorKey as keyof Resource
                                  ]}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="h-24 text-center align-middle"
                        >
                          No resources found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

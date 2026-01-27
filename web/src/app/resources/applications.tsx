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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Trash2, Download, Upload, CheckCircle, RefreshCw } from "lucide-react";
import {
  IconBrandApple,
  IconBrandWindows,
  IconBrandAndroid,
  IconBrandUbuntu,
} from "@tabler/icons-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getUserById } from "@/lib/utils";
import type { Application } from "@/lib/interface";

function ApplicationManagement() {
  const { user, isLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const [togglingActive, setTogglingActive] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    version: "",
    platform: "android",
  });

  const platforms = [
    {
      value: "android",
      label: "Android",
      icon: <IconBrandAndroid className="w-4 h-4" />,
    },
    {
      value: "ios",
      label: "iOS",
      icon: <IconBrandApple className="w-4 h-4" />,
    },
    {
      value: "windows",
      label: "Windows",
      icon: <IconBrandWindows className="w-4 h-4" />,
    },
    {
      value: "macos",
      label: "macOS",
      icon: <IconBrandApple className="w-4 h-4" />,
    },
    {
      value: "linux",
      label: "Linux",
      icon: <IconBrandUbuntu className="w-4 h-4" />,
    },
  ];

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const data = await api.get(
        "/resources/resources?type=APPLICATION",
        token || undefined
      );
      setApplications(data.resources || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const AuthorDisplay = ({ authorId }: { authorId: string }) => {
    const [name, setName] = useState("...");

    useEffect(() => {
      const fetchName = async () => {
        try {
          const response = await getUserById(authorId);
          const userData = response.data || response;
          setName(userData.name || "Unknown");
        } catch (error) {
          console.error("Error fetching author:", error);
          setName("Unknown");
        }
      };
      if (authorId) fetchName();
    }, [authorId]);

    return <span>{name}</span>;
  };

  useEffect(() => {
    fetchApplications();
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
      toast.error("Please select an application file");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("resource", selectedFile);
    uploadData.append("title", formData.title);
    uploadData.append("description", formData.description);
    if (user?.id) {
      uploadData.append("author", user.id);
    } else {
      uploadData.append("author", ""); // or some default value if needed
    }
    uploadData.append("version", formData.version || "1.0.0");
    uploadData.append("platform", formData.platform);
    uploadData.append("type", "APPLICATION");

    try {
      const token = localStorage.getItem("token");
      await api.post("/resources/resources/", uploadData, token || undefined);

      toast.success("Application uploaded successfully!");
      setSelectedFile(null);
      setFormData({
        title: "",
        description: "",
        version: "",
        platform: "android",
      });
      // Reset file input
      const fileInput = document.getElementById(
        "application-file"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      fetchApplications();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (appId: string) => {
    setTogglingActive(appId);
    try {
      const formData = new FormData();

      const app = applications.find((a) => a.id === appId);
      if (app?.author && app?.is_active == false) {
        formData.append("is_active", "true");
        formData.append("author", app.author);
      } else if (app?.author && app?.is_active == true) {
        formData.append("is_active", "false");
        formData.append("author", app.author);
      }

      const token = localStorage.getItem("token");
      await api.put(
        `/resources/resources/${appId}`,
        formData,
        token || undefined
      );

      toast.success("Active application updated successfully!");
      fetchApplications();
    } catch (error) {
      console.error("Error setting active application:", error);
      toast.error("Failed to set active application");
    } finally {
      setTogglingActive(null);
    }
  };

  const confirmDelete = async () => {
    if (!appToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(
        `/resources/resources/${appToDelete.id}`,
        token || undefined,
        { author: appToDelete.author }
      );

      toast.success("Application deleted successfully!");
      fetchApplications();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    } finally {
      setAppToDelete(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getPlatformIcon = (platform: string) => {
    const platformData = platforms.find((p) => p.value === platform);
    return platformData?.icon || <IconBrandAndroid className="w-4 h-4" />;
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "android":
        return "bg-green-100 text-green-800";
      case "ios":
        return "bg-blue-100 text-blue-800";
      case "windows":
        return "bg-indigo-100 text-indigo-800";
      case "macos":
        return "bg-gray-100 text-gray-800";
      case "linux":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Header */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Applications Management
            </h1>
            <p className="text-muted-foreground">
              Upload and manage applications for users to download
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New Application
            </CardTitle>
            <CardDescription>
              Upload application files for users to download from the homepage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="application-file">Application File</Label>
                <Input
                  id="application-file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".apk,.ipa,.exe,.dmg,.deb,.rpm,.zip"
                  className="cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) =>
                    handleInputChange("platform", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        <div className="flex items-center gap-2">
                          {platform.icon}
                          {platform.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Application title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  placeholder="1.0.0"
                  value={formData.version}
                  onChange={(e) => handleInputChange("version", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Application description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload Application"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Applications</CardTitle>
            <CardDescription>
              Manage your uploaded applications and set which ones are active
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No applications uploaded yet
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className={`p-4 border rounded-lg ${
                      app.is_active
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{app.title}</h3>
                          {app.is_active && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                          <Badge className={getPlatformColor(app.platform)}>
                            <span className="flex items-center gap-1">
                              {getPlatformIcon(app.platform)}
                              {app.platform}
                            </span>
                          </Badge>
                        </div>
                        {app.description && (
                          <p className="text-muted-foreground mb-2">
                            {app.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Version: {app.version}</span>
                          <span>Size: {formatFileSize(app.size)}</span>
                          <span>Downloads: {app.download_count}</span>
                          <span>
                            Uploaded:{" "}
                            {new Date(app.uploaded_at).toLocaleDateString()}
                          </span>
                          <span>
                            Author: <AuthorDisplay authorId={app.author} />
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {app.is_active ? (
                          <Button
                            onClick={() => handleSetActive(app.id)}
                            variant="outline"
                            size="sm"
                            disabled={togglingActive === app.id}
                          >
                            {togglingActive === app.id ? (
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            Active
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleSetActive(app.id)}
                            variant="outline"
                            size="sm"
                            disabled={togglingActive === app.id}
                          >
                            {togglingActive === app.id ? (
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            ) : null}
                            Set Active
                          </Button>
                        )}
                        <Button
                          onClick={() =>
                            window.open(app.resource_url[0], "_blank")
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
                                Delete Application
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{app.title}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  setAppToDelete(app);
                                  confirmDelete();
                                }}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete Application
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResourceApplicationsPage() {
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
            <ApplicationManagement />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default ResourceApplicationsPage;

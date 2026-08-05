"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  Upload,
  Video,
  Play,
  Trash2,
  CheckCircle,
  FileVideo,
  Eye,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserById } from "@/lib/utils";
import type { VideoData } from "@/lib/interface";

function VideoManagement() {
  const { user } = useAuth(); // Use auth context for user token
  const router = useRouter();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoData | null>(null);
  const [togglingActive, setTogglingActive] = useState<string | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    video: null as File | null,
  });

  const fetchVideos = async () => {
    try {
      const data = await api.get("/resources/resources?type=VIDEO");
      setVideos(data.resources || []);

      // Find and set active video
      const active = data.resources?.find(
        (video: VideoData) => video.is_active
      );
      setActiveVideo(active || null);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Error fetching videos");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.video) {
      toast.error("Please select a video file");
      return;
    }

    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (uploadForm.video.size > MAX_FILE_SIZE) {
      toast.error("Video file size must be less than 100MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("resource", uploadForm.video);
    formData.append("title", uploadForm.title);
    if (user?.id) {
      formData.append("author", user.id);
    } else {
      formData.append("author", ""); // or some default value if needed
    }
    formData.append("description", uploadForm.description);
    formData.append("type", "VIDEO");

    try {
      const token = localStorage.getItem("token");
      await api.post("/resources/resources/", formData, token || undefined);

      toast.success("Video uploaded successfully!");
      setIsUploadModalOpen(false);
      setUploadForm({ title: "", description: "", video: null });
      fetchVideos(); // Refresh videos list
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Error uploading video");
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (videoId: string) => {
    setTogglingActive(videoId);
    try {
      const formData = new FormData();

      const video = videos.find((v) => v.id === videoId);
      if (video?.author && video?.is_active == false) {
        formData.append("is_active", "true");
        formData.append("author", video.author);
      } else if (video?.author && video?.is_active == true) {
        formData.append("is_active", "false");
        formData.append("author", video.author);
      }

      const token = localStorage.getItem("token");
      await api.put(
        `/resources/resources/${videoId}`,
        formData,
        token || undefined
      );

      toast.success("Active video updated successfully!");
      fetchVideos(); // Refresh videos list
    } catch (error) {
      console.error("Error setting active video:", error);
      toast.error("Error setting active video");
    } finally {
      setTogglingActive(null);
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;

    try {
      const token = localStorage.getItem("token");
      // Pass author in body for ownership check
      await api.delete(
        `/resources/resources/${videoToDelete.id}`,
        token || undefined,
        { author: videoToDelete.author }
      );

      toast.success("Video deleted successfully!");
      setIsDeleteDialogOpen(false);
      setVideoToDelete(null);
      fetchVideos(); // Refresh videos list
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Error deleting video");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Video Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage promotional videos for your website
            </p>
          </div>

          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger>
              <Button className="bg-green-600 hover:bg-green-700">
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleVideoUpload}>
                <DialogHeader>
                  <DialogTitle>Upload New Video</DialogTitle>
                  <DialogDescription>
                    Upload a promotional video for the website
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-title">Title</Label>
                    <Input
                      id="video-title"
                      value={uploadForm.title}
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter video title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video-description">Description</Label>
                    <Input
                      id="video-description"
                      value={uploadForm.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter video description (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video-file">Video File</Label>
                    <Input
                      id="video-file"
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setUploadForm((prev) => ({
                          ...prev,
                          video: file || null,
                        }));
                      }}
                      required
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUploadModalOpen(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Video Section */}
        {activeVideo && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">
                    Currently Active Video
                  </CardTitle>
                </div>
                <Badge className="bg-green-600 text-white">LIVE</Badge>
              </div>
              <CardDescription className="text-green-700">
                This video is currently displayed on the website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <video
                    className="w-full rounded-lg border shadow-sm"
                    controls
                    preload="metadata"
                  >
                    <source
                      src={`${activeVideo.resource_url[0]}`}
                      type="video/mp4"
                    />
                  </video>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-green-800">
                    {activeVideo.title}
                  </h3>
                  {activeVideo.description && (
                    <p className="text-green-700">{activeVideo.description}</p>
                  )}
                  <div className="space-y-1 text-sm text-green-600">
                    <p>
                      <strong>Size:</strong> {formatFileSize(activeVideo.size)}
                    </p>
                    <p>
                      <strong>Uploaded:</strong>{" "}
                      {formatDate(activeVideo.uploaded_at)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Videos Grid */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Video className="h-5 w-5" />
                    <span>All Videos ({videos.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your promotional videos
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoading(true);
                    fetchVideos();
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
              {videos.length === 0 ? (
                <div className="text-center py-12">
                  <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No videos uploaded
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Upload your first promotional video to get started
                  </p>
                  <Button onClick={() => setIsUploadModalOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Video
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <Card
                      key={video.id}
                      className={`relative ${video.is_active ? "ring-2 ring-green-500" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="relative">
                            <video
                              className="w-full aspect-video rounded-lg bg-gray-100"
                              preload="metadata"
                              controls
                            >
                              <source
                                src={`${video.resource_url[0]}`}
                                type="video/mp4"
                              />
                            </video>
                            {video.is_active && (
                              <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                                ACTIVE
                              </Badge>
                            )}
                          </div>

                          <div>
                            <h3 className="font-medium text-gray-900 truncate">
                              {video.title}
                            </h3>
                            {video.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                {video.description}
                              </p>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 space-y-1">
                            <p>Size: {formatFileSize(video.size)}</p>
                            <p>Uploaded: {formatDate(video.uploaded_at)}</p>
                            <p>
                              Author: <AuthorDisplay authorId={video.author} />
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            {video.is_active ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSetActive(video.id)}
                                disabled={togglingActive === video.id}
                              >
                                {togglingActive === video.id ? (
                                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                )}
                                Active
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleSetActive(video.id)}
                                disabled={togglingActive === video.id}
                              >
                                {togglingActive === video.id ? (
                                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Play className="mr-1 h-3 w-3" />
                                )}
                                Set Active
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(
                                      `${video.resource_url[0]}`,
                                      "_blank"
                                    )
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setVideoToDelete(video);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this video? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteVideo}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function ResourceVideosPage() {
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
            <VideoManagement />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default ResourceVideosPage;

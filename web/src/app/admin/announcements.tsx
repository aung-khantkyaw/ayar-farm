import { useEffect, useMemo, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import {
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import LoadingSpinner from "@/components/LoadingSpinner.tsx";
import { api } from "@/lib/api";
import { AdminProvider, useAdmin } from "@/providers/admin-provider";
import { useAuth } from "@/providers/auth-provider.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type AnnouncementRecord = {
  id: string;
  title: string;
  message: string;
  type: "INFORMATION" | "WARNING" | "BREAKING_NEWS";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const LOCATION_FILTER_DEFAULT = "";

const AnnouncementManagement = () => {
  const { users, isLoading: usersLoading, refreshUsers } = useAdmin();
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementRecord | null>(
    null,
  );
  const [editing, setEditing] = useState<AnnouncementRecord | null>(null);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "INFORMATION" as AnnouncementRecord["type"],
    isActive: true,
  });

  const [userSearch, setUserSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState(LOCATION_FILTER_DEFAULT);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Filters for announcement list
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const locationTokens = useMemo(
    () =>
      locationFilter
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    [locationFilter],
  );

  const filteredUsers = useMemo(() => {
    const searchLower = userSearch.toLowerCase();
    return users.filter((user) => {
      const locationText = (user.location || "").toLowerCase();
      const matchesLocation =
        locationTokens.length === 0 ||
        locationTokens.some((token) =>
          locationText.includes(token.toLowerCase()),
        );

      const matchesSearch =
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone_number?.includes(userSearch);

      return (
        (locationTokens.length === 0 || matchesLocation) &&
        (userSearch ? matchesSearch : true)
      );
    });
  }, [users, userSearch, locationTokens]);

  const resetForm = () => {
    setForm({ title: "", message: "", type: "INFORMATION", isActive: true });
    setSelectedUserIds([]);
    setEditing(null);
  };

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || undefined;
      // Fetch all announcements (active and inactive) for admin management
      const response = await api.get("/announcements?active=all", token);
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error("Failed to load announcements", error);
      toast.error("Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const typeOk = typeFilter === "all" || a.type === typeFilter;
      const statusOk =
        statusFilter === "all" ||
        (statusFilter === "active" ? a.isActive : !a.isActive);
      return typeOk && statusOk;
    });
  }, [announcements, typeFilter, statusFilter]);

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id)
        ? prev.filter((userId) => userId !== id)
        : [...prev, id],
    );
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (announcement: AnnouncementRecord) => {
    setEditing(announcement);
    setForm({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      isActive: announcement.isActive,
    });
    setSelectedUserIds([]);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    if (!editing && selectedUserIds.length === 0) {
      toast.error("Select at least one user to announce");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token") || undefined;

      if (editing) {
        await api.patch(
          `/announcements/${editing.id}`,
          {
            title: form.title,
            message: form.message,
            type: form.type,
            isActive: form.isActive,
          },
          token,
        );
        toast.success("Announcement updated");
      } else {
        await api.post(
          "/announcements",
          {
            title: form.title,
            message: form.message,
            type: form.type,
            userIds: selectedUserIds,
          },
          token,
        );
        toast.success("Announcement created");
      }

      // Wait for announcements to be fetched before closing dialog and resetting form
      await fetchAnnouncements();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Save failed", error);
      toast.error("Failed to save announcement");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const token = localStorage.getItem("token") || undefined;
      await api.delete(`/announcements/${deleteTarget.id}`, token);
      toast.success("Announcement deleted");
      // Wait for announcements to be fetched before closing dialog
      await fetchAnnouncements();
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete announcement");
    } finally {
      setDeleteTarget(null);
    }
  };

  const renderTypeBadge = (type: AnnouncementRecord["type"]) => {
    const map = {
      INFORMATION: "bg-blue-100 text-blue-800",
      WARNING: "bg-amber-100 text-amber-800",
      BREAKING_NEWS: "bg-red-100 text-red-800",
    } as const;
    return <Badge className={map[type]}>{type.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-muted-foreground">
              Create and manage announcements for selected users
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Admin can filter and choose users by location
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Create announcement</CardTitle>
            <CardDescription>
              Choose recipients by address and compose the announcement
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refreshUsers()}
              disabled={usersLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${usersLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  New announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Edit announcement" : "Create announcement"}
                  </DialogTitle>
                  <DialogDescription>
                    {editing
                      ? "Update the message, type, or active state. Recipients stay unchanged."
                      : "Pick recipients filtered by address and send your message."}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="announcement-title">Title</Label>
                    <Input
                      id="announcement-title"
                      value={form.title}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Enter announcement title"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="announcement-message">Message</Label>
                    <Textarea
                      id="announcement-message"
                      value={form.message}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      placeholder="Write the announcement content"
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Select
                        value={form.type}
                        onValueChange={(value: AnnouncementRecord["type"]) =>
                          setForm((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INFORMATION">
                            Information
                          </SelectItem>
                          <SelectItem value="WARNING">Warning</SelectItem>
                          <SelectItem value="BREAKING_NEWS">
                            Breaking news
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Active</Label>
                      <Select
                        value={form.isActive ? "true" : "false"}
                        onValueChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            isActive: value === "true",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {!editing && (
                    <div className="grid gap-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="user-search">Search users</Label>
                          <Input
                            id="user-search"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Search by name, email, or phone"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="location-filter">
                            Location filter
                          </Label>
                          <Input
                            id="location-filter"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            placeholder="e.g. မအူပင်, ဧရာ၀တီ"
                          />
                        </div>
                      </div>

                      <div className="rounded-md border bg-muted/20 p-3">
                        <div className="flex items-center justify-between pb-2 gap-2 flex-wrap">
                          <div className="text-sm text-muted-foreground">
                            Select recipients ({selectedUserIds.length} chosen)
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSelectedUserIds(
                                  filteredUsers.map((u) => u.id),
                                )
                              }
                              disabled={
                                filteredUsers.length === 0 ||
                                selectedUserIds.length === filteredUsers.length
                              }
                            >
                              Check all
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUserIds([])}
                              disabled={selectedUserIds.length === 0}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                          {filteredUsers.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No users match the location filter.
                            </p>
                          )}
                          {filteredUsers.map((user) => {
                            const checked = selectedUserIds.includes(user.id);
                            return (
                              <label
                                key={user.id}
                                className="flex items-start gap-3 rounded-md border bg-background p-2 hover:bg-muted cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  className="mt-1"
                                  checked={checked}
                                  onChange={() => toggleUser(user.id)}
                                />
                                <div className="flex flex-col text-sm">
                                  <span className="font-medium">
                                    {user.name}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {user.email || "No email"}
                                  </span>
                                  {user.location && (
                                    <span className="text-muted-foreground">
                                      {user.location}
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? "Saving..." : editing ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              Location filter tokens:{" "}
              {locationTokens.length > 0 ? locationTokens.join(", ") : "none"}
            </span>
            <span className="text-muted-foreground">|</span>
            <span>Users loaded: {users.length}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col gap-1">
            <CardTitle>All announcements</CardTitle>
            <CardDescription>
              Manage active and inactive announcements
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INFORMATION">Information</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="BREAKING_NEWS">Breaking news</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnnouncements}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-lg font-semibold">No announcements found</p>
                <p className="text-muted-foreground">
                  Try changing the filters or create a new announcement.
                </p>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create announcement
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3">Title</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Created</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAnnouncements.map((announcement) => (
                    <tr key={announcement.id} className="hover:bg-muted/40">
                      <td className="py-3">
                        <div className="font-medium">{announcement.title}</div>
                        <div className="text-muted-foreground line-clamp-2">
                          {announcement.message}
                        </div>
                      </td>
                      <td className="py-3">
                        {renderTypeBadge(announcement.type)}
                      </td>
                      <td className="py-3">
                        {announcement.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(announcement.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(announcement)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setDeleteTarget(announcement)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will remove the announcement
              permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function AdminAnnouncementsPage() {
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
    <AdminProvider>
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
              <AnnouncementManagement />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminProvider>
  );
}

export default AdminAnnouncementsPage;

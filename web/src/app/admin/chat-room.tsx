import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconMessage,
  IconUsers,
  IconSearch,
  IconFilter,
  IconSend,
  IconWifi,
  IconWifiOff,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { API_URL } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { useSocket } from "@/providers/socket-provider";
import { api } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Navigate } from "@tanstack/react-router";
import AdminProvider from "@/providers/admin-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import type {
  ChatGroup,
  ChatMessage,
  CreateGroupForm,
  User,
} from "@/lib/interface";

export function ChatRoomManagement() {
  const { user, session } = useAuth();
  const {
    socket,
    isConnected,
    joinGroup,
    leaveGroup,
    sendMessage: sendSocketMessage,
    deleteMessage: deleteSocketMessage,
    sendTyping,
    onNewMessage,
    onMessageDeleted,
    onUserTyping,
  } = useSocket();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    imageFile: null as File | null,
  });
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    imageFile: null as File | null,
  });
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [moderatorDialogOpen, setModeratorDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const withLoading = async (
    name: string,
    fn: () => Promise<any> | any
  ): Promise<void> => {
    try {
      setActionLoading(name);
      await fn();
    } finally {
      setActionLoading(null);
    }
  };

  const API_BASE_URL = API_URL;

  const getToken = () => localStorage.getItem("token") || undefined;

  // Fetch chat groups
  const fetchGroups = async () => {
    console.log("Fetching groups with user:", user);
    try {
      const token = getToken();
      const result = await api.get("/chat/conversations", token);
      console.log("Groups fetch result:", result);
      console.log("Groups data:", result.data);
      setGroups(result.data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to fetch chat groups");
    } finally {
      setLoading(false);
    }
  };

  // Create new group
  const createGroup = async () => {
    try {
      const formData = new FormData();
      formData.append("name", createForm.name);
      formData.append("description", createForm.description);
      formData.append("participantIds", JSON.stringify(selectedParticipants));

      if (createForm.imageFile) {
        formData.append("file", createForm.imageFile);
      }

      const token = getToken();
      const result = await api.post(
        "/chat/conversations/group",
        formData,
        token
      );
      console.log("Create group result:", result);
      toast.success("Chat group created successfully");
      setCreateDialogOpen(false);
      setCreateForm({
        name: "",
        description: "",
        imageFile: null,
      });
      setSelectedParticipants([]);
      fetchGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create chat group");
    }
  };

  // Update group
  const updateGroup = async () => {
    if (!selectedGroup) return;

    try {
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("description", editForm.description);

      if (editForm.imageFile) {
        formData.append("file", editForm.imageFile!);
      }

      const token = getToken();
      await api.put(
        `/chat/conversations/${selectedGroup!.id}`,
        formData,
        token
      );
      toast.success("Chat group updated successfully");
      setEditDialogOpen(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update chat group");
    }
  };

  // Confirm delete group
  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      const token = getToken();
      await api.delete(`/chat/conversations/${groupToDelete}`, token);
      toast.success("Chat group deleted successfully");
      fetchGroups();

      // Reset state
      setGroupToDelete(null);

      // Close chat dialog if we're deleting the currently selected group
      if (selectedGroup?.id === groupToDelete) {
        setChatDialogOpen(false);
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete chat group");
    }
  };

  // Fetch messages for a group
  const fetchMessages = async (groupId: string) => {
    console.log("Fetching messages for group:", groupId);
    setMessagesLoading(true);
    try {
      const token = getToken();
      const result = await api.get(
        `/chat/conversations/${groupId}/messages?page=1&limit=50`,
        token
      );
      console.log("Fetched messages:", result);
      setMessages(result.data?.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  // Join group (become member)
  const joinGroupMembership = async (groupId: string) => {
    try {
      const token = getToken();
      const result = await api.post(
        `/chat/conversations/${groupId}/participants`,
        {},
        token
      );
      console.log("Join group result:", result);
      toast.success(`Successfully joined ${result.data.group.name}`);
      // Refresh groups to update membership status
      fetchGroups();
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error(
        `Failed to join group: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  // Fetch available users for adding as moderators
  const fetchAvailableUsers = async () => {
    try {
      const token = getToken();
      const result = await api.get(`/users`, token);
      setAvailableUsers(result.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  // Add moderator to group
  const addModerator = async () => {
    if (!selectedGroup || !selectedUserId) return;

    try {
      const token = getToken();
      await api.post(
        `/chat/groups/${selectedGroup.id}/moderators`,
        { userId: selectedUserId },
        token
      );
      toast.success("Moderator added successfully");
      setSelectedUserId("");
      fetchGroups();
    } catch (error) {
      console.error("Error adding moderator:", error);
      toast.error("Failed to add moderator");
    }
  };

  // Remove moderator from group
  const removeModerator = async (moderatorId: string) => {
    if (!selectedGroup) return;

    try {
      const token = getToken();
      await api.delete(
        `/chat/groups/${selectedGroup.id}/moderators/${moderatorId}`,
        token
      );
      toast.success("Moderator removed successfully");
      fetchGroups();
    } catch (error) {
      console.error("Error removing moderator:", error);
      toast.error("Failed to remove moderator");
    }
  };

  // Leave group (remove membership)
  const leaveGroupMembership = async (groupId: string) => {
    try {
      const token = getToken();
      const result = await api.post(
        `/chat/conversations/${groupId}/leave`,
        {},
        token
      );
      console.log("Leave group result:", result);
      toast.success("Successfully left the group");
      // Refresh groups to update membership status
      fetchGroups();
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error(
        `Failed to leave group: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  // Handle typing indicator
  const handleTyping = (isCurrentlyTyping: boolean) => {
    if (!selectedGroup) return;

    if (isCurrentlyTyping !== isTyping) {
      setIsTyping(isCurrentlyTyping);
      sendTyping(selectedGroup.id, isCurrentlyTyping);
    }
  };

  // Delete message function
  const deleteMessage = async (messageId: string) => {
    try {
      // Try real-time first, fallback to HTTP
      if (socket && isConnected) {
        deleteSocketMessage(messageId);
        toast.success("Message deleted");
      } else {
        // HTTP fallback
        const token = getToken();
        await api.delete(`/chat/messages/${messageId}`, token);
        toast.success("Message deleted");
        // Refresh messages to show the change
        if (selectedGroup) {
          fetchMessages(selectedGroup.id);
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error(
        `Failed to delete message: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  // Send message (with real-time support)
  const sendMessage = async () => {
    if (!selectedGroup || !newMessage.trim()) {
      console.log("Cannot send message: missing group or empty message");
      return;
    }

    console.log("Attempting to send message:", {
      groupId: selectedGroup.id,
      message: newMessage.trim(),
      socketConnected: isConnected,
      hasSocket: !!socket,
    });

    // Stop typing indicator
    handleTyping(false);

    // Try real-time first, fallback to HTTP
    if (socket && isConnected) {
      try {
        sendSocketMessage(selectedGroup.id, newMessage.trim(), "text");
        setNewMessage("");
        toast.success("Message sent via Socket");
        return;
      } catch (error) {
        console.error("Socket message failed, falling back to HTTP:", error);
      }
    }

    // HTTP fallback
    try {
      try {
        console.log(
          "Sending message via HTTP to:",
          `${API_BASE_URL}/chat/conversations/${selectedGroup.id}/messages`
        );
        const token = getToken();
        const result = await api.post(
          `/chat/conversations/${selectedGroup.id}/messages`,
          { content: newMessage.trim() },
          token
        );
        console.log("Message sent successfully:", result);
        setNewMessage("");
        fetchMessages(selectedGroup.id);
        toast.success("Message sent successfully");
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error(
          `Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(
        `Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  useEffect(() => {
    console.log("ChatRoomManagement - User:", user);
    console.log("ChatRoomManagement - Socket connected:", isConnected);
    fetchGroups();

    const cleanupFunctions: (() => void)[] = [];

    // Set up real-time message listening
    if (onNewMessage) {
      const cleanup = onNewMessage((message: ChatMessage) => {
        console.log("Received new message:", message);
        // Update messages if the new message is for the currently selected group
        if (selectedGroup && message.groupId === selectedGroup.id) {
          setMessages((prev) => [...prev, message]);
        }

        // Show toast notification for new messages
        toast.info(`New message in ${message.groupName || "group"}`, {
          description: `${message.user.name}: ${message.content.slice(0, 50)}${message.content.length > 50 ? "..." : ""}`,
        });
      });
      if (cleanup && typeof cleanup === "function")
        cleanupFunctions.push(cleanup);
    }

    // Set up message deletion listening
    if (onMessageDeleted) {
      const cleanup = onMessageDeleted((data) => {
        console.log("Message deleted:", data);
        // Remove message if it's for the currently selected group
        if (selectedGroup && data.groupId === selectedGroup.id) {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== data.messageId)
          );
        }
        toast.info("A message was deleted");
      });
      if (cleanup && typeof cleanup === "function")
        cleanupFunctions.push(cleanup);
    }

    // Set up typing indicator listening
    if (onUserTyping) {
      const cleanup = onUserTyping((data) => {
        console.log("User typing:", data);
        if (
          selectedGroup &&
          data.groupId === selectedGroup.id &&
          data.user.id !== user?.id
        ) {
          if (data.isTyping) {
            setTypingUsers((prev) => new Set(prev).add(data.user.name));
          } else {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.user.name);
              return newSet;
            });
          }
        }
      });
      if (cleanup && typeof cleanup === "function")
        cleanupFunctions.push(cleanup);
    }

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [
    selectedGroup,
    onNewMessage,
    onMessageDeleted,
    onUserTyping,
    user,
    isConnected,
  ]);

  const filteredGroups = groups.filter((group) => {
    const name = (group.name ?? "").toLowerCase();
    const description = (group.description ?? "").toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = name.includes(term) || description.includes(term);

    // Determine whether this conversation represents a group.
    const isGroupFlag = Boolean(
      (group as any).isGroup ??
        (group as any).is_group ??
        (group as any).is_group_chat
    );
    const hasModerators =
      Array.isArray(group.moderators) && group.moderators.length > 0;
    const hasMembersCount = !!(
      group._count && typeof group._count.members === "number"
    );
    const typeIndicatesGroup =
      typeof group.type === "string" && group.type.toLowerCase() !== "direct";

    const isGroup =
      isGroupFlag || hasModerators || hasMembersCount || typeIndicatesGroup;

    return matchesSearch && isGroup;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "CROPS":
        return "bg-green-100 text-green-800";
      case "LIVESTOCK":
        return "bg-brown-100 text-brown-800";
      case "FISHERIES":
        return "bg-blue-100 text-blue-800";
      case "MACHINE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const { isLoading } = useAuth();

  if (isLoading || loading) {
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
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Chat Room Management
                    </h1>
                    <div className="flex flex-col lg:flex-row item-start lg:items-center gap-4 mt-1">
                      <p className="text-gray-600">
                        Manage chat groups and conversations
                      </p>
                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <>
                            <IconWifi size={16} className="text-green-500" />
                            <span className="text-sm text-green-600">
                              Connected
                            </span>
                          </>
                        ) : (
                          <>
                            <IconWifiOff size={16} className="text-red-500" />
                            <span className="text-sm text-red-600">
                              Disconnected
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {groups.length} groups loaded
                      </div>
                    </div>
                  </div>

                  <Dialog
                    open={createDialogOpen}
                    onOpenChange={(open) => {
                      setCreateDialogOpen(open);
                      if (open) fetchAvailableUsers();
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <IconPlus size={16} />
                        Create Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create New Chat Group</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Group Name</Label>
                          <Input
                            id="name"
                            value={createForm.name}
                            onChange={(e) =>
                              setCreateForm({
                                ...createForm,
                                name: e.target.value,
                              })
                            }
                            placeholder="Enter group name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={createForm.description}
                            onChange={(e) =>
                              setCreateForm({
                                ...createForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Enter group description"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imageFile">
                            Group Image (Optional)
                          </Label>
                          <Input
                            id="imageFile"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setCreateForm({ ...createForm, imageFile: file });
                            }}
                            className="cursor-pointer"
                          />
                          {createForm.imageFile && (
                            <p className="text-sm text-muted-foreground">
                              Selected: {createForm.imageFile.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Add Participants (Optional)</Label>
                          <Select
                            onValueChange={(value) => {
                              if (!selectedParticipants.includes(value)) {
                                setSelectedParticipants([
                                  ...selectedParticipants,
                                  value,
                                ]);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select users" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableUsers
                                .filter(
                                  (u) => !selectedParticipants.includes(u.id)
                                )
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name} ({user.user_type})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {selectedParticipants.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedParticipants.map((userId) => {
                                const user = availableUsers.find(
                                  (u) => u.id === userId
                                );
                                return (
                                  <Badge
                                    key={userId}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {user?.name}
                                    <button
                                      onClick={() =>
                                        setSelectedParticipants(
                                          selectedParticipants.filter(
                                            (id) => id !== userId
                                          )
                                        )
                                      }
                                      className="ml-1 hover:text-red-600"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => withLoading("create", createGroup)}
                            disabled={
                              !createForm.name.trim() || actionLoading !== null
                            }
                          >
                            {actionLoading === "create" && (
                              <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            )}
                            Create Group
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Search */}
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <IconSearch
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      placeholder="Search groups..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map((group) => (
                    <Card
                      key={group.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={
                                  group.imageUrl ||
                                  group.owner?.profilePicture ||
                                  ""
                                }
                              />
                              <AvatarFallback>
                                {(group.name?.charAt(0) ?? "").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">
                                {group.name}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  className={getTypeColor(group.type)}
                                  variant="secondary"
                                >
                                  {group.type}
                                </Badge>
                                {group.ownerId === user?.id && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-100 text-blue-800"
                                  >
                                    Owner
                                  </Badge>
                                )}
                                {group.isMember &&
                                  group.ownerId !== user?.id && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-100 text-green-800"
                                    >
                                      Member
                                    </Badge>
                                  )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {group.ownerId === user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setModeratorDialogOpen(true);
                                  fetchAvailableUsers();
                                }}
                                title="Manage Moderators"
                              >
                                <IconUsers size={16} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedGroup(group);
                                setEditForm({
                                  name: group.name,
                                  description: group.description || "",
                                  imageFile: null,
                                });
                                setEditDialogOpen(true);
                              }}
                            >
                              <IconEdit size={16} />
                            </Button>
                            {/* Only show delete button for group owners */}
                            {group.ownerId === user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <IconTrash size={16} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Chat Group
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "
                                      {group.name}"? This action cannot be
                                      undone and will remove all messages in
                                      this group.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        setGroupToDelete(group.id);
                                        withLoading(
                                          "delete",
                                          confirmDeleteGroup
                                        );
                                      }}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      {actionLoading === "delete" && (
                                        <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                      )}
                                      Delete Group
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {group.description || "No description available"}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1">
                            <IconUsers size={14} />
                            {group._count?.members ?? 0} members
                          </span>
                          <span className="flex items-center gap-1">
                            <IconMessage size={14} />
                            {group._count?.messages ?? 0} messages
                          </span>
                        </div>
                        <Separator className="mb-4" />
                        <div className="flex items-center justify-between">
                          {group.isMember ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setChatDialogOpen(true);
                                  fetchMessages(group.id);
                                  // Join the group room for real-time updates
                                  if (joinGroup) {
                                    joinGroup(group.id);
                                  }
                                }}
                                className="flex items-center gap-1"
                              >
                                <IconMessage size={14} />
                                Open Chat
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  withLoading("leave", () =>
                                    leaveGroupMembership(group.id)
                                  )
                                }
                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                disabled={actionLoading !== null}
                              >
                                {actionLoading === "leave" && (
                                  <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                )}
                                Leave
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                withLoading("join", () =>
                                  joinGroupMembership(group.id)
                                )
                              }
                              className="flex items-center gap-1"
                              disabled={actionLoading !== null}
                            >
                              {actionLoading === "join" && (
                                <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
                              )}
                              Join Group
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Edit Group Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Chat Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Group Name</Label>
                        <Input
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          placeholder="Enter group name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Enter group description"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-imageFile">
                          Group Image (Optional)
                        </Label>
                        <Input
                          id="edit-imageFile"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setEditForm({
                              ...editForm,
                              imageFile: file,
                            });
                          }}
                          className="cursor-pointer"
                        />
                        {editForm.imageFile && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {editForm.imageFile.name}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setEditDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => withLoading("update", updateGroup)}
                          disabled={
                            !editForm.name.trim() || actionLoading !== null
                          }
                        >
                          {actionLoading === "update" && (
                            <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          )}
                          Update Group
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Moderator Management Dialog */}
                <Dialog
                  open={moderatorDialogOpen}
                  onOpenChange={setModeratorDialogOpen}
                >
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        Manage Moderators - {selectedGroup?.name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Current Moderators</Label>
                        <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                          {selectedGroup?.moderators &&
                          selectedGroup.moderators.length > 0 ? (
                            selectedGroup.moderators.map((mod) => (
                              <div
                                key={mod.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={mod.user?.profilePicture || ""}
                                    />
                                    <AvatarFallback>
                                      {(
                                        mod.user?.name?.charAt(0) ?? ""
                                      ).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">
                                    {mod.user.name}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    withLoading("removeModerator", () =>
                                      removeModerator(mod.userId)
                                    )
                                  }
                                  className="text-red-600 hover:text-red-700"
                                  disabled={actionLoading !== null}
                                >
                                  {actionLoading === "removeModerator" ? (
                                    <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                  ) : (
                                    <IconTrash size={14} />
                                  )}
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              No moderators yet
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Add Moderator</Label>
                        <div className="flex gap-2">
                          <Select
                            value={selectedUserId}
                            onValueChange={setSelectedUserId}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableUsers
                                .filter(
                                  (u) =>
                                    u.id !== selectedGroup?.ownerId &&
                                    !selectedGroup?.moderators?.some(
                                      (m) => m.userId === u.id
                                    )
                                )
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name} ({user.user_type})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() =>
                              withLoading("addModerator", addModerator)
                            }
                            disabled={!selectedUserId || actionLoading !== null}
                          >
                            {actionLoading === "addModerator" ? (
                              <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            ) : (
                              <IconPlus size={16} />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setModeratorDialogOpen(false);
                            setSelectedUserId("");
                          }}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogContent>
                    <div>
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => setEditDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => withLoading("update", updateGroup)}
                          disabled={
                            !editForm.name.trim() || actionLoading !== null
                          }
                        >
                          {actionLoading === "update" && (
                            <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          )}
                          Update Group
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Chat Dialog */}
                <Dialog
                  open={chatDialogOpen}
                  onOpenChange={(open) => {
                    setChatDialogOpen(open);
                    // Leave the group room when closing chat
                    if (!open && selectedGroup && leaveGroup) {
                      leaveGroup(selectedGroup.id);
                    }
                  }}
                >
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
                    <DialogHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={
                                selectedGroup?.imageUrl ||
                                selectedGroup?.owner?.profilePicture ||
                                ""
                              }
                            />
                            <AvatarFallback>
                              {(
                                selectedGroup?.name?.charAt(0) ?? ""
                              ).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <DialogTitle>{selectedGroup?.name}</DialogTitle>
                            <p className="text-sm text-gray-500">
                              {selectedGroup?._count?.members ?? 0} members
                            </p>
                          </div>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="flex flex-col h-[500px]">
                      {/* Messages Area */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 border rounded-lg bg-gray-50 flex flex-col-reverse">
                        {messagesLoading ? (
                          <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="flex justify-center items-center h-full text-gray-500">
                            No messages yet. Start the conversation!
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {messages.map((message) => {
                              const isOwnMessage = message.user.id === user?.id;

                              return (
                                <div
                                  key={message.id}
                                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`flex gap-2 max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : ""}`}
                                  >
                                    {/* Show avatar only for other users */}
                                    {!isOwnMessage && (
                                      <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarImage
                                          src={
                                            message.user?.profilePicture || ""
                                          }
                                        />
                                        <AvatarFallback className="bg-gray-500 text-white text-xs">
                                          {(
                                            message.user?.name?.charAt(0) ?? ""
                                          ).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                    <div
                                      className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
                                    >
                                      <div
                                        className={`flex items-center gap-2 mb-1 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                                      >
                                        <span className="font-medium text-xs text-gray-600">
                                          {isOwnMessage
                                            ? "You"
                                            : message.user.name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {new Date(
                                            message.createdAt
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                      <div
                                        className={`relative group ${isOwnMessage ? "flex-row-reverse" : ""} flex items-center gap-2`}
                                      >
                                        <div
                                          className={`p-3 rounded-lg max-w-full break-words ${
                                            isOwnMessage
                                              ? "bg-blue-500 text-white rounded-br-sm"
                                              : "bg-white border border-gray-200 rounded-bl-sm shadow-sm"
                                          }`}
                                        >
                                          <p className="text-sm">
                                            {message.content}
                                          </p>
                                        </div>
                                        {/* Delete button for own messages */}
                                        {isOwnMessage && (
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <button
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                                title="Delete message"
                                              >
                                                <IconTrash size={14} />
                                              </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  Delete Message
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to
                                                  delete this message? This
                                                  action cannot be undone.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    deleteMessage(message.id)
                                                  }
                                                  className="bg-red-500 hover:bg-red-600"
                                                >
                                                  Delete
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Typing indicator */}
                            {typingUsers.size > 0 && (
                              <div className="flex justify-start">
                                <div className="flex items-center gap-2 text-gray-500 text-sm italic">
                                  <div className="flex space-x-1">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div
                                      className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                                      style={{ animationDelay: "0.1s" }}
                                    ></div>
                                    <div
                                      className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                                      style={{ animationDelay: "0.2s" }}
                                    ></div>
                                  </div>
                                  <span>
                                    {Array.from(typingUsers).join(", ")}{" "}
                                    {typingUsers.size === 1 ? "is" : "are"}{" "}
                                    typing...
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="flex gap-2 mt-4">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            // Handle typing indicator
                            const isCurrentlyTyping = e.target.value.length > 0;
                            handleTyping(isCurrentlyTyping);
                          }}
                          placeholder="Type your message..."
                          rows={2}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          onBlur={() => handleTyping(false)}
                        />
                        <Button
                          onClick={() => withLoading("send", sendMessage)}
                          disabled={
                            !newMessage.trim() || actionLoading !== null
                          }
                          className="self-end"
                        >
                          {actionLoading === "send" ? (
                            <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          ) : (
                            <IconSend size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Empty State */}
                {filteredGroups.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <IconMessage
                      size={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No chat groups found
                    </h3>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminProvider>
  );
}

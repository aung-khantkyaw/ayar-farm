import { useEffect, useState, useRef } from "react";
import type React from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/providers/auth-provider";
import { useSocket } from "@/providers/socket-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Users, Paperclip, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

export default function ChatRoomManagement() {
  const { user, isLoading } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [directUserName, setDirectUserName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupFile, setGroupFile] = useState<File | null>(null);
  const [participantUserName, setParticipantUserName] = useState("");
  const [groupSearchTerm, setGroupSearchTerm] = useState("");
  const [groupResults, setGroupResults] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [editingGroupInfo, setEditingGroupInfo] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [editedGroupDescription, setEditedGroupDescription] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => {
    try {
      return localStorage.getItem("token") || undefined;
    } catch {
      return undefined;
    }
  };

  async function fetchConversations() {
    setLoading(true);
    try {
      const token = getToken();
      const body = await api.get("/chat/conversations", token);
      const data = Array.isArray(body?.data)
        ? body.data
        : body?.data?.conversations || body?.conversations || body || [];
      setConversations(data);
    } catch (e) {
      console.error(e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const token = getToken();
      const body = await api.get("/users/", token);
      const data = Array.isArray(body?.data)
        ? body.data
        : body?.users || body?.data || [];
      setUsers(data);
    } catch (e) {
      console.error(e);
      setUsers([]);
    }
  }

  async function fetchMessages(conversationId: string) {
    setLoading(true);
    try {
      const token = getToken();
      const body = await api.get(
        `/chat/conversations/${conversationId}/messages`,
        token,
      );
      let data = Array.isArray(body?.data)
        ? body.data
        : body?.data?.messages || body?.messages || body || [];

      // Sort messages by creation date (oldest first)
      data = data.sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setMessages(data);
    } catch (e) {
      console.error(e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!selectedConv || (!input.trim() && !mediaFile)) return;

    try {
      const token = getToken();
      const formData = new FormData();

      if (input.trim()) {
        formData.append("content", input);
      }

      // Determine message type based on content
      const isVideo = mediaFile && mediaFile.type.startsWith("video/");
      const messageType = isVideo ? "VIDEO" : mediaFile ? "IMAGE" : "TEXT";
      formData.append("type", messageType);

      if (mediaFile) {
        formData.append("file", mediaFile); // Changed from 'media' to 'file' to match backend expectation
      }

      // Create a temporary message object to show immediately in UI
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content: input || (mediaFile ? "" : ""), // Only include content if it exists, or set to empty string for media-only
        createdAt: new Date().toISOString(),
        user: {
          id: user?.id,
          name: user?.name || "You",
          profile_picture: user?.profile_picture,
        },
        // Include media preview if available
        ...(mediaFile && {
          mediaUrl: previewUrl, // Use the local preview URL temporarily
          mediaName: mediaFile.name,
          mediaType: mediaFile.type,
        }),
      };

      // Add the temporary message to the UI immediately
      setMessages((prev) => [...prev, tempMessage]);

      // Send the message via API to ensure it's saved to the database
      await api.post(
        `/chat/conversations/${selectedConv.id}/messages`,
        formData,
        token,
      );

      // If we have a socket connection, emit the message to notify other participants
      if (socket) {
        // Emit socket event to notify other participants
        const isVideo = mediaFile && mediaFile.type.startsWith("video/");
        socket.emit("send_message", {
          conversationId: selectedConv.id,
          content: input,
          type: isVideo ? "VIDEO" : mediaFile ? "IMAGE" : "TEXT",
          ...(mediaFile && {
            fileName: mediaFile.name,
            fileType: mediaFile.type,
          }),
          // The actual message with media info will come through the socket listener
        });
      }

      // Clear inputs
      setInput("");
      setMediaFile(null);
      setPreviewUrl(null);
    } catch (e) {
      console.error(e);
      // Remove the temporary message if there was an error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
    }
  }

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function createDirectConversation() {
    if (!directUserName.trim()) return;
    setActionLoading(true);
    try {
      const token = getToken();

      // First, find the user by username to get their ID
      const userResponse = await api.get(
        `/users/search?q=${encodeURIComponent(directUserName.trim())}`,
        token,
      );
      const userData = Array.isArray(userResponse?.data)
        ? userResponse.data
        : userResponse?.users || [];

      if (!userData || userData.length === 0) {
        alert(`User "${directUserName.trim()}" not found`);
        return;
      }

      // Get the first matching user's ID
      const participantId = userData[0].id;

      await api.post(
        "/chat/conversations/direct",
        { participantId },
        token,
      );
      setDirectUserName("");
      fetchConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function createGroupConversation() {
    if (!groupName.trim()) return;
    setActionLoading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("name", groupName.trim());
      if (groupDescription.trim()) {
        formData.append("description", groupDescription.trim());
      }
      if (groupFile) {
        formData.append("image", groupFile);
      }
      await api.post("/chat/conversations/group", formData, token);
      setGroupName("");
      setGroupDescription("");
      setGroupFile(null);
      fetchConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function addParticipant() {
    if (!selectedConv || !participantUserName.trim()) return;
    setActionLoading(true);
    try {
      const token = getToken();

      // First, find the user by username/email/name to get their ID
      const userResponse = await api.get(
        `/users/search?q=${encodeURIComponent(participantUserName.trim())}`,
        token,
      );
      const userData = Array.isArray(userResponse?.data)
        ? userResponse.data
        : userResponse?.users || [];

      if (!userData || userData.length === 0) {
        alert(`User "${participantUserName.trim()}" not found`);
        return;
      }

      // Get the first matching user's ID
      const userId = userData[0].id;

      await api.post(
        `/chat/conversations/${selectedConv.id}/participants`,
        { participantIds: [userId] },
        token,
      );
      setParticipantUserName("");
      fetchMessages(selectedConv.id);

      // Refetch the group and user data after adding participant
      fetchConversations();
      fetchUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function removeParticipant(userId?: string) {
    if (!selectedConv) return;

    let targetUserId = userId;

    // If no userId is provided, try to resolve from participantUserName
    if (!targetUserId && participantUserName.trim()) {
      try {
        const token = getToken();

        // First, find the user by username/email/name to get their ID
        const userResponse = await api.get(
          `/users/search?q=${encodeURIComponent(participantUserName.trim())}`,
          token,
        );
        const userData = Array.isArray(userResponse?.data)
          ? userResponse.data
          : userResponse?.users || [];

        if (!userData || userData.length === 0) {
          alert(`User "${participantUserName.trim()}" not found`);
          return;
        }

        // Get the first matching user's ID
        targetUserId = userData[0].id;
      } catch (e) {
        console.error("Error resolving user:", e);
        return;
      }
    } else if (!targetUserId) {
      return; // No user specified
    }

    setActionLoading(true);
    try {
      const token = getToken();
      await api.delete(
        `/chat/conversations/${selectedConv.id}/participants/${targetUserId}`,
        token,
      );
      // Only clear participantUserName if we weren't given a direct userId
      if (!userId) {
        setParticipantUserName("");
      }

      // Refresh the conversation data to reflect the removal
      fetchMessages(selectedConv.id);
      if (showMembers) {
        fetchGroupMembers(); // Refresh the member list if it's visible
      }
      // Also refresh the group details participant list if it's visible
      if (showGroupDetails && selectedConv?.type === "GROUP") {
        // Update the selected conversation to trigger a re-render
        const token = getToken();
        const updatedConv = await api.get(
          `/chat/conversations/${selectedConv.id}`,
          token,
        );
        setSelectedConv(updatedConv.data || updatedConv);
      }

      // Refetch the group and user data after removing participant
      fetchConversations();
      fetchUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function markAsRead() {
    if (!selectedConv) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await api.post(`/chat/conversations/${selectedConv.id}/read`, {}, token);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function leaveConversation() {
    if (!selectedConv) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await api.post(`/chat/conversations/${selectedConv.id}/leave`, {}, token);
      setSelectedConv(null);
      setMessages([]);
      fetchConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function searchGroups() {
    if (!groupSearchTerm.trim()) {
      setGroupResults([]);
      return;
    }
    setActionLoading(true);
    try {
      const token = getToken();
      const body = await api.get(
        `/chat/groups/search?q=${encodeURIComponent(groupSearchTerm.trim())}`,
        token,
      );
      const data = Array.isArray(body?.data)
        ? body.data
        : body?.groups || body || [];
      setGroupResults(data);
    } catch (e) {
      console.error(e);
      setGroupResults([]);
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteConversation() {
    if (!selectedConv) return;

    if (
      !window.confirm(
        `Are you sure you want to delete the conversation "${selectedConv.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const token = getToken();
      await api.delete(`/chat/conversations/${selectedConv.id}`, token);

      // Reset state after deletion
      setSelectedConv(null);
      setMessages([]);

      // Refresh conversations list
      fetchConversations();
    } catch (e) {
      console.error("Error deleting conversation:", e);
    } finally {
      setActionLoading(false);
    }
  }

  async function fetchGroupMembers() {
    if (!selectedConv) return;

    try {
      getToken();
      setGroupMembers(selectedConv.participants || []);
    } catch (e) {
      console.error("Error fetching group members:", e);
      setGroupMembers([]);
    }
  }

  const toggleShowMembers = () => {
    if (selectedConv?.type === "GROUP") {
      const newState = !showMembers;
      setShowMembers(newState);
      if (newState) {
        fetchGroupMembers();
      }
    }
  };

  const toggleGroupDetails = () => {
    if (selectedConv?.type === "GROUP") {
      setShowGroupDetails(!showGroupDetails);
      // Initialize the edit fields when showing group details
      if (!showGroupDetails && selectedConv) {
        setEditedGroupName(selectedConv.name || "");
        setEditedGroupDescription(selectedConv.description || "");
      }
    }
  };

  const startEditingGroupInfo = () => {
    setEditingGroupInfo(true);
  };

  const cancelEditingGroupInfo = () => {
    setEditingGroupInfo(false);
    // Reset to original values
    if (selectedConv) {
      setEditedGroupName(selectedConv.name || "");
      setEditedGroupDescription(selectedConv.description || "");
    }
  };

  const saveEditedGroupInfo = async () => {
    if (!selectedConv) return;

    setActionLoading(true);
    try {
      const token = getToken();
      const updateData = {
        name: editedGroupName.trim(),
        description: editedGroupDescription.trim(),
      };

      await api.patch(
        `/chat/conversations/${selectedConv.id}`,
        updateData,
        token,
      );

      // Update the selected conversation with new info
      setSelectedConv({
        ...selectedConv,
        name: editedGroupName.trim(),
        description: editedGroupDescription.trim(),
      });

      // Also update in the conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConv.id
            ? {
                ...conv,
                name: editedGroupName.trim(),
                description: editedGroupDescription.trim(),
              }
            : conv,
        ),
      );

      setEditingGroupInfo(false);

      // Refetch the group and user data after update
      fetchConversations();
      fetchUsers();
    } catch (e) {
      console.error("Error updating group info:", e);
    } finally {
      setActionLoading(false);
    }
  };

  function getUserSuggestions(query: string) {
    const term = query.trim().toLowerCase();
    if (!term) return [] as any[];
    return users
      .filter(
        (u: any) =>
          (u.name || "").toLowerCase().includes(term) ||
          (u.username || "").toLowerCase().includes(term) ||
          (u.email || "").toLowerCase().includes(term),
      )
      .slice(0, 5);
  }

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (m: any) => {
      if (selectedConv && m.conversationId === selectedConv.id) {
        setMessages((prev) => {
          // Check if this is a response to our temporary message
          const tempIndex = prev.findIndex((msg) => msg.id.startsWith("temp-"));

          if (tempIndex !== -1) {
            // Replace the temporary message with the actual one from server
            const updatedMessages = [...prev];
            // Preserve any media information that might be in the server response
            updatedMessages[tempIndex] = {
              ...m,
              // If the server response doesn't have media info but our temp message did, preserve it
              ...(prev[tempIndex].mediaUrl &&
                !(m.mediaUrl || m.fileUrl) && {
                  mediaUrl: prev[tempIndex].mediaUrl,
                  mediaName: prev[tempIndex].mediaName,
                  mediaType: prev[tempIndex].mediaType,
                }),
            };
            return updatedMessages;
          } else {
            // Add as a new message from another user
            return [...prev, m];
          }
        });
      }
    };
    socket.on("message", handler);
    return () => void socket.off("message", handler);
  }, [socket, selectedConv]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper function to group messages by date
  const groupMessagesByDate = (messages: any[]) => {
    const grouped: Record<string, any[]> = {};

    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });

    return Object.entries(grouped).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.user_type !== "ADMIN") return <Navigate to="/auth/unauthorized" />;

  const directSuggestions = getUserSuggestions(directUserName);
  const participantSuggestions = getUserSuggestions(participantUserName);

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
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Chat Room Management
                  </h1>
                  <p className="text-muted-foreground">
                    Monitor conversations, create groups, and manage
                    participants
                  </p>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {conversations.length} conversations
                </Badge>
              </div>
            </div>

            <div className="px-4 lg:px-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
                {/* Left: conversation list */}
                <Card className="shadow-sm border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Conversations
                    </CardTitle>
                    <CardDescription>
                      Browse, search, and open conversations
                    </CardDescription>
                    <Input
                      placeholder="Search conversations..."
                      onChange={(e) => setSearch(e.target.value.toLowerCase())}
                      className="mt-2"
                    />
                  </CardHeader>
                  <CardContent className="max-h-[680px] overflow-auto space-y-2">
                    {conversations
                      .filter((c) =>
                        (c.name || "").toLowerCase().includes(search),
                      )
                      .map((c) => (
                        <div
                          key={c.id}
                          className={`rounded-lg border p-3 transition-colors hover:bg-gray-50 cursor-pointer ${
                            selectedConv?.id === c.id
                              ? "border-blue-200 bg-blue-50"
                              : "border-gray-200"
                          }`}
                          onClick={() => {
                            setSelectedConv(c);
                            fetchMessages(c.id);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium text-gray-900">
                              <MessageCircle className="w-4 h-4 text-gray-500" />
                              {c.name ||
                                c.participants?.find(
                                  (p: any) => p.user?.id !== user?.id,
                                )?.user?.name ||
                                "Conversation"}
                            </div>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {c._count?.members ??
                              c.participants?.length ??
                              0}{" "}
                            members
                          </div>
                        </div>
                      ))}
                    {conversations.length === 0 && !loading && (
                      <div className="text-sm text-muted-foreground">
                        No conversations found
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Middle: chat area */}
                <Card className="shadow-sm border">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {selectedConv
                            ? selectedConv?.name || "Conversation"
                            : "Select a Conversation"}
                        </CardTitle>
                        <CardDescription>
                          {selectedConv
                            ? `${selectedConv?._count?.members ?? selectedConv?.participants?.length ?? 0} members`
                            : "Choose a conversation to view messages"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {selectedConv && selectedConv.type === "GROUP" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleGroupDetails}
                            disabled={!selectedConv}
                          >
                            Group Details
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={markAsRead}
                            disabled={actionLoading || !selectedConv}
                          >
                            Mark as read
                          </Button>
                        )}
                        {selectedConv &&
                          selectedConv.type === "GROUP" &&
                          selectedConv.ownerId !== user?.id && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={leaveConversation}
                              disabled={actionLoading || !selectedConv}
                            >
                              Leave
                            </Button>
                          )}
                        {selectedConv &&
                          selectedConv.type === "GROUP" &&
                          selectedConv.ownerId === user?.id && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={deleteConversation}
                              disabled={actionLoading || !selectedConv}
                            >
                              Delete
                            </Button>
                          )}
                        {selectedConv && selectedConv.type === "DIRECT" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={leaveConversation}
                            disabled={actionLoading || !selectedConv}
                          >
                            Leave
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {selectedConv ? (
                      <div className="flex flex-col h-[520px]">
                        <div className="flex-1 overflow-auto bg-gray-50 p-4 flex flex-col">
                          {loading ? (
                            <div className="text-center text-sm text-muted-foreground">
                              Loading messages...
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground flex-grow flex items-center justify-center">
                              No messages yet
                            </div>
                          ) : (
                            <>
                              {groupMessagesByDate(messages).map((group) => (
                                <div key={group.date} className="mb-4">
                                  <div className="text-center text-xs text-muted-foreground my-2">
                                    {new Date(group.date).toLocaleDateString(
                                      "en-US",
                                      {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      },
                                    )}
                                  </div>
                                  <div className="space-y-3">
                                    {group.messages.map((m: any) => (
                                      <div
                                        key={m.id}
                                        className={`rounded-lg border bg-white p-3 shadow-xs max-w-[70%] min-w-[100px] w-fit break-words ${
                                          m.user?.id === user?.id
                                            ? "ml-auto bg-blue-50"
                                            : "mr-auto"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                          <span className="font-medium text-gray-900">
                                            {m.user?.name || "Unknown"}
                                          </span>
                                          <span>
                                            {m.createdAt
                                              ? new Date(
                                                  m.createdAt,
                                                ).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })
                                              : ""}
                                          </span>
                                        </div>
                                        {m.content && (
                                          <div className="text-sm leading-relaxed text-gray-900 mt-1 break-words">
                                            {m.content}
                                          </div>
                                        )}
                                        {(m.mediaUrl || m.fileUrl) && (
                                          <div className="mt-2">
                                            {(() => {
                                              // Use the appropriate URL field depending on what's available
                                              const mediaUrl =
                                                m.mediaUrl || m.fileUrl;
                                              const mediaName =
                                                m.mediaName ||
                                                m.fileName ||
                                                "File";

                                              const isImage =
                                                mediaUrl.endsWith(".jpg") ||
                                                mediaUrl.endsWith(".jpeg") ||
                                                mediaUrl.endsWith(".png") ||
                                                mediaUrl.endsWith(".gif") ||
                                                mediaUrl.endsWith(".webp");

                                              const isVideo =
                                                mediaUrl.endsWith(".mp4") ||
                                                mediaUrl.endsWith(".mov") ||
                                                mediaUrl.endsWith(".avi") ||
                                                mediaUrl.endsWith(".mkv") ||
                                                mediaUrl.endsWith(".wmv");

                                              const isAudio =
                                                mediaUrl.endsWith(".mp3") ||
                                                mediaUrl.endsWith(".wav") ||
                                                mediaUrl.endsWith(".ogg") ||
                                                mediaUrl.endsWith(".m4a");

                                              if (isImage) {
                                                return (
                                                  <img
                                                    src={mediaUrl}
                                                    alt="Shared image"
                                                    className="max-w-full max-h-60 rounded-md object-contain cursor-pointer"
                                                    onClick={() =>
                                                      window.open(
                                                        mediaUrl,
                                                        "_blank",
                                                      )
                                                    }
                                                  />
                                                );
                                              } else if (isVideo) {
                                                return (
                                                  <video
                                                    src={mediaUrl}
                                                    controls
                                                    className="max-w-full max-h-60 rounded-md"
                                                  >
                                                    Your browser does not
                                                    support the video tag.
                                                  </video>
                                                );
                                              } else if (isAudio) {
                                                return (
                                                  <audio
                                                    src={mediaUrl}
                                                    controls
                                                    className="w-full"
                                                  >
                                                    Your browser does not
                                                    support the audio element.
                                                  </audio>
                                                );
                                              } else {
                                                // For documents and other files, show download link
                                                return (
                                                  <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-md break-words">
                                                    <File className="w-5 h-5 text-blue-500" />
                                                    <div className="flex flex-col min-w-0">
                                                      <a
                                                        href={mediaUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:underline truncate"
                                                      >
                                                        {mediaName}
                                                      </a>
                                                      <span className="text-xs text-gray-500">
                                                        Click to download
                                                      </span>
                                                    </div>
                                                  </div>
                                                );
                                              }
                                            })()}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              <div ref={messagesEndRef} />
                            </>
                          )}
                        </div>
                        <div className="border-t bg-white p-4">
                          {/* Media preview */}
                          {previewUrl && (
                            <div className="mb-3 flex items-center justify-between p-2 bg-gray-100 rounded-md">
                              {(() => {
                                const isImage =
                                  mediaFile?.type.startsWith("image/");
                                const isVideo =
                                  mediaFile?.type.startsWith("video/");

                                if (isImage) {
                                  return (
                                    <img
                                      src={previewUrl}
                                      alt="Preview"
                                      className="h-20 w-20 object-cover rounded-md"
                                    />
                                  );
                                } else if (isVideo) {
                                  return (
                                    <video
                                      src={previewUrl}
                                      className="h-20 w-20 object-cover rounded-md"
                                      muted
                                    >
                                      Video preview
                                    </video>
                                  );
                                } else {
                                  return (
                                    <div className="flex items-center gap-2">
                                      <File className="w-6 h-6 text-blue-500" />
                                      <span className="text-sm truncate max-w-xs">
                                        {mediaFile?.name}
                                      </span>
                                    </div>
                                  );
                                }
                              })()}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeMedia}
                                className="h-8 w-8 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          )}

                          <div className="flex gap-3">
                            <div className="flex gap-2">
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleMediaChange}
                                className="hidden"
                                accept="*/*"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Paperclip className="w-4 h-4" />
                              </Button>
                            </div>

                            <Input
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder="Type a message or attach media"
                              className="flex-1"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  sendMessage();
                                }
                              }}
                            />
                            <Button
                              onClick={sendMessage}
                              disabled={!input.trim() && !mediaFile}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-[520px] items-center justify-center text-sm text-muted-foreground">
                        Select a conversation from the list to start
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Right: actions */}
                {showGroupDetails && selectedConv?.type === "GROUP" ? (
                  <Card className="shadow-sm border h-full">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            Group Details
                          </CardTitle>
                          <CardDescription>
                            Manage group information
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowGroupDetails(false)}
                        >
                          Back
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700">Name</h4>
                        {editingGroupInfo ? (
                          <Input
                            value={editedGroupName}
                            onChange={(e) => setEditedGroupName(e.target.value)}
                            placeholder="Group name"
                          />
                        ) : (
                          <p className="text-gray-900">
                            {selectedConv.name || "N/A"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700">
                          Description
                        </h4>
                        {editingGroupInfo ? (
                          <Input
                            value={editedGroupDescription}
                            onChange={(e) =>
                              setEditedGroupDescription(e.target.value)
                            }
                            placeholder="Group description"
                          />
                        ) : (
                          <p className="text-gray-900">
                            {selectedConv.description || "No description"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700">Admin</h4>
                        <div className="flex items-center gap-2">
                          {selectedConv.owner?.profile_picture ? (
                            <img
                              src={selectedConv.owner.profile_picture}
                              alt={selectedConv.owner.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {selectedConv.owner?.name
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
                          <span>{selectedConv.owner?.name || "Unknown"}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-700">
                            Participants (
                            {selectedConv.participants?.length || 0})
                          </h4>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {selectedConv.participants &&
                          selectedConv.participants.length > 0 ? (
                            selectedConv.participants.map(
                              (participant: any) => (
                                <div
                                  key={
                                    participant.userId || participant.user?.id
                                  }
                                  className="flex items-center justify-between p-2 border rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    {participant.user?.profile_picture ? (
                                      <img
                                        src={participant.user.profile_picture}
                                        alt={participant.user.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-xs font-medium">
                                          {participant.user?.name
                                            ?.charAt(0)
                                            ?.toUpperCase() || "?"}
                                        </span>
                                      </div>
                                    )}
                                    <span>
                                      {participant.user?.name ||
                                        participant.user?.email ||
                                        "Unknown"}
                                    </span>
                                  </div>
                                  {selectedConv.ownerId === user?.id &&
                                    participant.user?.id !==
                                      selectedConv.ownerId && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                          removeParticipant(
                                            participant.user?.id,
                                          )
                                        }
                                        disabled={actionLoading}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                </div>
                              ),
                            )
                          ) : (
                            <p className="text-sm text-gray-500">
                              No participants found
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        {selectedConv.ownerId === user?.id && (
                          <>
                            {editingGroupInfo ? (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={cancelEditingGroupInfo}
                                  disabled={actionLoading}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={saveEditedGroupInfo}
                                  disabled={
                                    actionLoading || !editedGroupName.trim()
                                  }
                                >
                                  Save
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={startEditingGroupInfo}
                                disabled={actionLoading}
                              >
                                Edit Info
                              </Button>
                            )}
                          </>
                        )}

                        {selectedConv.ownerId === user?.id && (
                          <Button
                            variant="destructive"
                            onClick={deleteConversation}
                            disabled={actionLoading}
                          >
                            Delete Group
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-sm border h-full">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        Actions
                      </CardTitle>
                      <CardDescription>
                        Create, manage, and search
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="text-sm font-semibold">
                          Direct message
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Target user name"
                            value={directUserName}
                            onChange={(e) => setDirectUserName(e.target.value)}
                          />
                          <Button
                            variant="secondary"
                            onClick={createDirectConversation}
                            disabled={actionLoading || !directUserName.trim()}
                          >
                            Create
                          </Button>
                        </div>
                        {directUserName && (
                          <div className="space-y-1">
                            {directSuggestions.map((u) => (
                              <button
                                key={u.id || u.username || u.email}
                                type="button"
                                className="w-full rounded border px-2 py-1 text-left text-xs transition hover:bg-gray-50"
                                onClick={() =>
                                  setDirectUserName(
                                    u.name || u.username || u.email || "",
                                  )
                                }
                              >
                                <span className="font-medium text-gray-900">
                                  {u.name || u.username || "User"}
                                </span>
                                {(u.username || u.email) && (
                                  <span className="text-muted-foreground ml-1">
                                    {u.username ? `(${u.username})` : u.email}
                                  </span>
                                )}
                              </button>
                            ))}
                            {directSuggestions.length === 0 && (
                              <div className="px-1 text-xs text-muted-foreground">
                                No matches
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="text-sm font-semibold">New group</div>
                        <Input
                          placeholder="Group name"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                        />
                        <Input
                          placeholder="Group description (optional)"
                          value={groupDescription}
                          onChange={(e) => setGroupDescription(e.target.value)}
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setGroupFile(file || null);
                          }}
                        />
                        <Button
                          onClick={createGroupConversation}
                          disabled={actionLoading || !groupName.trim()}
                        >
                          Create group
                        </Button>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-semibold">
                            Participants
                          </div>
                          {selectedConv?.type === "GROUP" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={toggleShowMembers}
                            >
                              {showMembers ? "Hide" : "Show"} Members
                            </Button>
                          )}
                        </div>

                        {selectedConv?.type === "GROUP" && showMembers ? (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">
                              Group Members ({groupMembers.length})
                            </h4>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {groupMembers.length > 0 ? (
                                groupMembers.map((member: any) => (
                                  <div
                                    key={member.userId || member.user?.id}
                                    className="flex items-center justify-between p-2 border rounded-md"
                                  >
                                    <div className="flex items-center gap-2">
                                      {member.user?.profile_picture ? (
                                        <img
                                          src={member.user.profile_picture}
                                          alt={member.user.name}
                                          className="w-8 h-8 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                          <span className="text-xs font-medium">
                                            {member.user?.name
                                              ?.charAt(0)
                                              ?.toUpperCase() || "?"}
                                          </span>
                                        </div>
                                      )}
                                      <span>
                                        {member.user?.name ||
                                          member.user?.email ||
                                          "Unknown"}
                                      </span>
                                    </div>
                                    {selectedConv.ownerId === user?.id &&
                                      member.user?.id !== user?.id && (
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() =>
                                            removeParticipant(member.user?.id)
                                          }
                                          disabled={actionLoading}
                                        >
                                          Remove
                                        </Button>
                                      )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No members found
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <Input
                              placeholder="Participant user name"
                              value={participantUserName}
                              onChange={(e) =>
                                setParticipantUserName(e.target.value)
                              }
                              disabled={!selectedConv}
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                onClick={addParticipant}
                                disabled={
                                  actionLoading ||
                                  !selectedConv ||
                                  !participantUserName.trim()
                                }
                              >
                                Add
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => removeParticipant()}
                                disabled={
                                  actionLoading ||
                                  !selectedConv ||
                                  !participantUserName.trim()
                                }
                              >
                                Remove
                              </Button>
                            </div>
                            {participantUserName && (
                              <div className="space-y-1">
                                {participantSuggestions.map((u) => (
                                  <button
                                    key={u.id || u.username || u.email}
                                    type="button"
                                    className="w-full rounded border px-2 py-1 text-left text-xs transition hover:bg-gray-50"
                                    onClick={() =>
                                      setParticipantUserName(
                                        u.name || u.username || u.email || "",
                                      )
                                    }
                                  >
                                    <span className="font-medium text-gray-900">
                                      {u.name || u.username || "User"}
                                    </span>
                                    {(u.username || u.email) && (
                                      <span className="text-muted-foreground ml-1">
                                        {u.username
                                          ? `(${u.username})`
                                          : u.email}
                                      </span>
                                    )}
                                  </button>
                                ))}
                                {participantSuggestions.length === 0 && (
                                  <div className="px-1 text-xs text-muted-foreground">
                                    No matches
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="text-sm font-semibold">
                          Search groups
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search term"
                            value={groupSearchTerm}
                            onChange={(e) => setGroupSearchTerm(e.target.value)}
                          />
                          <Button
                            onClick={searchGroups}
                            disabled={actionLoading}
                          >
                            Search
                          </Button>
                        </div>
                        <div className="space-y-1 max-h-40 overflow-auto text-sm text-gray-700">
                          {groupResults.map((g) => (
                            <div
                              key={g.id || g.name}
                              className="rounded border border-dashed p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                // Set the selected conversation to the clicked group
                                setSelectedConv(g);
                                // Fetch the messages for this group
                                fetchMessages(g.id);
                                // Close the member list if it's open
                                setShowMembers(false);
                              }}
                            >
                              <div className="font-semibold">
                                {g.name || g.title || "Group"}
                              </div>
                              {g.description && (
                                <div className="text-xs text-muted-foreground">
                                  {g.description}
                                </div>
                              )}
                            </div>
                          ))}
                          {groupResults.length === 0 && (
                            <div className="text-xs text-muted-foreground">
                              No group results
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

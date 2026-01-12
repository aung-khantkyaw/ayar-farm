import { useEffect, useState } from "react";
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
import { MessageCircle, Send, Users } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [directUserName, setDirectUserName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupFile, setGroupFile] = useState<File | null>(null);
  const [participantUserName, setParticipantUserName] = useState("");
  const [groupSearchTerm, setGroupSearchTerm] = useState("");
  const [groupResults, setGroupResults] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

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
        token
      );
      const data = Array.isArray(body?.data)
        ? body.data
        : body?.data?.messages || body?.messages || body || [];
      setMessages(data);
    } catch (e) {
      console.error(e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!selectedConv || !input.trim()) return;
    const payload = { conversationId: selectedConv.id, content: input };
    try {
      if (socket) {
        socket.emit("send_message", payload);
        setInput("");
        return;
      }
      const token = getToken();
      await api.post(
        `/chat/conversations/${selectedConv.id}/messages`,
        { content: input },
        token
      );
      setInput("");
      fetchMessages(selectedConv.id);
    } catch (e) {
      console.error(e);
    }
  }

  async function createDirectConversation() {
    if (!directUserName.trim()) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await api.post(
        "/chat/conversations/direct",
        { userId: directUserName.trim() },
        token
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
      if (groupFile) {
        formData.append("image", groupFile);
      }
      await api.post("/chat/conversations/group", formData, token);
      setGroupName("");
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
      await api.post(
        `/chat/conversations/${selectedConv.id}/participants`,
        { participantIds: [participantUserName.trim()] },
        token
      );
      setParticipantUserName("");
      fetchMessages(selectedConv.id);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function removeParticipant() {
    if (!selectedConv || !participantUserName.trim()) return;
    setActionLoading(true);
    try {
      const token = getToken();
      await api.delete(
        `/chat/conversations/${selectedConv.id}/participants/${participantUserName.trim()}`,
        token
      );
      setParticipantUserName("");
      fetchMessages(selectedConv.id);
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
        `/chat/groups/search?query=${encodeURIComponent(groupSearchTerm.trim())}`,
        token
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

  function getUserSuggestions(query: string) {
    const term = query.trim().toLowerCase();
    if (!term) return [] as any[];
    return users
      .filter(
        (u: any) =>
          (u.name || "").toLowerCase().includes(term) ||
          (u.username || "").toLowerCase().includes(term) ||
          (u.email || "").toLowerCase().includes(term)
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
      if (selectedConv && m.conversationId === selectedConv.id)
        setMessages((s) => [...s, m]);
    };
    socket.on("message", handler);
    return () => void socket.off("message", handler);
  }, [socket, selectedConv]);

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
                        (c.name || "").toLowerCase().includes(search)
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
                                  (p: any) => p.user?.id !== user?.id
                                )?.user?.name ||
                                "Conversation"}
                            </div>
                            <Badge
                              variant={
                                selectedConv?.id === c.id
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {c._count?.messages ?? c.messages?.length ?? 0}{" "}
                              messages
                            </Badge>
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
                            ? `${selectedConv?._count?.members ?? selectedConv?.participants?.length ?? 0} members · ${selectedConv?._count?.messages ?? selectedConv?.messages?.length ?? 0} messages`
                            : "Choose a conversation to view messages"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={markAsRead}
                          disabled={actionLoading || !selectedConv}
                        >
                          Mark as read
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={leaveConversation}
                          disabled={actionLoading || !selectedConv}
                        >
                          Leave
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {selectedConv ? (
                      <div className="flex flex-col h-[520px]">
                        <div className="flex-1 overflow-auto bg-gray-50 p-4 space-y-3">
                          {loading ? (
                            <div className="text-center text-sm text-muted-foreground">
                              Loading messages...
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground">
                              No messages yet
                            </div>
                          ) : (
                            messages.map((m: any) => (
                              <div
                                key={m.id}
                                className="rounded-lg border bg-white p-3 shadow-xs"
                              >
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="font-medium text-gray-900">
                                    {m.user?.name || "Unknown"}
                                  </span>
                                  <span>
                                    {m.createdAt
                                      ? new Date(m.createdAt).toLocaleString()
                                      : ""}
                                  </span>
                                </div>
                                <Separator className="my-2" />
                                <div className="text-sm leading-relaxed text-gray-900">
                                  {m.content}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="border-t bg-white p-4">
                          <div className="flex gap-3">
                            <Input
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder="Type a message"
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
                              disabled={!input.trim()}
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
                                  u.name || u.username || u.email || ""
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
                      <div className="text-sm font-semibold">Participants</div>
                      <Input
                        placeholder="Participant user name"
                        value={participantUserName}
                        onChange={(e) => setParticipantUserName(e.target.value)}
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
                          onClick={removeParticipant}
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
                                  u.name || u.username || u.email || ""
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
                          {participantSuggestions.length === 0 && (
                            <div className="px-1 text-xs text-muted-foreground">
                              No matches
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Search groups</div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search term"
                          value={groupSearchTerm}
                          onChange={(e) => setGroupSearchTerm(e.target.value)}
                        />
                        <Button onClick={searchGroups} disabled={actionLoading}>
                          Search
                        </Button>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-auto text-sm text-gray-700">
                        {groupResults.map((g) => (
                          <div
                            key={g.id || g.name}
                            className="rounded border border-dashed p-2"
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
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Trash2,
  Sparkles,
  ExternalLink,
  X,
  Plus,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";

import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: any;
  createdAt: Date;
}

interface PostDetail {
  id: string;
  content: string;
  author: {
    name: string;
  };
  createdAt: string;
}

interface ChatRoom {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export default function AIPlayground() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<ChatRoom | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    try {
      const token = localStorage.getItem("token") || undefined;
      const result = await api.get("/chat-rooms", token);
      setChatRooms(result.chatRooms || []);
    } catch (error) {
      console.error("Failed to load chat rooms:", error);
    }
  };

  const createNewRoom = async () => {
    try {
      const token = localStorage.getItem("token") || undefined;
      const result = await api.post(
        "/chat-rooms",
        { title: "New Chat" },
        token,
      );
      const newRoom = result.chatRoom;
      setChatRooms([newRoom, ...chatRooms]);
      setSelectedRoom(newRoom);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create chat room:", error);
    }
  };

  const selectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    try {
      const token = localStorage.getItem("token") || undefined;
      const result = await api.get(`/chat-rooms/${room.id}`, token);
      const roomData = result.chatRoom;
      if (roomData && roomData.messages) {
        setMessages(roomData.messages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to load room messages:", error);
    }
  };

  const deleteRoom = async (room: ChatRoom) => {
    setRoomToDelete(room);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;

    try {
      const token = localStorage.getItem("token") || undefined;
      await api.delete(`/chat-rooms/${roomToDelete.id}`, token);
      setChatRooms(chatRooms.filter((room) => room.id !== roomToDelete.id));
      if (selectedRoom?.id === roomToDelete.id) {
        setSelectedRoom(null);
        setMessages([]);
      }
      setShowDeleteConfirm(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error("Failed to delete chat room:", error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem("token") || undefined;
      const result = await api.get("/ai-chat/history", token);
      setMessages(result.data || []);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  const clearChatHistory = async () => {
    try {
      const token = localStorage.getItem("token") || undefined;
      if (selectedRoom) {
        await api.delete(`/ai-chat/history?roomId=${selectedRoom.id}`, token);
      } else {
        await api.delete("/ai-chat/history", token);
      }
      setMessages([]);
      setCurrentResponse("");
    } catch (error) {
      console.error("Failed to clear chat history:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);
    setCurrentResponse("");

    // Add user message to UI immediately
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "USER",
      content: userMessage,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Update room title if this is the first message in the room
    if (selectedRoom && messages.length === 0) {
      try {
        const token = localStorage.getItem("token") || undefined;
        const truncatedTitle =
          userMessage.length > 50
            ? userMessage.substring(0, 50) + "..."
            : userMessage;
        await api.put(
          `/chat-rooms/${selectedRoom.id}`,
          { title: truncatedTitle },
          token,
        );
        setSelectedRoom({ ...selectedRoom, title: truncatedTitle });
        setChatRooms(
          chatRooms.map((room) =>
            room.id === selectedRoom.id
              ? { ...room, title: truncatedTitle }
              : room,
          ),
        );
      } catch (error) {
        console.error("Failed to update room title:", error);
      }
    }

    try {
      const token = localStorage.getItem("token") || undefined;
      abortControllerRef.current = new AbortController();

      const response = await api.postStream(
        "/ai-chat/stream",
        {
          question: userMessage,
          roomId: selectedRoom?.id,
        },
        token,
        abortControllerRef.current.signal,
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk") {
                fullResponse += data.content;
                setCurrentResponse(fullResponse);
              } else if (data.type === "done") {
                fullResponse = data.content;
                setCurrentResponse("");
                const assistantMessage: Message = {
                  id: Date.now().toString(),
                  role: "ASSISTANT",
                  content: fullResponse,
                  sources: data.sources,
                  createdAt: new Date(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Chat error:", error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: "ASSISTANT",
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentResponse("");
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSourceClick = async (source: any) => {
    console.log("Source clicked:", source);
    const type = source.metadata?.type || source.collection;
    console.log("Type:", type);

    if ((type === "post" || type === "posts") && source.metadata?.post_id) {
      console.log("Fetching post:", source.metadata.post_id);
      // Fetch post details and show in dialog
      try {
        const token = localStorage.getItem("token") || undefined;
        const result = await api.get(
          `/post/posts/${source.metadata.post_id}`,
          token,
        );
        console.log("Post data:", result.data);
        setSelectedPost(result.data);
        setIsDialogOpen(true);
      } catch (error) {
        console.error("Failed to fetch post:", error);
      }
    } else if (
      (type === "document" || type === "documents") &&
      source.metadata?.document_id
    ) {
      console.log("Fetching document:", source.metadata.document_id);
      // Open document file directly
      try {
        const token = localStorage.getItem("token") || undefined;
        const result = await api.get(
          `/document/documents/${source.metadata.document_id}`,
          token,
        );
        console.log("Document API result:", result);
        const document = result.document;
        if (!document) {
          console.error("No document data found");
          return;
        }
        const fileUrl = document.file_urls?.[0] || document.file_url;
        console.log("File URL:", fileUrl);
        if (fileUrl) {
          window.open(fileUrl, "_blank");
        }
      } catch (error) {
        console.error("Failed to fetch document:", error);
      }
    } else if (
      (type === "knowledge_base" || type === "knowledgebase") &&
      source.metadata?.kb_id
    ) {
      console.log("Fetching knowledge base:", source.metadata.kb_id);
      // Open knowledge base file directly
      try {
        const token = localStorage.getItem("token") || undefined;
        const result = await api.get(
          `/knowledge-base/${source.metadata.kb_id}`,
          token,
        );
        console.log("Knowledge Base API result:", result);
        const kb = result.knowledgeBase;
        if (!kb) {
          console.error("No knowledge base data found");
          return;
        }
        const fileUrl = kb.file_urls?.[0] || kb.file_url;
        console.log("File URL:", fileUrl);
        if (fileUrl) {
          window.open(fileUrl, "_blank");
        }
      } catch (error) {
        console.error("Failed to fetch knowledge base:", error);
      }
    } else {
      console.log(
        "No matching condition - type:",
        type,
        "post_id:",
        source.metadata?.post_id,
        "document_id:",
        source.metadata?.document_id,
        "kb_id:",
        source.metadata?.kb_id,
      );
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen w-full bg-gray-50">
          <div className="flex-1 flex flex-col overflow-hidden">
            <SiteHeader />
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    AI Farming Assistant
                  </h1>
                  <p className="text-sm text-slate-500">
                    Ask about farming, livestock, and breeding
                  </p>
                </div>
              </div>
              <button
                onClick={clearChatHistory}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-2xl shadow-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </button>
            </div>

            {/* Main Content with Sidebar */}
            <div className="flex flex-1 overflow-hidden bg-gray-50">
              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {messages.length === 0 && !isLoading && (
                      <div className="rounded-[2rem] border border-gray-200 bg-white p-10 shadow-sm text-center">
                        <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-semibold text-slate-900 mb-2">
                          Welcome to AI Farming Assistant
                        </h2>
                        <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                          I can help you with questions about farming,
                          livestock, and breeding based on our knowledge base.
                        </p>
                      </div>
                    )}
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${
                          message.role === "USER"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {message.role === "ASSISTANT" && (
                          <div className="w-9 h-9 bg-slate-900 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-2xl rounded-[1.75rem] px-6 py-4 shadow-sm ${
                            message.role === "USER"
                              ? "bg-slate-900 text-white"
                              : "bg-white border border-slate-200 text-slate-900"
                          }`}
                        >
                          <div className="prose prose-sm prose-slate m-0">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ node, ...props }) => (
                                  <p className="whitespace-pre-wrap leading-relaxed mt-0" {...props} />
                                ),
                                a: ({ node, ...props }) => (
                                  <a className="text-slate-900 underline" {...props} />
                                ),
                                li: ({ node, ...props }) => (
                                  <li className="ml-5 list-disc" {...props} />
                                ),
                                code: ({ node, className, ...props }) => (
                                  <code
                                    className={`rounded-md bg-slate-100 px-1 py-0.5 text-sm font-mono ${
                                      className || ""
                                    }`}
                                    {...props}
                                  />
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          {message.sources &&
                            Array.isArray(message.sources) &&
                            message.sources.length > 0 && (
                              <div className="mt-4 rounded-3xl border border-gray-200 bg-gray-50 p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-3">
                                  Sources
                                </p>
                                <div className="space-y-2">
                                  {message.sources.map(
                                    (source: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700 transition hover:border-slate-900 hover:bg-slate-100 cursor-pointer"
                                        onClick={() =>
                                          handleSourceClick(source)
                                        }
                                      >
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                          <span className="font-medium capitalize text-gray-800">
                                            {source.metadata?.type ||
                                              source.collection}
                                          </span>
                                          <div className="flex items-center gap-2 text-gray-500">
                                            <span>
                                              {(source.score * 100).toFixed(0)}%
                                            </span>
                                            <ExternalLink className="w-3 h-3" />
                                          </div>
                                        </div>
                                        {source.metadata?.title && (
                                          <p className="font-medium text-gray-800 truncate">
                                            {source.metadata.title}
                                          </p>
                                        )}
                                        {source.metadata?.author && (
                                          <p className="text-gray-500">
                                            By: {source.metadata.author}
                                          </p>
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}

                    {isStreaming && currentResponse && (
                      <div className="flex gap-4 justify-start">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="max-w-2xl rounded-2xl px-5 py-3 bg-white border border-slate-200 text-slate-900">
                          <p className="whitespace-pre-wrap">
                            {currentResponse}
                          </p>
                          <span className="inline-block w-2 h-5 bg-slate-900 animate-pulse ml-1" />
                        </div>
                      </div>
                    )}

                    {isLoading && !isStreaming && (
                      <div className="flex gap-4 justify-start">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="max-w-2xl rounded-2xl px-5 py-3 bg-white border border-slate-200">
                          <Loader2 className="w-5 h-5 text-slate-900 animate-spin" />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input */}
                <div className="bg-white border-t border-gray-200 px-6 py-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about farming, livestock, or breeding..."
                        className="h-[48px] flex-1 resize-none rounded-3xl border border-gray-300 bg-white px-5 py-3 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-900"
                        rows={1}
                        disabled={isLoading}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="inline-flex h-[48px] items-center justify-center gap-2 rounded-3xl bg-slate-900 px-6 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                        {isLoading ? "Sending..." : "Send"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      AI responses are based on our farming knowledge base.
                      Answers may not be accurate.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Chat Rooms */}
              <div className="w-full max-w-sm shrink-0 bg-white border-t border-gray-200 lg:border-t-0 lg:border-l lg:w-80 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <button
                    onClick={createNewRoom}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Chat
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-4">
                  <div className="space-y-2">
                    {chatRooms.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 text-center">
                        No chat rooms yet. Start a new chat to begin.
                      </div>
                    ) : (
                      chatRooms.map((room) => (
                        <div
                          key={room.id}
                          className={`group relative rounded-3xl transition-shadow ${
                            selectedRoom?.id === room.id
                              ? "bg-slate-100 text-slate-900 shadow-sm"
                              : "bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <button
                            onClick={() => selectRoom(room)}
                            className="w-full text-left rounded-3xl px-4 py-3 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <MessageSquare className="w-4 h-4 flex-shrink-0 text-slate-900" />
                              <span className="truncate flex-1 font-medium">
                                {room.title || "New Chat"}
                              </span>
                              <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRoom(room);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Post Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2rem] border border-gray-200 bg-white shadow-xl">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <DialogTitle>Post Details</DialogTitle>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </DialogHeader>
            {selectedPost && (
              <div className="space-y-6 px-1 pb-6">
                <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-900 font-semibold">
                      {selectedPost.author?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedPost.author?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(selectedPost.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{selectedPost.content}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-md rounded-[2rem] border border-gray-200 bg-white shadow-xl">
            <DialogHeader>
              <DialogTitle>Delete Chat Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-gray-700">
                Are you sure you want to delete "
                {roomToDelete?.title || "this chat room"}"? This action cannot
                be undone and will delete all messages in this room.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRoomToDelete(null);
                  }}
                  className="px-4 py-2 rounded-3xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteRoom}
                  className="px-4 py-2 rounded-3xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

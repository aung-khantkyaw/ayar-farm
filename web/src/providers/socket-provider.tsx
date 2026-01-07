import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-provider";
import { SOCKET_URL } from "@/lib/config";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  sendMessage: (
    groupId: string,
    content: string,
    messageType: string,
    imageUrl?: string
  ) => void;
  deleteMessage: (messageId: string) => void;
  sendTyping: (groupId: string, isTyping: boolean) => void;
  onNewMessage: (callback: (message: any) => void) => (() => void) | undefined;
  onMessageDeleted: (
    callback: (data: {
      messageId: string;
      groupId: string;
      userId: string;
    }) => void
  ) => (() => void) | undefined;
  onUserTyping: (
    callback: (data: { groupId: string; user: any; isTyping: boolean }) => void
  ) => (() => void) | undefined;
  onGroupUpdate: (callback: (group: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      // Create socket connection
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: user.access_token,
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          userUsername: user.username,
          userType: user.user_type,
        },
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect", () => {
        // Send authentication data after connection
        newSocket.emit("authenticate", {
          id: user.id,
          name: user.name || user.email?.split("@")[0] || "Unknown",
          username: user.username || user.email?.split("@")[0] || "Unknown",
          profilePicture: user.profile_picture || "",
        });

        setIsConnected(true);

        // Request initial online users list
        newSocket.emit("get-online-users");
      });

      newSocket.on("online-users", (users: string[]) => {
        setOnlineUsers(users);
      });

      newSocket.on("user-online", (userId: string) => {
        setOnlineUsers((prev) => {
          if (!prev.includes(userId)) return [...prev, userId];
          return prev;
        });
      });

      newSocket.on("user-offline", (userId: string) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [user]);

  const joinGroup = (groupId: string) => {
    if (socket && user) {
      socket.emit("join_group", { groupId, userId: user.id });
      console.log("Joining group:", groupId);
    }
  };

  const leaveGroup = (groupId: string) => {
    if (socket) {
      socket.emit("leave_group", { groupId });
      console.log("Leaving group:", groupId);
    }
  };

  const sendMessage = (
    groupId: string,
    content: string,
    messageType: string = "TEXT",
    imageUrl?: string
  ) => {
    if (socket && user) {
      socket.emit("send_message", {
        groupId,
        userId: user.id,
        content,
        messageType,
        imageUrl: imageUrl || null,
      });
      console.log(
        "Sending message to group:",
        groupId,
        "with type:",
        messageType
      );
    }
  };

  const deleteMessage = (messageId: string) => {
    if (socket && user) {
      socket.emit("delete_message", { messageId, userId: user.id });
      console.log("Deleting message:", messageId);
    }
  };

  const sendTyping = (groupId: string, isTyping: boolean) => {
    if (socket) {
      socket.emit("typing", { groupId, isTyping });
    }
  };

  const onNewMessage = (callback: (message: any) => void) => {
    if (socket) {
      socket.on("new_message", callback);
      return () => socket.off("new_message", callback);
    }
  };

  const onMessageDeleted = (
    callback: (data: {
      messageId: string;
      groupId: string;
      userId: string;
    }) => void
  ) => {
    if (socket) {
      socket.on("message_deleted", callback);
      return () => socket.off("message_deleted", callback);
    }
  };

  const onUserTyping = (
    callback: (data: { groupId: string; user: any; isTyping: boolean }) => void
  ) => {
    if (socket) {
      socket.on("user_typing", callback);
      return () => socket.off("user_typing", callback);
    }
  };

  const onGroupUpdate = (callback: (group: any) => void) => {
    if (socket) {
      socket.on("group_update", callback);
      return () => socket.off("group_update", callback);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    joinGroup,
    leaveGroup,
    sendMessage,
    deleteMessage,
    sendTyping,
    onNewMessage,
    onMessageDeleted,
    onUserTyping,
    onGroupUpdate,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

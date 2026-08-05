"use client";

import { api } from "@/lib/api";
import type { User } from "@/lib/interface";
import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

interface AdminContextType {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getUsersByType: (userType: string) => User[];
  getTotalUsers: () => number;
  getVerifiedUsers: () => User[];
  getUnverifiedUsers: () => User[];
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const data = await api.get("/users/", token || undefined);

      if (data.data && Array.isArray(data.data)) {
        setUsers(data.data);
        toast.success(`Successfully loaded ${data.data.length} users`);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch users";
      setError(errorMessage);
      toast.error(`Failed to load users: ${errorMessage}`);
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  const getUserById = (id: string): User | undefined => {
    return users.find((user) => user.id === id);
  };

  const getUsersByType = (userType: string): User[] => {
    return users.filter((user) => user.user_type === userType);
  };

  const getTotalUsers = (): number => {
    return users.length;
  };

  const getVerifiedUsers = (): User[] => {
    return users.filter((user) => user.isVerified);
  };

  const getUnverifiedUsers = (): User[] => {
    return users.filter((user) => !user.isVerified);
  };

  // Auto-fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const value: AdminContextType = {
    users,
    isLoading,
    error,
    fetchUsers,
    refreshUsers,
    getUserById,
    getUsersByType,
    getTotalUsers,
    getVerifiedUsers,
    getUnverifiedUsers,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

export default AdminProvider;

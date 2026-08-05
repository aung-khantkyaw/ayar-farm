"use client";

import { type ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email?: string;
  phone_number?: string;
  [key: string]: any;
}

interface Session {
  user: User;
  access_token: string;
}

interface SignUpData {
  name: string;
  phone_number?: string;
  email?: string;
  password: string;
  user_type?: string;
  [key: string]: any;
}

interface UpdateUserProfileData {
  [key: string]: any;
  profilePicture?: File;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  confirmation: (code: string, identifier?: string) => Promise<void>;
  updateUserProfile: (userData: UpdateUserProfileData) => Promise<void>;
}

const decodeJwtPayload = (token: string): any => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    // Base64url decode per RFC 7515
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 <= Date.now();
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = () => {
      // Only access localStorage on client side
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && isTokenExpired(storedToken)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setSession(null);
        setIsLoading(false);
        router.push("/login");
        return;
      }

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setSession({ user: parsedUser, access_token: storedToken });

        // Sync cookies from localStorage
        if (typeof document !== "undefined") {
          document.cookie = `token=${storedToken}; path=/; max-age=86400`;
          document.cookie = `user=${encodeURIComponent(JSON.stringify(parsedUser))}; path=/; max-age=86400`;
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [router]);

  const signIn = async (
    identifier: string,
    password: string,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const isEmail = identifier.includes("@");
      const payload = isEmail
        ? { email: identifier, password }
        : { phone_number: identifier, password };

      const response = await api.post("/auth/login", payload);
      const { user, token } = response.data;

      setUser(user);
      setSession({ user, access_token: token });
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Set cookies for proxy middleware
      if (typeof document !== "undefined") {
        document.cookie = `token=${token}; path=/; max-age=86400`;
        document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400`;
      }

      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Error signing in", {
        description: error.message || "An unknown error occurred",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData): Promise<void> => {
    setIsLoading(true);
    try {
      // Backend expects: name, phone_number, email, password, user_type
      await api.post("/auth/register", data);

      if (data.email) {
        localStorage.setItem("pending_confirmation_identifier", data.email);
      } else if (data.phone_number) {
        localStorage.setItem(
          "pending_confirmation_identifier",
          data.phone_number,
        );
      }

      toast.success("Registration successful", {
        description: "Please check your email/phone for OTP",
      });

      router.push("/auth/confirm");
    } catch (error: any) {
      toast.error("Error signing up", {
        description: error.message || "An unknown error occurred",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {

      // Clear cookies for proxy middleware
      if (typeof document !== "undefined") {
        document.cookie = "token=; path=/; max-age=0";
        document.cookie = "user=; path=/; max-age=0";
      }

    setIsLoading(true);
    try {
      setUser(null);
      setSession(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    } catch (error: any) {
      toast.error("Error signing out", {
        description: error.message || "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmation = async (
    code: string,
    identifier?: string,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const targetIdentifier =
        identifier ||
        localStorage.getItem("pending_confirmation_identifier") ||
        user?.email ||
        user?.phone_number;

      if (!targetIdentifier) {
        throw new Error("Email or Phone number is required for verification");
      }

      const isEmail = targetIdentifier.includes("@");
      const payload = isEmail
        ? { email: targetIdentifier, code }
        : { phone_number: targetIdentifier, code };

      const response = await api.post("/auth/verify", payload);
      const { user: verifiedUser, token } = response.data;

      setUser(verifiedUser);
      setSession({ user: verifiedUser, access_token: token });
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(verifiedUser));
      localStorage.removeItem("pending_confirmation_identifier");

      // Set cookies for proxy middleware
      if (typeof document !== "undefined") {
        document.cookie = `token=${token}; path=/; max-age=86400`;
        document.cookie = `user=${encodeURIComponent(JSON.stringify(verifiedUser))}; path=/; max-age=86400`;
      }

      toast.success("Verification successful");
      router.push("/auth/success");
    } catch (error: any) {
      toast.error("Verification failed", {
        description: error.message || "An unknown error occurred",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (
    userData: UpdateUserProfileData,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      // Prepare form data for file upload if needed
      const formData = new FormData();

      // Add all user data fields to form data
      Object.keys(userData).forEach((key) => {
        if (key === "profilePicture" && userData[key] instanceof File) {
          formData.append("profile_picture", userData[key]);
        } else if (key !== "profilePicture") {
          formData.append(key, userData[key]);
        }
      });

      // Make API call to update user profile
      const response = await api.put(
        "/users/profile",
        formData,
        "multipart/form-data",
      );

      const updatedUser = response.data.user;

      // Update local state and storage
      setUser(updatedUser);
      setSession((prev: Session | null) =>
        prev ? { ...prev, user: updatedUser } : null,
      );
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error("Error updating profile", {
        description: error.message || "An unknown error occurred",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        confirmation,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

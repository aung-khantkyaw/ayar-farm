"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { api } from "@/lib/api";

const decodeJwtPayload = (token: string) => {
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

const isTokenExpired = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 <= Date.now();
};

type AuthContextType = {
  user: any;
  session: any;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  confirmation: (code: string, identifier?: string) => Promise<void>;
  updateUserProfile: (userData: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && isTokenExpired(storedToken)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setSession(null);
        router.navigate({ to: "/login" });
        setIsLoading(false);
        return;
      }

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setSession({ user: parsedUser, access_token: storedToken });
      }
      setIsLoading(false);
    };

    initAuth();
  }, [router]);

  const signIn = async (identifier: string, password: string) => {
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

      router.navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error("Error signing in", {
        description: error.message || "An unknown error occurred",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: any) => {
    setIsLoading(true);
    try {
      // Backend expects: name, phone_number, email, password, user_type
      await api.post("/auth/register", data);

      if (data.email) {
        localStorage.setItem("pending_confirmation_identifier", data.email);
      } else if (data.phone_number) {
        localStorage.setItem(
          "pending_confirmation_identifier",
          data.phone_number
        );
      }

      toast.success("Registration successful", {
        description: "Please check your email/phone for OTP",
      });

      router.navigate({ to: "/auth/confirm" });
    } catch (error: any) {
      toast.error("Error signing up", {
        description: error.message || "An unknown error occurred",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      setSession(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.navigate({ to: "/login" });
    } catch (error: any) {
      toast.error("Error signing out", {
        description: error.message || "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmation = async (code: string, identifier?: string) => {
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

      toast.success("Verification successful");
      router.navigate({ to: "/auth/success" });
    } catch (error: any) {
      toast.error("Verification failed", {
        description: error.message || "An unknown error occurred",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (userData: any) => {
    setIsLoading(true);
    try {
      // Prepare form data for file upload if needed
      const formData = new FormData();

      // Add all user data fields to form data
      Object.keys(userData).forEach(key => {
        if (key === 'profilePicture' && userData[key] instanceof File) {
          formData.append('profile_picture', userData[key]);
        } else if (key !== 'profilePicture') {
          formData.append(key, userData[key]);
        }
      });

      // Make API call to update user profile
      const response = await api.put("/users/profile", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedUser = response.data.user;

      // Update local state and storage
      setUser(updatedUser);
      setSession(prev => ({ ...prev, user: updatedUser }));
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

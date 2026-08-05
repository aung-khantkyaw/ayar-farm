import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { api } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const getGreeting = (time: Date): string => {
  const hour = time.getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const routeTo = (url: string) => {
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}

const getUserById = async (id: string) => {
  const user = await api.get(`/users/${id}`);
  return user;
}

export { getGreeting, formatTime, formatDate, routeTo, getUserById };

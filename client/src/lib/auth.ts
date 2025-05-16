import { apiRequest } from "./queryClient";
import type { LoginUser, RegisterUser, User } from "@shared/schema";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export async function loginUser(data: LoginUser): Promise<User> {
  const res = await apiRequest("POST", "/api/auth/login", data);
  return await res.json();
}

export async function registerUser(data: RegisterUser): Promise<User> {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return await res.json();
}

export async function logoutUser(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function getUserSession(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/session", {
      credentials: "include",
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        return null;
      }
      throw new Error("Failed to get user session");
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error getting user session:", error);
    return null;
  }
}

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({ 
    queryKey: ['/api/auth/session'],
    queryFn: getUserSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
  
  const login = async (data: LoginUser) => {
    await loginUser(data);
    return refetch();
  };
  
  const register = async (data: RegisterUser) => {
    await registerUser(data);
    return refetch();
  };
  
  const logout = async () => {
    await logoutUser();
    return refetch();
  };
  
  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refetch,
  };
}

export function useRequireAuth(redirectTo = "/login") {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!isLoading) {
      setIsReady(true);
      
      if (!isAuthenticated && typeof window !== "undefined") {
        window.location.href = redirectTo;
      }
    }
  }, [isLoading, isAuthenticated, redirectTo]);
  
  return { user, isLoading, isAuthenticated, isReady };
}

export function useRedirectIfAuth(redirectTo = "/dashboard") {
  const { isLoading, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated && typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
  }, [isLoading, isAuthenticated, redirectTo]);
  
  return { isLoading, isAuthenticated };
}

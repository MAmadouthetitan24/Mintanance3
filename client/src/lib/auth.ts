import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

// Hook for checking authentication status
export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

// Hook for requiring authentication (redirects to login if not authenticated)
export function useRequireAuth() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        window.location.href = "/api/login";
      } else {
        setIsReady(true);
      }
    }
  }, [user, isLoading, navigate]);

  return { user, isReady };
}

// Utility function to handle login
export function login() {
  window.location.href = "/api/login";
}

// Utility function to handle logout
export function logout() {
  window.location.href = "/api/logout";
}
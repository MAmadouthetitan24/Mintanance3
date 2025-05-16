import React, { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";

// Lazy load components to improve initial load performance
const Home = lazy(() => import("@/pages/home"));
const CustomerDashboard = lazy(() => import("@/pages/customer-dashboard"));
const ContractorDashboard = lazy(() => import("@/pages/contractor-dashboard"));
const JobDetail = lazy(() => import("@/pages/job-detail"));
const JobRequest = lazy(() => import("@/pages/job-request"));
const Jobs = lazy(() => import("@/pages/jobs"));
const Calendar = lazy(() => import("@/pages/calendar"));
const JobSheet = lazy(() => import("@/pages/job-sheet"));
const Messaging = lazy(() => import("@/pages/messaging"));
const Profile = lazy(() => import("@/pages/profile"));
const Payment = lazy(() => import("@/pages/payment"));

// Loading component for lazy loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center">
      <div className="h-16 w-16 border-4 border-t-primary border-gray-200 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Router with auth protection for certain routes
function Router() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Auto-redirect to appropriate dashboard based on user role
  React.useEffect(() => {
    if (!isLoading && user) {
      const path = window.location.pathname;
      if (path === "/" || path === "/login") {
        if (user.role === "contractor") {
          navigate("/contractor-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    }
  }, [user, isLoading, navigate]);

  // Protected route component
  const ProtectedRoute = ({ component: Component, ...rest }: any) => {
    if (isLoading) return <PageLoader />;
    if (!user) {
      navigate("/login");
      return null;
    }
    return <Component {...rest} />;
  };

  // Role-specific route component
  const RoleRoute = ({ component: Component, roles, ...rest }: any) => {
    if (isLoading) return <PageLoader />;
    if (!user) {
      navigate("/login");
      return null;
    }
    if (!roles.includes(user.role)) {
      if (user.role === "contractor") {
        navigate("/contractor-dashboard");
      } else {
        navigate("/dashboard");
      }
      return null;
    }
    return <Component {...rest} />;
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={Home} />
        <Route path="/login" component={Home} />
        
        {/* User-specific dashboards */}
        <Route path="/dashboard" component={() => 
          <RoleRoute component={CustomerDashboard} roles={["homeowner"]} />
        } />
        <Route path="/contractor-dashboard" component={() => 
          <RoleRoute component={ContractorDashboard} roles={["contractor"]} />
        } />
        
        {/* Protected routes (require authentication) */}
        <Route path="/job-detail/:id" component={(params) => 
          <ProtectedRoute component={JobDetail} params={params} />
        } />
        <Route path="/job-request" component={() => 
          <ProtectedRoute component={JobRequest} />
        } />
        <Route path="/jobs" component={() => 
          <ProtectedRoute component={Jobs} />
        } />
        <Route path="/calendar" component={() => 
          <ProtectedRoute component={Calendar} />
        } />
        <Route path="/job-sheet/:id" component={(params) => 
          <ProtectedRoute component={JobSheet} params={params} />
        } />
        <Route path="/messaging" component={() => 
          <ProtectedRoute component={Messaging} />
        } />
        <Route path="/profile" component={() => 
          <ProtectedRoute component={Profile} />
        } />
        <Route path="/payment/:id" component={(params) => 
          <ProtectedRoute component={Payment} params={params} />
        } />
        
        {/* 404 route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

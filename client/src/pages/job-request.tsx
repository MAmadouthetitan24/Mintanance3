import { useRequireAuth } from "@/lib/auth";
import MainLayout from "@/components/layout/MainLayout";
import JobRequestForm from "@/components/jobs/JobRequestForm";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function JobRequest() {
  const { user, isReady } = useRequireAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect contractors to dashboard, only homeowners can create job requests
  if (isReady && user && user.role === "contractor") {
    window.location.href = "/dashboard";
    return null;
  }
  
  if (!isReady || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <MainLayout title="Submit a Job Request">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Submit a Job Request</h1>
          <JobRequestForm />
        </div>
      </div>
    </MainLayout>
  );
}

import { useRequireAuth } from "@/lib/auth";
import MainLayout from "@/components/layout/MainLayout";
import JobDetail from "@/components/jobs/JobDetail";

export default function JobDetailPage() {
  const { user, isReady } = useRequireAuth();
  
  // Get job ID from URL
  const jobId = parseInt(window.location.pathname.split('/').pop() || '0');
  
  if (!isReady || !user || !jobId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <MainLayout title="Job Details">
      <JobDetail 
        jobId={jobId} 
        userRole={user.role as "homeowner" | "contractor"} 
      />
    </MainLayout>
  );
}

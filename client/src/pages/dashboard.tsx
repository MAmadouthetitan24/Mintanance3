import { useRequireAuth } from "@/lib/auth";
import MainLayout from "@/components/layout/MainLayout";
import HomeownerDashboard from "@/components/dashboard/HomeownerDashboard";
import ContractorDashboard from "@/components/dashboard/ContractorDashboard";

export default function Dashboard() {
  const { user, isReady } = useRequireAuth();
  
  if (!isReady || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <MainLayout title="Dashboard">
      {user.role === "homeowner" ? (
        <HomeownerDashboard user={user} />
      ) : (
        <ContractorDashboard user={user} />
      )}
    </MainLayout>
  );
}

import { useRequireAuth } from "@/lib/auth";
import MainLayout from "@/components/layout/MainLayout";
import ContractorProfile from "@/components/contractors/ContractorProfile";

export default function ContractorProfilePage() {
  const { user, isReady } = useRequireAuth();
  
  // Get contractor ID from URL
  const contractorId = parseInt(window.location.pathname.split('/').pop() || '0');
  
  if (!isReady || !user || !contractorId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <MainLayout title="Contractor Profile">
      <ContractorProfile contractorId={contractorId} />
    </MainLayout>
  );
}

import { useRequireAuth } from "@/lib/auth";
import MainLayout from "@/components/layout/MainLayout";
import Calendar from "@/components/scheduling/Calendar";

export default function CalendarPage() {
  const { user, isReady } = useRequireAuth();
  
  if (!isReady || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <MainLayout title="Calendar">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Calendar 
            userId={user.id} 
            userRole={user.role as "homeowner" | "contractor"} 
          />
        </div>
      </div>
    </MainLayout>
  );
}

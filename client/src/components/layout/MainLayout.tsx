import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useAuth } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeRole, setActiveRole] = useState<"homeowner" | "contractor">(
    user?.role as "homeowner" | "contractor" || "homeowner"
  );
  
  // Set document title
  useEffect(() => {
    document.title = title ? `${title} | HomeFixr` : "HomeFixr";
  }, [title]);
  
  // Update active role when user changes
  useEffect(() => {
    if (user?.role) {
      setActiveRole(user.role as "homeowner" | "contractor");
    }
  }, [user]);
  
  const toggleRole = () => {
    setActiveRole(activeRole === "homeowner" ? "contractor" : "homeowner");
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header user={user} />
      
      <div className="flex-1 flex overflow-hidden">
        {!isMobile && <Sidebar user={user} activeRole={activeRole} toggleRole={toggleRole} />}
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none pb-16 md:pb-0">
          {/* Role Switcher - Tab Navigation */}
          <div className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center md:justify-start space-x-8 -mb-px">
                <button 
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeRole === "homeowner" 
                      ? "border-primary-500 text-primary-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveRole("homeowner")}
                >
                  Homeowner View
                </button>
                <button 
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeRole === "contractor" 
                      ? "border-primary-500 text-primary-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveRole("contractor")}
                >
                  Contractor View
                </button>
              </div>
            </div>
          </div>
          
          {children}
        </main>
      </div>
      
      {isMobile && <MobileNav />}
    </div>
  );
}

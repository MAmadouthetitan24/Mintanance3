import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

interface SidebarProps {
  user: User | null | undefined;
  activeRole: "homeowner" | "contractor";
  toggleRole: () => void;
}

export default function Sidebar({ user, activeRole, toggleRole }: SidebarProps) {
  const [location] = useLocation();
  
  const homeownerNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: "ri-home-4-line" },
    { href: "/jobs", label: "My Jobs", icon: "ri-file-list-3-line" },
    { href: "/messaging", label: "Messages", icon: "ri-message-3-line" },
    { href: "/calendar", label: "Calendar", icon: "ri-calendar-check-line" },
    { href: "/profile", label: "Profile", icon: "ri-user-settings-line" },
  ];
  
  const contractorNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: "ri-home-4-line" },
    { href: "/jobs", label: "Jobs", icon: "ri-file-list-3-line" },
    { href: "/messaging", label: "Messages", icon: "ri-message-3-line" },
    { href: "/calendar", label: "Calendar", icon: "ri-calendar-check-line" },
    { href: "/profile", label: "Profile", icon: "ri-user-settings-line" },
  ];
  
  const navItems = activeRole === "homeowner" ? homeownerNavItems : contractorNavItems;
  
  return (
    <nav className="hidden md:block bg-white w-64 border-r border-gray-200 pt-5 pb-4 flex-shrink-0">
      {user && (
        <div className="px-6">
          <div className="flex items-center">
            <div className="bg-primary-100 text-primary-800 rounded-full h-12 w-12 flex items-center justify-center">
              <span className="font-medium text-sm">{getInitials(user.name)}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user.name}</p>
              <p className="text-xs font-medium text-gray-500">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-5 flex-grow flex flex-col">
        <div className="flex-1 space-y-1 px-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location === item.href
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <i
                  className={cn(
                    `${item.icon} mr-3 text-lg`,
                    location === item.href ? "text-primary-500" : "text-gray-400"
                  )}
                ></i>
                {item.label}
              </a>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-200 p-4">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center px-4 py-2 text-sm text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100"
          onClick={toggleRole}
        >
          <i className="ri-logout-box-r-line mr-2"></i>
          Switch to {activeRole === "homeowner" ? "Contractor" : "Homeowner"}
        </Button>
      </div>
    </nav>
  );
}

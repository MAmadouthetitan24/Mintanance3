import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/dashboard", label: "Home", icon: "ri-home-4-line" },
    { href: "/jobs", label: "Jobs", icon: "ri-file-list-3-line" },
    { href: "/job-request", label: "New", icon: <Plus className="h-6 w-6" /> },
    { href: "/messaging", label: "Messages", icon: "ri-message-3-line" },
    { href: "/profile", label: "Profile", icon: "ri-user-line" },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-white shadow-lg border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item, index) => (
          <Link key={index} href={item.href}>
            <a className={cn(
              "flex flex-col items-center justify-center",
              location === item.href
                ? "text-primary-700"
                : "text-gray-500"
            )}>
              {typeof item.icon === "string" ? (
                <i className={`${item.icon} text-xl`}></i>
              ) : (
                index === 2 ? (
                  <div className="bg-primary-600 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg">
                    {item.icon}
                  </div>
                ) : (
                  item.icon
                )
              )}
              {index !== 2 && <span className="text-xs mt-1">{item.label}</span>}
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}

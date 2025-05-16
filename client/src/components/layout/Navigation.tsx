import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { User, Menu, X, Home, Search, Calendar, MessageSquare, ClipboardList, Bell, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { connectWebSocket, useWebSocket } from '@/lib/websocket';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

type NavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: ('homeowner' | 'contractor')[];
};

const navItems: NavItem[] = [
  { name: 'Home', path: '/dashboard', icon: <Home className="h-5 w-5" />, roles: ['homeowner', 'contractor'] },
  { name: 'Find Services', path: '/services', icon: <Search className="h-5 w-5" />, roles: ['homeowner'] },
  { name: 'My Jobs', path: '/jobs', icon: <ClipboardList className="h-5 w-5" />, roles: ['homeowner', 'contractor'] },
  { name: 'Calendar', path: '/calendar', icon: <Calendar className="h-5 w-5" />, roles: ['homeowner', 'contractor'] },
  { name: 'Messages', path: '/messaging', icon: <MessageSquare className="h-5 w-5" />, roles: ['homeowner', 'contractor'] },
  { name: 'Profile', path: '/profile', icon: <User className="h-5 w-5" />, roles: ['homeowner', 'contractor'] },
];

type NavigationProps = {
  userRole?: 'homeowner' | 'contractor';
  isLoggedIn: boolean;
};

const Navigation: React.FC<NavigationProps> = ({ userRole = 'homeowner', isLoggedIn }) => {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));
  
  // Connect to WebSocket for real-time notifications when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      // For Replit Auth, the user object might contain the claims property
      // Or it might have the ID directly depending on how auth is structured
      let userId = '';
      
      if (user) {
        if (typeof user === 'object') {
          // Try to get ID from various possible structures
          userId = (user as any).id || 
                  (user as any).claims?.sub || 
                  (user as any).sub || 
                  '';
        } else if (typeof user === 'string') {
          userId = user;
        }
      }
      
      if (userId) {
        console.log('Connecting to WebSocket with user ID:', userId);
        connectWebSocket(userId);
      }
    }
  }, [user, isLoggedIn]);

  // Landing page navigation when not logged in
  if (!isLoggedIn) {
    return (
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <a className="flex-shrink-0 flex items-center">
                  <span className="text-[#004080] font-bold text-xl">Mintenance</span>
                </a>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/about">
                <a className="text-[#6C757D] hover:text-[#004080] px-3 py-2 text-sm font-medium">About</a>
              </Link>
              <Link href="/services">
                <a className="text-[#6C757D] hover:text-[#004080] px-3 py-2 text-sm font-medium">Services</a>
              </Link>
              <Link href="/contact">
                <a className="text-[#6C757D] hover:text-[#004080] px-3 py-2 text-sm font-medium">Contact</a>
              </Link>
              <Link href="/login">
                <a className="text-[#004080] hover:bg-[#004080] hover:text-white border border-[#004080] px-4 py-2 rounded-md text-sm font-medium">Login</a>
              </Link>
              <Link href="/register">
                <a className="bg-[#3EB489] text-white hover:bg-[#30A070] px-4 py-2 rounded-md text-sm font-medium">Sign Up</a>
              </Link>
            </div>
            
            <div className="flex md:hidden items-center">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-[#6C757D] hover:text-[#004080] hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1 px-2">
              <Link href="/about">
                <a onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-[#6C757D] hover:text-[#004080] hover:bg-gray-50">About</a>
              </Link>
              <Link href="/services">
                <a onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-[#6C757D] hover:text-[#004080] hover:bg-gray-50">Services</a>
              </Link>
              <Link href="/contact">
                <a onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-[#6C757D] hover:text-[#004080] hover:bg-gray-50">Contact</a>
              </Link>
              <Link href="/login">
                <a onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-[#004080] hover:bg-gray-50">Login</a>
              </Link>
              <Link href="/register">
                <a onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-[#3EB489] hover:bg-gray-50">Sign Up</a>
              </Link>
            </div>
          </div>
        )}
      </nav>
    );
  }

  // Dashboard navigation for logged in users
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard">
              <a className="flex-shrink-0 flex items-center">
                <span className="text-[#004080] font-bold text-xl">Mintenance</span>
              </a>
            </Link>
            
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {filteredNavItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a 
                    className={`${
                      location === item.path 
                        ? 'border-b-2 border-[#3EB489] text-[#004080]' 
                        : 'text-[#6C757D] hover:text-[#004080] hover:border-b-2 hover:border-[#3EB489]'
                    } px-3 py-5 text-sm font-medium flex items-center`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.name}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {/* Real-time notification center */}
            <NotificationCenter />
            
            <div className="relative">
              <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3EB489]">
                <div className="h-8 w-8 rounded-full bg-[#3EB489] flex items-center justify-center text-white">
                  {userRole === 'homeowner' ? 'H' : 'C'}
                </div>
              </button>
            </div>
            
            <Link href="/settings">
              <a className="text-[#6C757D] hover:text-[#004080] p-2">
                <Settings className="h-5 w-5" />
              </a>
            </Link>
            
            <Link href="/logout">
              <a className="text-[#6C757D] hover:text-[#004080] p-2">
                <LogOut className="h-5 w-5" />
              </a>
            </Link>
          </div>
          
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#6C757D] hover:text-[#004080] hover:bg-gray-100 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 px-2">
            {filteredNavItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a 
                  onClick={closeMenu}
                  className={`${
                    location === item.path 
                      ? 'bg-[#004080] text-white' 
                      : 'text-[#6C757D] hover:bg-gray-50 hover:text-[#004080]'
                  } block px-3 py-2 rounded-md text-base font-medium flex items-center`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </a>
              </Link>
            ))}
            
            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-[#3EB489] flex items-center justify-center text-white">
                    {userRole === 'homeowner' ? 'H' : 'C'}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-[#004080]">
                    {userRole === 'homeowner' ? 'Homeowner' : 'Contractor'}
                  </div>
                  <div className="text-sm font-medium text-[#6C757D]">user@example.com</div>
                </div>
              </div>
              
              <div className="mt-3 space-y-1 px-2">
                <Link href="/settings">
                  <a onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-[#6C757D] hover:bg-gray-50 hover:text-[#004080] flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Settings
                  </a>
                </Link>
                <Link href="/logout">
                  <a onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-[#6C757D] hover:bg-gray-50 hover:text-[#004080] flex items-center">
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign out
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
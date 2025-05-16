import React from 'react';
import Navigation from './Navigation';

interface MainLayoutProps {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  userRole?: 'homeowner' | 'contractor';
  title?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  isLoggedIn = false, 
  userRole = 'homeowner',
  title 
}) => {
  // Set document title
  React.useEffect(() => {
    document.title = title ? `${title} | Mintenance` : 'Mintenance';
  }, [title]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation isLoggedIn={isLoggedIn} userRole={userRole} />
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="bg-[#004080] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Mintenance</h3>
              <p className="text-sm">
                Your on-demand home maintenance and repair marketplace, connecting homeowners with qualified contractors.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="text-sm hover:text-[#3EB489]">About Us</a></li>
                <li><a href="/services" className="text-sm hover:text-[#3EB489]">Services</a></li>
                <li><a href="/contact" className="text-sm hover:text-[#3EB489]">Contact</a></li>
                <li><a href="/careers" className="text-sm hover:text-[#3EB489]">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="/for-contractors" className="text-sm hover:text-[#3EB489]">For Contractors</a></li>
                <li><a href="/for-homeowners" className="text-sm hover:text-[#3EB489]">For Homeowners</a></li>
                <li><a href="/blog" className="text-sm hover:text-[#3EB489]">Blog</a></li>
                <li><a href="/faq" className="text-sm hover:text-[#3EB489]">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="/terms" className="text-sm hover:text-[#3EB489]">Terms of Service</a></li>
                <li><a href="/privacy" className="text-sm hover:text-[#3EB489]">Privacy Policy</a></li>
                <li><a href="/cookies" className="text-sm hover:text-[#3EB489]">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-700 mt-8 pt-8 text-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} Mintenance. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
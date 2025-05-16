import React from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, Calendar, MessageSquare, Search, MapPin, User } from 'lucide-react';

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // If user is authenticated, redirect to the appropriate dashboard
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === 'contractor') {
        navigate('/contractor-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 py-16 flex flex-col lg:flex-row items-center justify-between">
          <div className="lg:w-1/2 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Home Maintenance Made Easy
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Mintenance connects homeowners with skilled contractors for all your home repair and maintenance needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                className="bg-white text-primary hover:bg-white/90"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => {
                  const servicesSection = document.getElementById('services');
                  servicesSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-white text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <Card className="w-full max-w-md bg-white shadow-lg border-0 transform rotate-1">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Plumbing Repair</h3>
                    <p className="text-sm text-gray-500">Status: In Progress</p>
                  </div>
                </div>
                <div className="mb-4 flex gap-2 text-sm">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="text-gray-600">123 Main St</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="text-gray-600">Today, 2:30 PM</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="h-20 bg-gray-100 rounded-md"></div>
                  <div className="h-20 bg-gray-100 rounded-md"></div>
                </div>
                <Button className="w-full">View Details</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div id="services" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How Mintenance Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Request a Service</h3>
              <p className="text-gray-600">
                Describe your home maintenance needs and our platform will match you with the right professionals.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Schedule Appointments</h3>
              <p className="text-gray-600">
                Find a time that works for you with our easy-to-use scheduling system that syncs with your calendar.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">
                Stay updated on your service request with real-time notifications and detailed job sheets.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of homeowners and contractors who use Mintenance to simplify home maintenance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-primary/90"
            >
              <User className="mr-2 h-5 w-5" />
              Log in with Replit
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Mintenance</h3>
              <p className="text-gray-400">
                Connecting homeowners with skilled contractors for all your maintenance needs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Plumbing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Electrical</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">HVAC</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Carpentry</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Mintenance. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
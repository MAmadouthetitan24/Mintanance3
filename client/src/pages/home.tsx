import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Trade } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Star, CheckCircle, Shield, Clock } from "lucide-react";
import ServiceCategories from "@/components/shared/ServiceCategories";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  
  // Fetch trades
  const { data: trades, isLoading: isLoadingTrades } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
    staleTime: Infinity, // This data rarely changes
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto">
            Professional Home Maintenance & Repair Services
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-primary-100">
            Connect with qualified contractors for all your home repair needs in just a few clicks.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-primary-700 hover:bg-gray-100"
              asChild
            >
              <Link href={isAuthenticated ? "/job-request" : "/register"}>
                {isAuthenticated ? "Submit a Job Request" : "Sign Up Now"}
              </Link>
            </Button>
            {!isAuthenticated && (
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-primary-600"
                asChild
              >
                <Link href="/login">
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How HomeFixr Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-file-list-3-line text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Submit a Request</h3>
              <p className="text-gray-600">
                Describe your home maintenance issue and upload photos to help contractors understand the job.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-user-search-line text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Get Matched</h3>
              <p className="text-gray-600">
                Our system automatically matches you with qualified contractors in your area.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-hammer-line text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Get It Fixed</h3>
              <p className="text-gray-600">
                Schedule the appointment, get the work done, and sign off on the completed job.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button asChild>
              <Link href={isAuthenticated ? "/job-request" : "/register"}>
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-6">Our Services</h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12">
            From plumbing and electrical to painting and landscaping, we connect you with professionals for all your home maintenance needs.
          </p>
          
          <ServiceCategories trades={trades} isLoading={isLoadingTrades} />
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose HomeFixr</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <div className="mr-4 bg-primary-100 p-3 rounded-full text-primary-600">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Quality Professionals</h3>
                <p className="text-gray-600">
                  We vet all contractors on our platform to ensure you receive high-quality service from experienced professionals.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 bg-primary-100 p-3 rounded-full text-primary-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Verified Reviews</h3>
                <p className="text-gray-600">
                  Every review on our platform comes from real customers who have had work completed, helping you make informed decisions.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 bg-primary-100 p-3 rounded-full text-primary-600">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
                <p className="text-gray-600">
                  Our platform ensures your information is protected, with clear documentation of all work performed.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 bg-primary-100 p-3 rounded-full text-primary-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Efficient Scheduling</h3>
                <p className="text-gray-600">
                  Smart scheduling tools help you find the perfect time slot that works for both you and your contractor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-secondary-700 to-secondary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get your home repairs done right?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto text-secondary-100">
            Join thousands of homeowners who trust HomeFixr for their maintenance needs.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-secondary-700 hover:bg-gray-100"
            asChild
          >
            <Link href={isAuthenticated ? "/job-request" : "/register"}>
              {isAuthenticated ? "Submit a Job Request" : "Sign Up Now"}
            </Link>
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold mb-4">HomeFixr</h3>
              <p className="text-gray-400 max-w-xs">
                Connecting homeowners with skilled contractors for quality home maintenance and repair services.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Plumbing</li>
                  <li>Electrical</li>
                  <li>Painting</li>
                  <li>Landscaping</li>
                  <li>HVAC</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>About Us</li>
                  <li>How It Works</li>
                  <li>For Contractors</li>
                  <li>Blog</li>
                  <li>Contact</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Terms of Service</li>
                  <li>Privacy Policy</li>
                  <li>Cookie Policy</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} HomeFixr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

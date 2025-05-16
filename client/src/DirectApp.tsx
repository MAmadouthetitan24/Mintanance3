import React from 'react';

const DirectApp = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-[#004080] font-bold text-xl">Mintenance</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <a href="#features" className="text-[#6C757D] hover:text-[#004080] px-3 py-2 text-sm font-medium">Features</a>
              <a href="#services" className="text-[#6C757D] hover:text-[#004080] px-3 py-2 text-sm font-medium">Services</a>
              <a href="#how-it-works" className="text-[#6C757D] hover:text-[#004080] px-3 py-2 text-sm font-medium">How It Works</a>
              <button className="text-[#004080] hover:bg-[#004080] hover:text-white border border-[#004080] px-4 py-2 rounded-md text-sm font-medium">Login</button>
              <button className="bg-[#3EB489] text-white hover:bg-[#30A070] px-4 py-2 rounded-md text-sm font-medium">Sign Up</button>
            </div>
            
            <div className="md:hidden flex items-center">
              <button className="text-[#6C757D] hover:text-[#004080]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#004080] to-[#3EB489] py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Mintenance
          </h1>
          <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
            Your on-demand marketplace for home maintenance and repairs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 rounded-full bg-white text-[#004080] font-medium text-lg hover:bg-gray-100 transition">
              Request a Service
            </button>
            <button className="px-6 py-3 rounded-full bg-[#004080] text-white font-medium text-lg border border-white hover:bg-[#003070] transition">
              Join as a Contractor
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#004080] mb-12">
            How Mintenance Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-16 h-16 bg-[#3EB489] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold text-[#004080] mb-3">Request Service</h3>
              <p className="text-[#6C757D]">
                Describe your home maintenance needs and upload photos to help contractors understand the job.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-16 h-16 bg-[#3EB489] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold text-[#004080] mb-3">Get Matched</h3>
              <p className="text-[#6C757D]">
                Our algorithm instantly finds qualified contractors near you based on your service needs.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-16 h-16 bg-[#3EB489] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold text-[#004080] mb-3">Job Complete</h3>
              <p className="text-[#6C757D]">
                The contractor arrives, completes the work, and you approve with a digital signature.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div id="services" className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#004080] mb-12">
            Our Services
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {name: "Plumbing", icon: "🔧"},
              {name: "Electrical", icon: "⚡"},
              {name: "Carpentry", icon: "🪚"},
              {name: "Painting", icon: "🖌️"},
              {name: "HVAC", icon: "❄️"},
              {name: "Roofing", icon: "🏠"},
              {name: "Landscaping", icon: "🌿"},
              {name: "Appliance Repair", icon: "🧰"}
            ].map((service, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition border border-gray-100 cursor-pointer">
                <div className="text-3xl mb-2">{service.icon}</div>
                <h3 className="font-medium text-[#004080]">{service.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uber-like Features */}
      <div id="features" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#004080] mb-12">
            Uber-like Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-[#3EB489] rounded-full flex items-center justify-center text-white mr-4">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#004080] mb-2">Real-time Matching</h3>
                <p className="text-[#6C757D]">
                  Instantly connect with available contractors in your area, just like ordering a ride.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-[#3EB489] rounded-full flex items-center justify-center text-white mr-4">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#004080] mb-2">Live Tracking</h3>
                <p className="text-[#6C757D]">
                  Track your contractor's location and status in real-time as they travel to your home.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-[#3EB489] rounded-full flex items-center justify-center text-white mr-4">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#004080] mb-2">Two-way Rating System</h3>
                <p className="text-[#6C757D]">
                  Rate contractors after service completion, and contractors can rate homeowners for better matchmaking.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-[#3EB489] rounded-full flex items-center justify-center text-white mr-4">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#004080] mb-2">Job Acceptance</h3>
                <p className="text-[#6C757D]">
                  Contractors can quickly view job details and accept or reject requests based on availability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#004080] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
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
                <li><a href="#" className="text-sm hover:text-[#3EB489]">About Us</a></li>
                <li><a href="#" className="text-sm hover:text-[#3EB489]">Services</a></li>
                <li><a href="#" className="text-sm hover:text-[#3EB489]">Contact</a></li>
                <li><a href="#" className="text-sm hover:text-[#3EB489]">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm hover:text-[#3EB489]">For Contractors</a></li>
                <li><a href="#" className="text-sm hover:text-[#3EB489]">For Homeowners</a></li>
                <li><a href="#" className="text-sm hover:text-[#3EB489]">Blog</a></li>
                <li><a href="#" className="text-sm hover:text-[#3EB489]">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm hover:text-[#3EB489]">Terms of Service</a></li>
                <li><a href="#" className="text-sm hover:text-[#3EB489]">Privacy Policy</a></li>
                <li><a href="#" className="text-sm hover:text-[#3EB489]">Cookie Policy</a></li>
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

export default DirectApp;
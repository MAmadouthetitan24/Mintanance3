import React from 'react';

const SimpleLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-[#004080] font-bold text-xl">Mintenance</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <a href="#" className="text-[#6C757D] hover:text-[#004080] px-3 py-2 text-sm font-medium">About</a>
              <a href="#" className="text-[#6C757D] hover:text-[#004080] px-3 py-2 text-sm font-medium">Services</a>
              <a href="#" className="text-[#6C757D] hover:text-[#004080] px-3 py-2 text-sm font-medium">Contact</a>
              <a href="#" className="text-[#004080] hover:bg-[#004080] hover:text-white border border-[#004080] px-4 py-2 rounded-md text-sm font-medium">Login</a>
              <a href="#" className="bg-[#3EB489] text-white hover:bg-[#30A070] px-4 py-2 rounded-md text-sm font-medium">Sign Up</a>
            </div>
          </div>
        </div>
      </header>

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
      <div className="py-16 px-4 bg-white">
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
      <div className="py-16 px-4 bg-gray-50">
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

      {/* Features for Uber-like Functionality */}
      <div className="py-16 px-4 bg-white">
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

      {/* For Homeowners Section */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#004080] mb-12">
            For Homeowners
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-[#3EB489] text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-[#004080] mb-3">Detailed Job Requests</h3>
              <p className="text-[#6C757D]">
                Submit comprehensive job requests with descriptions and photo uploads to help contractors understand exactly what you need.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-[#3EB489] text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-[#004080] mb-3">Contractor Profiles</h3>
              <p className="text-[#6C757D]">
                View detailed contractor profiles including ratings, reviews, and work history before approving the assignment.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-[#3EB489] text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-[#004080] mb-3">In-app Messaging</h3>
              <p className="text-[#6C757D]">
                Communicate directly with your assigned contractor through our secure messaging system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* For Contractors Section */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#004080] mb-12">
            For Contractors
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="text-[#3EB489] text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-[#004080] mb-3">Mobile-Friendly Interface</h3>
              <p className="text-[#6C757D]">
                Receive and manage job requests on-the-go with our mobile-optimized platform.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="text-[#3EB489] text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-[#004080] mb-3">Calendar Integration</h3>
              <p className="text-[#6C757D]">
                Sync with external calendars and manage your schedule efficiently to maximize your earning potential.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="text-[#3EB489] text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-[#004080] mb-3">Earnings Dashboard</h3>
              <p className="text-[#6C757D]">
                Track your jobs, hours, and earnings with detailed analytics and reporting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#004080] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Mintenance</h2>
            <p className="mb-6">Your on-demand home maintenance solution</p>
            <p className="text-sm">© 2025 Mintenance. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleLanding;
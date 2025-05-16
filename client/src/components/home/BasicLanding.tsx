import React from 'react';
import MainLayout from '../layout/MainLayout';

const BasicLanding: React.FC = () => {
  return (
    <MainLayout title="Home Maintenance & Repair Marketplace">
      <div className="bg-white">
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

      {/* Features */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#004080] mb-12">
            Key Features
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
                <h3 className="text-xl font-semibold text-[#004080] mb-2">Secure Messaging</h3>
                <p className="text-[#6C757D]">
                  Communicate directly with your matched contractor through our in-app messaging system.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-[#3EB489] rounded-full flex items-center justify-center text-white mr-4">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#004080] mb-2">Status Tracking</h3>
                <p className="text-[#6C757D]">
                  Monitor your contractor's status in real-time, from acceptance to arrival to completion.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-[#3EB489] rounded-full flex items-center justify-center text-white mr-4">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#004080] mb-2">Digital Job Sheets</h3>
                <p className="text-[#6C757D]">
                  Receive detailed digital documentation of all work performed, with photos and your approval signature.
                </p>
              </div>
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
    </MainLayout>
  );
};

export default BasicLanding;
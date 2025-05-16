import React from 'react';

const SimpleLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">HomeFixr</h1>
          <p className="text-lg text-gray-700">
            Your trusted marketplace for home maintenance and repair services
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">For Homeowners</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Submit service requests
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Find qualified contractors
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Schedule appointments
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Track job progress
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">For Contractors</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Find new clients
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Manage job requests
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Organize your schedule
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Build your reputation
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Key Features</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Smart contractor matching
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                In-app messaging
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Digital job sheets
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Secure payment processing
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">1</div>
              <h3 className="font-medium text-gray-800">Submit Request</h3>
              <p className="text-sm text-gray-600">Describe your service needs</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">2</div>
              <h3 className="font-medium text-gray-800">Match with Pros</h3>
              <p className="text-sm text-gray-600">Our algorithm finds the best contractors</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">3</div>
              <h3 className="font-medium text-gray-800">Schedule Service</h3>
              <p className="text-sm text-gray-600">Book a time that works for you</p>
            </div>
            <div className="text-center p-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">4</div>
              <h3 className="font-medium text-gray-800">Job Complete</h3>
              <p className="text-sm text-gray-600">Rate and review your experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLandingPage;
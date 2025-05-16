import React from 'react';

export default function SimpleApp() {
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
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
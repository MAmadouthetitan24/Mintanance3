import { Link } from "wouter";
import type { Trade } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceCategoriesProps {
  trades: Trade[] | undefined;
  isLoading: boolean;
}

export default function ServiceCategories({ trades, isLoading }: ServiceCategoriesProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">Services</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array(6).fill(0).map((_, index) => (
            <div key={index} className="bg-white shadow rounded-lg p-4 text-center">
              <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          ))
        ) : trades && trades.length > 0 ? (
          // Actual trades
          trades.map((trade) => (
            <Link key={trade.id} href={`/job-request?trade=${trade.id}`}>
              <div className="bg-white shadow rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className={`${trade.icon || 'ri-tools-line'} text-primary-600 text-xl`}></i>
                </div>
                <p className="text-sm font-medium text-gray-800">{trade.name}</p>
              </div>
            </Link>
          ))
        ) : (
          // Fallback when no trades are available
          <>
            <div className="bg-white shadow rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-hammer-line text-primary-600 text-xl"></i>
              </div>
              <p className="text-sm font-medium text-gray-800">Plumbing</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-plug-2-line text-primary-600 text-xl"></i>
              </div>
              <p className="text-sm font-medium text-gray-800">Electrical</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-brush-line text-primary-600 text-xl"></i>
              </div>
              <p className="text-sm font-medium text-gray-800">Painting</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-scissors-line text-primary-600 text-xl"></i>
              </div>
              <p className="text-sm font-medium text-gray-800">Landscaping</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-heating-line text-primary-600 text-xl"></i>
              </div>
              <p className="text-sm font-medium text-gray-800">HVAC</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-more-line text-primary-600 text-xl"></i>
              </div>
              <p className="text-sm font-medium text-gray-800">More</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

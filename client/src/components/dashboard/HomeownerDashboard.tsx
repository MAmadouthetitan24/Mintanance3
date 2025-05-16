import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Job, Trade, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, getJobStatusColor, getJobStatusText, getTimeAgo } from "@/lib/utils";
import ServiceCategories from "@/components/shared/ServiceCategories";

interface HomeownerDashboardProps {
  user: User;
}

export default function HomeownerDashboard({ user }: HomeownerDashboardProps) {
  // Fetch active jobs
  const { data: jobs, isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch trades/service categories
  const { data: trades, isLoading: isLoadingTrades } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
    staleTime: Infinity, // This data rarely changes
  });
  
  // Filter active jobs
  const activeJobs = jobs?.filter(job => 
    job.status !== 'completed' && job.status !== 'cancelled'
  ) || [];
  
  // Get completed jobs
  const completedJobs = jobs?.filter(job => 
    job.status === 'completed'
  ).sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 5) || [];
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="rounded-xl bg-gradient-to-r from-primary-700 to-primary-800 shadow-lg mb-6">
          <div className="p-6 sm:p-8 md:flex md:items-center md:justify-between">
            <div className="md:max-w-lg">
              <h1 className="text-white font-heading font-semibold text-2xl sm:text-3xl mb-2">
                Welcome back, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-primary-100 text-sm sm:text-base">
                Find qualified professionals for your home repair needs.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:ml-6">
              <Button asChild className="bg-white hover:bg-gray-100 text-primary-800 font-medium shadow-sm">
                <Link href="/job-request">
                  <i className="ri-add-line mr-2"></i>
                  New Job Request
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Active Jobs Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-gray-900">Active Jobs</h2>
            <Link href="/jobs" className="text-primary-600 text-sm font-medium hover:text-primary-700">
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingJobs ? (
              // Loading skeletons
              Array(2).fill(0).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-6 w-48 mb-1" />
                  <Skeleton className="h-5 w-40 mb-3" />
                  <div className="flex items-center mb-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="ml-3">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-20 mt-1" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              ))
            ) : activeJobs.length > 0 ? (
              activeJobs.map(job => (
                <div key={job.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`status-pill ${getJobStatusColor(job.status).bgColor} ${getJobStatusColor(job.status).textColor}`}>
                        {getJobStatusText(job.status)}
                      </span>
                      <span className="text-sm text-gray-500">{getTimeAgo(job.createdAt)}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {job.scheduledDate 
                        ? `Scheduled for ${new Date(job.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                        : job.preferredDate ? `Preferred date: ${job.preferredDate}, ${job.preferredTime}` : 'No date scheduled yet'
                      }
                    </p>
                    
                    {job.contractorId ? (
                      <div className="flex items-center mb-4">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary-100 text-primary-700">
                            {getInitials(job.contractorName || 'C')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{job.contractorName || 'Assigned Contractor'}</p>
                          <div className="flex items-center">
                            <i className="ri-star-fill text-yellow-400 text-sm"></i>
                            <span className="text-xs text-gray-500 ml-1">4.8 (124 reviews)</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center mb-4">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <i className="ri-user-search-line text-gray-400"></i>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">Finding contractors...</p>
                          <p className="text-xs text-gray-500">Matching in progress</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {job.contractorId && (
                        <Button variant="outline" className="flex-1">
                          <i className="ri-message-3-line mr-1"></i> Message
                        </Button>
                      )}
                      <Button className="flex-1 bg-primary-600 hover:bg-primary-700" asChild>
                        <Link href={`/job-detail/${job.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                <div className="mb-4 mx-auto w-16 h-16 bg-primary-50 flex items-center justify-center rounded-full">
                  <i className="ri-file-list-3-line text-2xl text-primary-600"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No active jobs</h3>
                <p className="text-gray-500 mb-4">You don't have any active jobs at the moment.</p>
                <Button asChild>
                  <Link href="/job-request">Create Your First Job Request</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Service Categories */}
        <ServiceCategories trades={trades} isLoading={isLoadingTrades} />

        {/* Recent Jobs */}
        {completedJobs.length > 0 && (
          <div>
            <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">Recent Jobs</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
              <ul role="list" className="divide-y divide-gray-200">
                {completedJobs.map(job => (
                  <li key={job.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {job.photos && job.photos.length > 0 ? (
                              <img 
                                className="h-12 w-12 rounded-md object-cover" 
                                src={job.photos[0]} 
                                alt="Job preview" 
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                                <i className="ri-tools-line text-gray-400 text-xl"></i>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">{job.title}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <i className="ri-map-pin-line mr-1 text-gray-400"></i>
                              <p>{job.location || 'No location specified'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span className="status-pill bg-green-100 text-green-800">Completed</span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <i className="ri-user-line mr-1 text-gray-400"></i>
                            {job.contractorName || 'Contractor Name'}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <i className="ri-star-fill mr-1 text-yellow-400"></i>
                            {job.contractorRating || '5.0'}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <i className="ri-calendar-line mr-1 text-gray-400"></i>
                          <p>
                            Completed on {new Date(job.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

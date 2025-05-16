import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Job, ScheduleSlot, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, formatCurrency, formatDate, getJobStatusColor, getJobStatusText } from "@/lib/utils";

interface ContractorDashboardProps {
  user: User;
}

export default function ContractorDashboard({ user }: ContractorDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Fetch jobs for this contractor
  const { data: jobs, isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch schedule slots
  const { data: scheduleSlots, isLoading: isLoadingSchedule } = useQuery<ScheduleSlot[]>({
    queryKey: [`/api/schedule-slots/contractor/${user.id}`],
    staleTime: 60000, // 1 minute
  });
  
  // Filter jobs for today's schedule
  const todaySchedule = scheduleSlots?.filter(slot => {
    const slotDate = new Date(slot.startTime);
    return (
      slotDate.getDate() === selectedDate.getDate() &&
      slotDate.getMonth() === selectedDate.getMonth() &&
      slotDate.getFullYear() === selectedDate.getFullYear()
    );
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];
  
  // Get job details for each slot
  const scheduledJobs = todaySchedule.map(slot => {
    if (!slot.jobId) return { ...slot, job: null };
    const job = jobs?.find(j => j.id === slot.jobId);
    return { ...slot, job };
  });
  
  // Filter new job requests
  const newJobRequests = jobs?.filter(job => 
    job.status === 'matched' && job.contractorId === user.id
  ) || [];
  
  // Filter upcoming jobs (scheduled but not completed)
  const upcomingJobs = jobs?.filter(job =>
    ['scheduled', 'in_progress'].includes(job.status) && job.contractorId === user.id
  ).sort((a, b) => {
    if (!a.scheduledDate || !b.scheduledDate) return 0;
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  }).slice(0, 5) || [];
  
  // Calculate earnings summary from completed jobs
  const completedJobs = jobs?.filter(job => 
    job.status === 'completed' && job.contractorId === user.id
  ) || [];
  
  const getEarningsSummary = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const weekEarnings = completedJobs
      .filter(job => new Date(job.updatedAt) >= weekStart)
      .reduce((sum, job) => sum + (job.actualCost || 0), 0);
    
    const monthEarnings = completedJobs
      .filter(job => new Date(job.updatedAt) >= monthStart)
      .reduce((sum, job) => sum + (job.actualCost || 0), 0);
    
    const monthJobsCount = completedJobs
      .filter(job => new Date(job.updatedAt) >= monthStart)
      .length;
    
    return {
      weekEarnings,
      monthEarnings,
      monthJobsCount
    };
  };
  
  const earnings = getEarningsSummary();
  
  // Handle date navigation
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Contractor Welcome Banner */}
        <div className="rounded-xl bg-gradient-to-r from-secondary-700 to-secondary-800 shadow-lg mb-6">
          <div className="p-6 sm:p-8 md:flex md:items-center md:justify-between">
            <div className="md:max-w-lg">
              <h1 className="text-white font-heading font-semibold text-2xl sm:text-3xl mb-2">
                Welcome, {user.name.split(' ')[0]}
              </h1>
              <p className="text-secondary-100 text-sm sm:text-base">
                You have {newJobRequests.length} new job requests and {upcomingJobs.length} upcoming jobs.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:ml-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-full p-1 px-3 flex items-center text-secondary-800">
                  <div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Online</span>
                </div>
                <Button asChild className="bg-white hover:bg-gray-100 text-secondary-800 font-medium shadow-sm">
                  <Link href="/calendar">
                    <i className="ri-calendar-2-line mr-2"></i>
                    Calendar
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-gray-900">Today's Schedule</h2>
            <div className="flex items-center text-sm">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => changeDate(-1)}
              >
                <i className="ri-arrow-left-s-line"></i>
              </Button>
              <span className="font-medium">{selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => changeDate(1)}
              >
                <i className="ri-arrow-right-s-line"></i>
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoadingSchedule ? (
              <div className="divide-y divide-gray-200">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="p-4 flex">
                    <div className="flex-shrink-0 w-20">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-10 mt-1" />
                    </div>
                    <div className="flex-1 ml-4 pl-4">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-5 w-40 mb-3" />
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-5 w-24 ml-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : scheduledJobs.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {scheduledJobs.map((slot, index) => (
                  <div key={index} className="p-4 flex">
                    <div className="flex-shrink-0 w-20 flex flex-col items-center justify-center">
                      <span className="text-lg font-semibold text-gray-900">
                        {new Date(slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[0]}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(slot.startTime).toLocaleTimeString('en-US', { hour12: true }).split(' ')[1]}
                      </span>
                    </div>
                    <div className={`flex-1 ml-4 border-l-4 pl-4 ${slot.job ? (slot.job.status === 'in_progress' ? 'border-secondary-500' : 'border-gray-300') : 'border-gray-300'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-medium text-gray-900">
                            {slot.job ? slot.job.title : 'Available Slot'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {slot.job ? slot.job.location || 'No location specified' : 'No job assigned'}
                          </p>
                        </div>
                        {slot.job && (
                          <span className={`status-pill ${getJobStatusColor(slot.job.status).bgColor} ${getJobStatusColor(slot.job.status).textColor}`}>
                            {getJobStatusText(slot.job.status)}
                          </span>
                        )}
                      </div>
                      {slot.job && (
                        <div className="mt-2 flex items-center">
                          <div className="flex-shrink-0">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gray-200">
                                {getInitials(slot.job.homeownerName || 'C')}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="ml-2">
                            <p className="text-sm font-medium text-gray-900">
                              {slot.job.homeownerName || 'Homeowner'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <i className="ri-calendar-line text-xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments scheduled</h3>
                <p className="text-gray-500 text-sm">
                  You don't have any appointments scheduled for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* New Job Requests Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-gray-900">New Job Requests</h2>
            <Link href="/jobs" className="text-secondary-600 text-sm font-medium hover:text-secondary-700">
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
                  <Skeleton className="h-32 w-full rounded-lg mb-3" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              ))
            ) : newJobRequests.length > 0 ? (
              newJobRequests.map(job => (
                <div key={job.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="status-pill bg-accent-100 text-accent-800">New Request</span>
                      <span className="text-sm text-gray-500">{new Date(job.createdAt).toLocaleDateString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {job.location ? `${job.location} · ` : ''}
                      {job.estimatedDuration ? `Est. ${Math.round(job.estimatedDuration / 60)} hours` : 'Duration not specified'}
                    </p>
                    
                    <div className="relative mb-3 overflow-hidden rounded-lg h-32">
                      {job.photos && job.photos.length > 0 ? (
                        <img 
                          src={job.photos[0]} 
                          alt={job.title} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                          <i className="ri-tools-line text-gray-400 text-3xl"></i>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {job.description}
                    </p>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1">
                        Decline
                      </Button>
                      <Button className="flex-1 bg-secondary-600 hover:bg-secondary-700 text-white" asChild>
                        <Link href={`/job-detail/${job.id}`}>
                          Accept & Quote
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                <div className="mb-4 mx-auto w-16 h-16 bg-secondary-50 flex items-center justify-center rounded-full">
                  <i className="ri-file-list-3-line text-2xl text-secondary-600"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No new job requests</h3>
                <p className="text-gray-500 mb-4">You don't have any new job requests at the moment.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Upcoming Jobs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-gray-900">Upcoming Jobs</h2>
            <Link href="/calendar" className="text-secondary-600 text-sm font-medium hover:text-secondary-700">
              View Calendar
            </Link>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {isLoadingJobs ? (
              <ul className="divide-y divide-gray-200">
                {[1, 2].map((_, index) => (
                  <li key={index} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center">
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-40 mb-2" />
                        <div className="mt-2 flex">
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                      <div>
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-32 mt-1" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : upcomingJobs.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {upcomingJobs.map(job => (
                  <li key={job.id}>
                    <Link href={`/job-detail/${job.id}`}>
                      <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50 cursor-pointer">
                        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <div className="flex text-sm">
                              <p className="font-medium text-secondary-600 truncate">{job.title}</p>
                              <p className="ml-1 flex-shrink-0 font-normal text-gray-500">for {job.homeownerName || 'Homeowner'}</p>
                            </div>
                            <div className="mt-2 flex">
                              <div className="flex items-center text-sm text-gray-500">
                                <i className="ri-map-pin-line flex-shrink-0 mr-1.5 text-gray-400"></i>
                                <p>{job.location || 'No location specified'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                            <div className="flex flex-col text-right text-sm text-gray-500">
                              <p className="font-medium">
                                {job.scheduledDate 
                                  ? new Date(job.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                  : 'Not scheduled'}
                              </p>
                              <p>
                                {job.scheduledDate
                                  ? new Date(job.scheduledDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                                  : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-5 flex-shrink-0">
                          <i className="ri-arrow-right-s-line text-gray-400"></i>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No upcoming jobs scheduled</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Earnings Summary */}
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">Earnings Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">This Week</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(earnings.weekEarnings)}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="ri-line-chart-line text-green-600 text-xl"></i>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-green-600 font-medium flex items-center">
                  <i className="ri-arrow-up-s-line mr-1"></i> 12% 
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last week</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">This Month</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(earnings.monthEarnings)}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="ri-calendar-line text-blue-600 text-xl"></i>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-green-600 font-medium flex items-center">
                  <i className="ri-arrow-up-s-line mr-1"></i> 8% 
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Jobs Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">{earnings.monthJobsCount}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <i className="ri-task-line text-purple-600 text-xl"></i>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-600 font-medium flex items-center">
                  This Month
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  {completedJobs.length > 0 
                    ? `(${Math.round(completedJobs.reduce((sum, job) => sum + (job.rating || 5), 0) / completedJobs.length * 10) / 10}% satisfaction)`
                    : '(No reviews yet)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

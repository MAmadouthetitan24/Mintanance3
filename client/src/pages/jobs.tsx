import { useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import JobCard from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, PlusCircle } from "lucide-react";
import type { Job } from "@shared/schema";

export default function Jobs() {
  const { user, isReady } = useRequireAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  
  // Fetch user's jobs
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
    staleTime: 60000, // 1 minute
  });
  
  if (!isReady || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Filter and categorize jobs
  const filterJobs = (status: 'active' | 'completed' | 'all') => {
    if (!jobs) return [];
    
    let filteredJobs = jobs;
    
    // Filter by status
    if (status === 'active') {
      filteredJobs = jobs.filter(job => 
        job.status !== 'completed' && job.status !== 'cancelled'
      );
    } else if (status === 'completed') {
      filteredJobs = jobs.filter(job => 
        job.status === 'completed' || job.status === 'cancelled'
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(term) || 
        job.description.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term)
      );
    }
    
    // Sort by creation date (newest first)
    return filteredJobs.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date();
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date();
      return dateB.getTime() - dateA.getTime();
    });
  };
  
  const activeJobs = filterJobs('active');
  const completedJobs = filterJobs('completed');
  const allJobs = filterJobs('all');
  
  return (
    <MainLayout title="My Jobs">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold">My Jobs</h1>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search jobs..."
                  className="pl-9 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {user.role === "homeowner" && (
                <Button asChild>
                  <Link href="/job-request">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Job Request
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          <Tabs defaultValue="active" onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="active">
                Active Jobs {activeJobs.length > 0 && `(${activeJobs.length})`}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed Jobs {completedJobs.length > 0 && `(${completedJobs.length})`}
              </TabsTrigger>
              <TabsTrigger value="all">
                All Jobs {allJobs.length > 0 && `(${allJobs.length})`}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading jobs...</p>
                </div>
              ) : activeJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      userRole={user.role as "homeowner" | "contractor"} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
                  <div className="mx-auto w-16 h-16 bg-primary-50 flex items-center justify-center rounded-full mb-4">
                    <Search className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active jobs</h3>
                  {user.role === "homeowner" ? (
                    <>
                      <p className="text-gray-500 mb-6">Submit a new job request to get started.</p>
                      <Button asChild>
                        <Link href="/job-request">Submit Job Request</Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-gray-500">You don't have any active jobs at the moment.</p>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading jobs...</p>
                </div>
              ) : completedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      userRole={user.role as "homeowner" | "contractor"} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
                  <div className="mx-auto w-16 h-16 bg-primary-50 flex items-center justify-center rounded-full mb-4">
                    <Search className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed jobs</h3>
                  <p className="text-gray-500">Completed jobs will appear here.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading jobs...</p>
                </div>
              ) : allJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      userRole={user.role as "homeowner" | "contractor"} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
                  <div className="mx-auto w-16 h-16 bg-primary-50 flex items-center justify-center rounded-full mb-4">
                    <Search className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  {user.role === "homeowner" ? (
                    <>
                      <p className="text-gray-500 mb-6">Submit a new job request to get started.</p>
                      <Button asChild>
                        <Link href="/job-request">Submit Job Request</Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-gray-500">You don't have any jobs at the moment.</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobCard } from '@/components/ui/job-card';
import { useLocation } from 'wouter';
import { Calendar, Clock, CheckCircle, Wrench, Settings, Search, Plus, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContractorDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  
  // Fetch jobs assigned to the contractor
  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ['/api/jobs/contractor'],
    enabled: !!user?.id,
  });
  
  // Fetch upcoming appointments
  const { data: scheduleSlots, isLoading: isSlotsLoading } = useQuery({
    queryKey: ['/api/scheduling/schedule-slots'],
    enabled: !!user?.id,
  });
  
  // Fetch appointment proposals
  const { data: proposals, isLoading: isProposalsLoading } = useQuery({
    queryKey: ['/api/scheduling/appointment-proposals'],
    enabled: !!user?.id,
  });
  
  // Count statistics
  const counts = {
    activeJobs: jobs?.filter(job => ['matched', 'scheduled', 'in_progress'].includes(job.status))?.length || 0,
    completedJobs: jobs?.filter(job => job.status === 'completed')?.length || 0,
    pendingProposals: proposals?.filter(proposal => proposal.status === 'pending')?.length || 0,
    scheduledAppointments: scheduleSlots?.filter(slot => slot.isBooked)?.length || 0
  };
  
  const filteredJobs = jobs?.filter(job => {
    // First filter by tab
    const tabFilter = 
      (activeTab === 'active' && ['matched', 'scheduled', 'in_progress'].includes(job.status)) ||
      (activeTab === 'completed' && job.status === 'completed') ||
      (activeTab === 'all');
    
    // Then filter by search query if present
    const searchFilter = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return tabFilter && searchFilter;
  });
  
  const pendingProposals = proposals?.filter(proposal => proposal.status === 'pending');
  
  if (isAuthLoading) {
    return <div className="container mx-auto p-4">Loading authentication data...</div>;
  }
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  if (user.role !== 'contractor') {
    navigate('/dashboard');
    return null;
  }
  
  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contractor Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {user.firstName || 'Contractor'}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate('/profile')}>
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-0 shadow">
            <CardContent className="flex items-center p-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                {isJobsLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-xl font-bold">{counts.activeJobs}</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-0 shadow">
            <CardContent className="flex items-center p-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Jobs</p>
                {isJobsLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-xl font-bold">{counts.completedJobs}</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-0 shadow">
            <CardContent className="flex items-center p-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Proposals</p>
                {isProposalsLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-xl font-bold">{counts.pendingProposals}</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-0 shadow">
            <CardContent className="flex items-center p-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Scheduled Appointments</p>
                {isSlotsLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-xl font-bold">{counts.scheduledAppointments}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Appointment Proposals Alert */}
      {pendingProposals && pendingProposals.length > 0 && (
        <div className="container mx-auto px-4 mb-6">
          <Card className="bg-amber-50 border-amber-200 shadow-none">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-amber-500 mr-2" />
                  <p className="text-amber-800">
                    <span className="font-medium">You have {pendingProposals.length} pending appointment proposal{pendingProposals.length !== 1 ? 's' : ''}</span> waiting for your response.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/calendar')}
                  variant="outline" 
                  className="bg-white border-amber-200 hover:bg-amber-100 text-amber-800"
                >
                  Review Proposals
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Jobs Section */}
      <div className="container mx-auto px-4">
        <Card className="bg-white border-0 shadow">
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>My Jobs</CardTitle>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search jobs..."
                    className="pl-8 w-full md:w-[200px] lg:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={() => navigate('/calendar')} variant="outline" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                  <Button onClick={() => navigate('/job-request')} className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    New Job
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-6">
            <Tabs defaultValue="active" className="mt-6" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="active" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Active Jobs
                  {counts.activeJobs > 0 && (
                    <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/10 shadow-none">
                      {counts.activeJobs}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                </TabsTrigger>
                <TabsTrigger value="all">All Jobs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-0">
                {isJobsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="border-0 shadow">
                        <CardContent className="p-0">
                          <div className="p-4">
                            <Skeleton className="h-6 w-3/4 mb-4" />
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-4 w-2/3 mb-2" />
                            <Skeleton className="h-4 w-1/4" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredJobs && filteredJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        id={job.id}
                        title={job.title}
                        tradeType={job.tradeName}
                        location={job.location}
                        status={job.status}
                        createdAt={job.createdAt}
                        scheduledFor={job.scheduledDate}
                        isContractor={true}
                        estimatedCost={job.estimatedCost}
                        actualCost={job.actualCost}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No active jobs found</h3>
                    <p className="text-gray-500 mt-1 max-w-md mx-auto">
                      You don't have any active jobs at the moment. Check back later or search for jobs in your area.
                    </p>
                    <Button onClick={() => navigate('/jobs')} className="mt-4">
                      Browse Available Jobs
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="mt-0">
                {isJobsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2].map((i) => (
                      <Card key={i} className="border-0 shadow">
                        <CardContent className="p-0">
                          <div className="p-4">
                            <Skeleton className="h-6 w-3/4 mb-4" />
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-4 w-2/3 mb-2" />
                            <Skeleton className="h-4 w-1/4" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredJobs && filteredJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        id={job.id}
                        title={job.title}
                        tradeType={job.tradeName}
                        location={job.location}
                        status={job.status}
                        createdAt={job.createdAt}
                        scheduledFor={job.scheduledDate}
                        isContractor={true}
                        estimatedCost={job.estimatedCost}
                        actualCost={job.actualCost}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No completed jobs yet</h3>
                    <p className="text-gray-500 mt-1 max-w-md mx-auto">
                      You haven't completed any jobs yet. As you finish jobs, they'll appear here.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="all" className="mt-0">
                {isJobsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="border-0 shadow">
                        <CardContent className="p-0">
                          <div className="p-4">
                            <Skeleton className="h-6 w-3/4 mb-4" />
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-4 w-2/3 mb-2" />
                            <Skeleton className="h-4 w-1/4" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredJobs && filteredJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        id={job.id}
                        title={job.title}
                        tradeType={job.tradeName}
                        location={job.location}
                        status={job.status}
                        createdAt={job.createdAt}
                        scheduledFor={job.scheduledDate}
                        isContractor={true}
                        estimatedCost={job.estimatedCost}
                        actualCost={job.actualCost}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
                    <p className="text-gray-500 mt-1 max-w-md mx-auto">
                      You don't have any jobs yet. Browse available jobs or wait for job matches based on your skills.
                    </p>
                    <Button onClick={() => navigate('/jobs')} className="mt-4">
                      Browse Available Jobs
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
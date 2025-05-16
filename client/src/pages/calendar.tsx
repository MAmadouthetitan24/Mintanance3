import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ContractorCalendar } from '@/components/scheduling/ContractorCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarClock, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function CalendarPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('appointments');

  // Determine user role
  const userRole = user?.role || 'homeowner';
  const isContractor = userRole === 'contractor';

  // Fetch upcoming appointments
  const { data: upcomingJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/jobs', userRole, 'scheduled'],
    enabled: !!user,
  });

  // For homeowners, fetch appointments with contractors
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/appointment-proposals', 'accepted'],
    enabled: !!user && userRole === 'homeowner',
  });

  // Render loading state
  if (isLoadingJobs || isLoadingAppointments) {
    return (
      <div className="container py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Calendar</h1>
          </div>
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <CalendarClock className="h-10 w-10 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p>Loading your schedule...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Calendar</h1>
          <div className="flex gap-2">
            {isContractor && (
              <Button variant="outline" onClick={() => window.location.href = '/jobs'}>
                View Available Jobs
              </Button>
            )}
            {!isContractor && (
              <Button variant="outline" onClick={() => window.location.href = '/job-request'}>
                Request New Service
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appointments">
              <Calendar className="h-4 w-4 mr-2" />
              Appointments
            </TabsTrigger>
            {isContractor ? (
              <TabsTrigger value="availability">
                <CalendarClock className="h-4 w-4 mr-2" />
                Manage Availability
              </TabsTrigger>
            ) : (
              <TabsTrigger value="history">
                <User className="h-4 w-4 mr-2" />
                Contractor Schedule
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="appointments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>
                  View and manage your scheduled appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingJobs.length === 0 ? (
                  <div className="text-center py-10">
                    <CalendarClock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium text-lg mb-2">No appointments scheduled</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      {isContractor 
                        ? "You don't have any upcoming appointments scheduled yet. Check available jobs to find work."
                        : "You haven't scheduled any appointments yet. Request a service to get started."}
                    </p>
                    {isContractor ? (
                      <Button onClick={() => window.location.href = '/jobs'}>
                        Find Jobs
                      </Button>
                    ) : (
                      <Button onClick={() => window.location.href = '/job-request'}>
                        Request Service
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingJobs.map((job: any) => (
                      <Card key={job.id} className="overflow-hidden">
                        <div className="p-4 flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-medium">{job.title}</h3>
                              <span className="text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                {job.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{job.description}</p>
                            
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Date: </span>
                                {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                              </div>
                              <div>
                                <span className="font-medium">Time: </span>
                                {job.scheduledDate ? new Date(job.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                              </div>
                              <div>
                                <span className="font-medium">Location: </span>
                                {job.location || 'Not specified'}
                              </div>
                              <div>
                                <span className="font-medium">{isContractor ? 'Client: ' : 'Contractor: '}</span>
                                {isContractor ? job.homeownerName || 'Unknown' : job.contractorName || 'Unassigned'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-row md:flex-col gap-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.location.href = `/jobs/${job.id}`}
                            >
                              View Details
                            </Button>
                            
                            {job.status === 'scheduled' && (
                              <Button 
                                size="sm"
                                onClick={() => window.location.href = `/messaging?jobId=${job.id}`}
                              >
                                Message
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="availability" className="mt-6">
            {isContractor && <ContractorCalendar />}
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contractor Schedule</CardTitle>
                <CardDescription>
                  View contractor availability for your jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <CalendarClock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium text-lg mb-2">Select a contractor</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    To view a contractor's availability, first go to your job details and select a matched contractor.
                  </p>
                  <Button onClick={() => window.location.href = '/jobs'}>
                    Go to My Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
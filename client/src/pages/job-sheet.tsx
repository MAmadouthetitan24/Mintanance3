import React, { useState, lazy, Suspense } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobSheetForm } from '@/components/job-sheets/JobSheetForm';
import { format } from 'date-fns';

// Lazily load the map component to improve initial load performance
const LocationMap = lazy(() => import('@/components/job-sheets/LocationMap'));
const PhotoGallery = lazy(() => import('@/components/job-sheets/PhotoGallery'));
import { 
  Clock, 
  MapPin, 
  FileCheck, 
  FileText, 
  FileSearch, 
  Camera, 
  Check, 
  X, 
  ArrowLeft, 
  Star, 
  Pencil,
  Printer,
  Download
} from 'lucide-react';

export default function JobSheetPage() {
  const [params] = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const jobId = parseInt(params.id);
  
  const { data: job, isLoading: isLoadingJob } = useQuery({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId,
  });
  
  const { data: jobSheet, isLoading: isLoadingJobSheet } = useQuery({
    queryKey: [`/api/job-sheets/job/${jobId}`],
    enabled: !!jobId,
  });
  
  const isContractor = user?.role === 'contractor';
  const isHomeowner = user?.role === 'homeowner';
  const isUserRelatedToJob = 
    (isContractor && job?.contractorId === user?.id) || 
    (isHomeowner && job?.homeownerId === user?.id);
  
  // Check if job sheet is complete
  const isComplete = jobSheet?.status === 'completed';
  const isInProgress = jobSheet?.status === 'in_progress';
  
  if (isLoadingJob || isLoadingJobSheet) {
    return (
      <div className="container py-10">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded-md w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-md"></div>
            <div className="h-64 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="container py-10">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Job Not Found</CardTitle>
              <CardDescription>
                The job you're looking for couldn't be found or you don't have permission to view it.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/jobs')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  // Print/Download Job Sheet
  const printJobSheet = () => {
    window.print();
  };
  
  const downloadJobSheet = () => {
    // In a real app, we would generate a PDF
    alert('This would download the job sheet as a PDF in a real app');
  };
  
  // Render job sheet details
  const renderJobSheetDetails = () => {
    if (!jobSheet) {
      return (
        <div className="text-center py-10">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium text-lg mb-2">No Job Sheet Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {isContractor 
              ? "You haven't created a job sheet for this job yet. Create one to track your work."
              : "The contractor hasn't created a job sheet for this job yet."}
          </p>
          {isContractor && (
            <Button onClick={() => setActiveTab('edit')}>
              Create Job Sheet
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-8">
        {/* Status and Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge className={`
              ${isComplete ? 'bg-green-100 text-green-800' : ''} 
              ${isInProgress ? 'bg-blue-100 text-blue-800' : ''}
              ${!isComplete && !isInProgress ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {isComplete ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
            </Badge>
            
            {jobSheet.checkInTime && (
              <span className="text-sm flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                Started: {format(new Date(jobSheet.checkInTime), 'PPp')}
              </span>
            )}
            
            {jobSheet.checkOutTime && (
              <span className="text-sm flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                Completed: {format(new Date(jobSheet.checkOutTime), 'PPp')}
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={printJobSheet}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadJobSheet}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {isContractor && !isComplete && (
              <Button 
                size="sm"
                onClick={() => setActiveTab('edit')}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
        
        {/* Check In/Out Details */}
        <Card>
          <CardHeader>
            <CardTitle>Check-In/Out Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Check-In
                </h4>
                {jobSheet.checkInTime ? (
                  <div className="text-sm">
                    <p><span className="font-medium">Time:</span> {format(new Date(jobSheet.checkInTime), 'PPp')}</p>
                    {jobSheet.checkInLocation && (
                      <div className="mt-1">
                        <p className="flex items-center mb-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="font-medium">Location:</span>
                        </p>
                        <div className="mt-2">
                          {typeof window !== 'undefined' && (
                            <Suspense fallback={
                              <div className="h-[200px] bg-gray-100 rounded-md flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">Loading map...</span>
                              </div>
                            }>
                              <LocationMap 
                                location={jobSheet.checkInLocation} 
                                title="Check-in Location" 
                                markerColor="green"
                                className="h-[200px] w-full"
                              />
                            </Suspense>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not checked in yet</p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Check-Out
                </h4>
                {jobSheet.checkOutTime ? (
                  <div className="text-sm">
                    <p><span className="font-medium">Time:</span> {format(new Date(jobSheet.checkOutTime), 'PPp')}</p>
                    {jobSheet.checkOutLocation && (
                      <div className="mt-1">
                        <p className="flex items-center mb-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="font-medium">Location:</span>
                        </p>
                        <div className="mt-2">
                          {typeof window !== 'undefined' && (
                            <Suspense fallback={
                              <div className="h-[200px] bg-gray-100 rounded-md flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">Loading map...</span>
                              </div>
                            }>
                              <LocationMap 
                                location={jobSheet.checkOutLocation} 
                                title="Check-out Location" 
                                markerColor="red"
                                className="h-[200px] w-full"
                              />
                            </Suspense>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not checked out yet</p>
                )}
              </div>
            </div>
            
            {jobSheet.checkInTime && jobSheet.checkOutTime && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Total Time on Site: </span>
                  {(() => {
                    const start = new Date(jobSheet.checkInTime);
                    const end = new Date(jobSheet.checkOutTime);
                    const diffMs = end.getTime() - start.getTime();
                    const diffHrs = Math.floor(diffMs / 1000 / 60 / 60);
                    const diffMins = Math.floor((diffMs / 1000 / 60) % 60);
                    return `${diffHrs} hours, ${diffMins} minutes`;
                  })()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Work Details */}
        <Card>
          <CardHeader>
            <CardTitle>Work Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description of Work</h4>
              <p className="text-sm whitespace-pre-line">
                {jobSheet.contractorNotes || 'No work description provided'}
              </p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Materials Used</h4>
                <p className="text-sm whitespace-pre-line">
                  {jobSheet.materialsUsed || 'None specified'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Work Hours</h4>
                <p className="text-sm">
                  {jobSheet.timeSpent || 'Not specified'}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Additional Costs</h4>
              <p className="text-sm">
                {jobSheet.additionalCosts 
                  ? `$${parseFloat(jobSheet.additionalCosts.toString()).toFixed(2)}`
                  : '$0.00'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Photos */}
        {jobSheet.photos && jobSheet.photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Photos taken during the job
              </CardDescription>
            </CardHeader>
            <CardContent>
              {typeof window !== 'undefined' && (
                <Suspense fallback={
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {jobSheet.photos.map((_, index: number) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-md flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Loading...</span>
                      </div>
                    ))}
                  </div>
                }>
                  <PhotoGallery 
                    photos={jobSheet.photos} 
                    title="" 
                    className="w-full"
                  />
                </Suspense>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Signature */}
        {jobSheet.signature && (
          <Card>
            <CardHeader>
              <CardTitle>Homeowner Verification</CardTitle>
              <CardDescription>
                Digital signature confirming work completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img 
                  src={jobSheet.signature} 
                  alt="Homeowner signature" 
                  className="max-h-[150px] mx-auto"
                />
              </div>
              <p className="text-center text-sm mt-2 text-muted-foreground">
                Signed on {jobSheet.updatedAt ? format(new Date(jobSheet.updatedAt), 'PPp') : 'Unknown date'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
  
  return (
    <div className="container py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mb-2"
                onClick={() => navigate(`/jobs/${jobId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Job
              </Button>
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <p className="text-muted-foreground mt-1">Job Sheet #{jobId}</p>
            </div>
            
            <div>
              <Badge className={`
                ${job.status === 'completed' ? 'bg-green-100 text-green-800' : ''} 
                ${job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''} 
                ${job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''} 
                ${job.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''} 
                text-sm capitalize
              `}>
                {job.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs 
          defaultValue={isContractor && !jobSheet ? 'edit' : 'details'} 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">
              <FileSearch className="h-4 w-4 mr-2" />
              Job Sheet Details
            </TabsTrigger>
            {isContractor && !isComplete && (
              <TabsTrigger value="edit">
                <FileText className="h-4 w-4 mr-2" />
                {jobSheet ? 'Edit Job Sheet' : 'Create Job Sheet'}
              </TabsTrigger>
            )}
            {!isContractor && (
              <TabsTrigger value="review" disabled={!isComplete}>
                <Star className="h-4 w-4 mr-2" />
                Review Work
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            {renderJobSheetDetails()}
          </TabsContent>
          
          <TabsContent value="edit">
            {isContractor && (
              <JobSheetForm 
                jobId={jobId} 
                job={job} 
                existingJobSheet={jobSheet}
                onSuccess={() => setActiveTab('details')} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="review">
            {isHomeowner && isComplete && (
              <Card>
                <CardHeader>
                  <CardTitle>Review the Completed Work</CardTitle>
                  <CardDescription>
                    Rate the quality of work performed and leave feedback for the contractor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="py-8 text-center">
                    <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium text-lg mb-2">Review Feature Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      The ability to review completed work will be available in a future update.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
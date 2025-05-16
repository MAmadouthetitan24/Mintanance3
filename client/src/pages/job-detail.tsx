import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Clipboard, 
  Clock, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Tool, 
  FileText, 
  ArrowLeft,
  CreditCard,
  Loader2
} from 'lucide-react';
import { PaymentButton } from '@/components/payments/PaymentButton';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch job details
  const { 
    data: job, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/jobs', jobId],
    enabled: !isNaN(jobId)
  });

  // Get contractor details if job has one assigned
  const {
    data: contractor,
    isLoading: isLoadingContractor
  } = useQuery({
    queryKey: ['/api/users', job?.contractorId],
    enabled: !!job?.contractorId
  });

  // Get homeowner details
  const {
    data: homeowner,
    isLoading: isLoadingHomeowner
  } = useQuery({
    queryKey: ['/api/users', job?.homeownerId],
    enabled: !!job?.homeownerId
  });

  // Get job sheet if exists
  const {
    data: jobSheet,
    isLoading: isLoadingJobSheet
  } = useQuery({
    queryKey: ['/api/job-sheets/job', jobId],
    enabled: !!job
  });

  const isHomeowner = user?.id === job?.homeownerId;
  const isContractor = user?.id === job?.contractorId;

  const handleBack = () => {
    navigate(isContractor ? '/contractor-dashboard' : '/dashboard');
  };

  const handleViewJobSheet = () => {
    navigate(`/job-sheet/${jobId}`);
  };

  const handleContactClick = () => {
    navigate(`/messaging?jobId=${jobId}`);
  };

  const handleScheduleClick = () => {
    navigate(`/calendar?jobId=${jobId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job || error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">The job you are looking for does not exist or you don't have permission to view it.</p>
          <Button onClick={handleBack}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Format status for display
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'matched': return 'bg-blue-100 text-blue-800'; 
      case 'scheduled': return 'bg-indigo-100 text-indigo-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormattedStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={handleBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <Card className="shadow-lg border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="text-2xl">
            {job.title}
            <Badge className={`ml-3 ${getStatusColor(job.status)}`}>
              {getFormattedStatus(job.status)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Created {job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : 'recently'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Job Details */}
          <div>
            <h3 className="text-lg font-medium mb-3">Job Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start">
                  <Clipboard className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p>{job.description}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p>{job.location || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Tool className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Service Type</p>
                    <p>{job.tradeName || 'General Maintenance'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {job.estimatedDuration && (
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Estimated Duration</p>
                      <p>{job.estimatedDuration} minutes</p>
                    </div>
                  </div>
                )}
                
                {job.scheduledDate && (
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Scheduled Date</p>
                      <p>{format(new Date(job.scheduledDate), 'PPp')}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start">
                  <CreditCard className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Cost</p>
                    <p>
                      {job.actualCost 
                        ? `$${(job.actualCost / 100).toFixed(2)} (Final)` 
                        : job.estimatedCost 
                          ? `$${(job.estimatedCost / 100).toFixed(2)} (Estimated)` 
                          : 'To be determined'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Contractor information */}
          {job.contractorId && (
            <div>
              <h3 className="text-lg font-medium mb-3">Contractor</h3>
              {isLoadingContractor ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading contractor details...</span>
                </div>
              ) : contractor ? (
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {contractor.profileImageUrl ? (
                      <img src={contractor.profileImageUrl} alt={`${contractor.firstName} ${contractor.lastName}`} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{contractor.firstName} {contractor.lastName}</h4>
                    <div className="flex text-sm text-gray-500 space-x-3">
                      {contractor.phone && (
                        <p className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {contractor.phone}
                        </p>
                      )}
                      {contractor.email && (
                        <p className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {contractor.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p>No contractor information available.</p>
              )}
            </div>
          )}
          
          {/* Job sheet */}
          {job.status === 'in_progress' || job.status === 'completed' ? (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Job Sheet</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleViewJobSheet}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {jobSheet ? 'View Job Sheet' : 'Create Job Sheet'}
                </Button>
              </div>
              {isLoadingJobSheet ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading job sheet...</span>
                </div>
              ) : jobSheet ? (
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600 mb-2">
                    Last updated: {formatDistanceToNow(new Date(jobSheet.updatedAt), { addSuffix: true })}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Status: {jobSheet.status.replace('_', ' ').toUpperCase()}</p>
                      {jobSheet.checkInTime && <p>Check-in: {format(new Date(jobSheet.checkInTime), 'PPp')}</p>}
                      {jobSheet.checkOutTime && <p>Check-out: {format(new Date(jobSheet.checkOutTime), 'PPp')}</p>}
                    </div>
                    <div>
                      {jobSheet.timeSpent && <p>Time spent: {jobSheet.timeSpent}</p>}
                      {jobSheet.additionalCosts > 0 && (
                        <p>Additional costs: ${(jobSheet.additionalCosts / 100).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No job sheet has been created yet.</p>
              )}
            </div>
          ) : null}
          
          {/* Photos */}
          {job.photos && job.photos.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {job.photos.map((photo, index) => (
                  <div key={index} className="h-24 rounded-md overflow-hidden bg-gray-100">
                    <img src={photo} alt={`Job photo ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 p-6 bg-gray-50">
          {job.status === 'matched' && (
            <Button variant="outline" onClick={handleScheduleClick} className="w-full sm:w-auto">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Job
            </Button>
          )}
          
          <Button variant="outline" onClick={handleContactClick} className="w-full sm:w-auto">
            <Mail className="mr-2 h-4 w-4" />
            {job.contractorId ? 'Message' : 'Contact Support'}
          </Button>
          
          {/* Payment button for homeowners */}
          {isHomeowner && job.status === 'completed' && (
            <PaymentButton 
              jobId={job.id} 
              isPaid={!!job.isPaid}
              className="w-full sm:w-auto sm:ml-auto"
            />
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
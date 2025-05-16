import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Calendar, ChevronLeft, CheckCircle, Clock } from "lucide-react";
import JobSheet from "./JobSheet";
import type { Job, JobSheet as JobSheetType, Quote } from "@shared/schema";
import { 
  getInitials, 
  getJobStatusColor, 
  getJobStatusText, 
  formatCurrency, 
  formatDate,
  formatDateTime
} from "@/lib/utils";

interface JobDetailProps {
  jobId: number;
  userRole: "homeowner" | "contractor";
}

export default function JobDetail({ jobId, userRole }: JobDetailProps) {
  const { toast } = useToast();
  const [quoteAmount, setQuoteAmount] = useState<string>("");
  const [quoteDescription, setQuoteDescription] = useState<string>("");
  const [quoteHours, setQuoteHours] = useState<string>("");
  
  // Fetch job details
  const { data: job, isLoading: isLoadingJob } = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
  });
  
  // Fetch job sheet if exists
  const { data: jobSheet, isLoading: isLoadingJobSheet } = useQuery<JobSheetType>({
    queryKey: [`/api/job-sheets/job/${jobId}`],
    enabled: !!job && (job.status === 'in_progress' || job.status === 'completed'),
  });
  
  // Fetch quotes for this job (for homeowners)
  const { data: quotes, isLoading: isLoadingQuotes } = useQuery<Quote[]>({
    queryKey: [`/api/quotes/job/${jobId}`],
    enabled: !!job && userRole === 'homeowner',
  });
  
  // Submit quote mutation
  const submitQuoteMutation = useMutation({
    mutationFn: async (data: { jobId: number, amount: number, description: string, estimatedDuration: number }) => {
      const res = await apiRequest("POST", "/api/quotes", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote submitted",
        description: "Your quote has been submitted successfully.",
      });
      setQuoteAmount("");
      setQuoteDescription("");
      setQuoteHours("");
      queryClient.invalidateQueries({ queryKey: [`/api/quotes/job/${jobId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit quote. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Accept quote mutation
  const acceptQuoteMutation = useMutation({
    mutationFn: async (data: { jobId: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/jobs/${data.jobId}`, { status: data.status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote accepted",
        description: "The quote has been accepted and the job is now scheduled.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to accept quote. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Handle quote submission
  const handleSubmitQuote = () => {
    if (!quoteAmount || !quoteDescription || !quoteHours) {
      toast({
        title: "Missing information",
        description: "Please fill in all quote details.",
        variant: "destructive",
      });
      return;
    }
    
    const amount = Math.round(parseFloat(quoteAmount) * 100); // Convert to cents
    if (isNaN(amount)) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }
    
    const estimatedDuration = parseInt(quoteHours) * 60; // Convert to minutes
    if (isNaN(estimatedDuration)) {
      toast({
        title: "Invalid duration",
        description: "Please enter a valid number of hours.",
        variant: "destructive",
      });
      return;
    }
    
    submitQuoteMutation.mutate({
      jobId,
      amount,
      description: quoteDescription,
      estimatedDuration,
    });
  };
  
  // Handle accepting a quote
  const handleAcceptQuote = (quoteId: number) => {
    acceptQuoteMutation.mutate({
      jobId,
      status: "scheduled",
    });
  };
  
  if (isLoadingJob) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
        <p className="mb-6">The job you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }
  
  const statusStyles = getJobStatusColor(job.status);
  const canSubmitQuote = userRole === 'contractor' && job.status === 'matched';
  const canAcceptQuote = userRole === 'homeowner' && job.status === 'matched' && quotes && quotes.length > 0;
  const canViewJobSheet = job.status === 'in_progress' || job.status === 'completed';
  
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/jobs">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Jobs
            </Link>
          </Button>
          <Badge className={`${statusStyles.bgColor} ${statusStyles.textColor}`}>
            {getJobStatusText(job.status)}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="text-gray-500">Created on {formatDate(job.createdAt)}</p>
      </div>
      
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {canSubmitQuote && <TabsTrigger value="quote">Submit Quote</TabsTrigger>}
          {canViewJobSheet && <TabsTrigger value="jobsheet">Job Sheet</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Description</h3>
                  <p className="text-gray-700 mt-2">{job.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium">Location</h3>
                    <p className="text-gray-700 mt-2">{job.location || 'No location specified'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Timing</h3>
                    <p className="text-gray-700 mt-2">
                      {job.scheduledDate 
                        ? `Scheduled for ${formatDateTime(job.scheduledDate)}`
                        : job.preferredDate 
                          ? `Preferred: ${job.preferredDate}, ${job.preferredTime}`
                          : 'No date specified'
                      }
                    </p>
                  </div>
                </div>
                
                {job.photos && job.photos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium">Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {job.photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                          <img 
                            src={photo} 
                            alt={`Job photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {userRole === 'homeowner' && job.contractorId ? (
                  <div>
                    <h3 className="text-lg font-medium">Assigned Contractor</h3>
                    <div className="flex items-center mt-2">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary-100 text-primary-700">
                          {getInitials(job.contractorName || 'C')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="font-medium">{job.contractorName || 'Assigned Contractor'}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <i className="ri-star-fill text-yellow-400 text-sm mr-1"></i>
                          <span>{job.contractorRating || '4.8'} ({job.contractorReviewCount || '0'} reviews)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex mt-4 space-x-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/messaging/${job.id}/${job.contractorId}`}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/calendar">
                          <Calendar className="h-4 w-4 mr-2" />
                          View Schedule
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : userRole === 'contractor' && job.homeownerId ? (
                  <div>
                    <h3 className="text-lg font-medium">Homeowner</h3>
                    <div className="flex items-center mt-2">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary-100 text-primary-700">
                          {getInitials(job.homeownerName || 'H')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="font-medium">{job.homeownerName || 'Homeowner'}</p>
                        <p className="text-sm text-gray-500">{job.location || 'No location specified'}</p>
                      </div>
                    </div>
                    <div className="flex mt-4 space-x-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/messaging/${job.id}/${job.homeownerId}`}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/calendar">
                          <Calendar className="h-4 w-4 mr-2" />
                          Manage Schedule
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
                
                {/* Quotes section for homeowners */}
                {userRole === 'homeowner' && (
                  <div>
                    <h3 className="text-lg font-medium">Quote{quotes && quotes.length !== 1 ? 's' : ''}</h3>
                    
                    {isLoadingQuotes ? (
                      <div className="mt-2 space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : quotes && quotes.length > 0 ? (
                      <div className="mt-2 space-y-4">
                        {quotes.map((quote) => (
                          <Card key={quote.id} className="bg-gray-50">
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-lg font-medium">{formatCurrency(quote.amount)}</p>
                                  <p className="text-sm text-gray-500">
                                    Est. {Math.round(quote.estimatedDuration / 60)} {quote.estimatedDuration / 60 === 1 ? 'hour' : 'hours'}
                                  </p>
                                </div>
                                <Badge variant={quote.status === 'accepted' ? 'default' : 'outline'}>
                                  {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-gray-700 mt-2">{quote.description}</p>
                              {quote.status === 'pending' && (
                                <Button 
                                  className="mt-4" 
                                  onClick={() => handleAcceptQuote(quote.id)}
                                  disabled={acceptQuoteMutation.isPending}
                                >
                                  {acceptQuoteMutation.isPending ? 'Accepting...' : 'Accept Quote'}
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 mt-2">No quotes received yet.</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" asChild>
                <Link href="/jobs">Back to Jobs</Link>
              </Button>
              
              {userRole === 'contractor' && job.status === 'matched' && (
                <Button onClick={() => document.querySelector('button[value="quote"]')?.click()}>
                  Submit Quote
                </Button>
              )}
              
              {userRole === 'contractor' && job.status === 'scheduled' && !jobSheet && (
                <Button asChild>
                  <Link href={`/job-detail/${job.id}#jobsheet`}>
                    Start Job Sheet
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {canSubmitQuote && (
          <TabsContent value="quote">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Quote</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="quoteAmount" className="block text-sm font-medium">
                        Quote Amount ($)
                      </label>
                      <input
                        id="quoteAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="0.00"
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="quoteHours" className="block text-sm font-medium">
                        Estimated Hours
                      </label>
                      <input
                        id="quoteHours"
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="0"
                        value={quoteHours}
                        onChange={(e) => setQuoteHours(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="quoteDescription" className="block text-sm font-medium">
                      Description of Work
                    </label>
                    <Textarea
                      id="quoteDescription"
                      placeholder="Describe the work you'll perform and any materials needed..."
                      className="min-h-[120px]"
                      value={quoteDescription}
                      onChange={(e) => setQuoteDescription(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={() => document.querySelector('button[value="details"]')?.click()}>
                  Back to Details
                </Button>
                <Button 
                  onClick={handleSubmitQuote} 
                  disabled={submitQuoteMutation.isPending}
                >
                  {submitQuoteMutation.isPending ? 'Submitting...' : 'Submit Quote'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
        
        {canViewJobSheet && (
          <TabsContent value="jobsheet">
            <JobSheet 
              jobId={jobId} 
              jobSheet={jobSheet} 
              isLoading={isLoadingJobSheet} 
              userRole={userRole}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

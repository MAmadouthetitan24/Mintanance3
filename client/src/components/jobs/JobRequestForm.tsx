import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobSchema } from "@shared/schema";
import type { InsertJob, Trade } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FileUpload from "@/components/shared/FileUpload";
import { Loader2 } from "lucide-react";

export default function JobRequestForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Fetch trades for the dropdown
  const { data: trades, isLoading: isLoadingTrades } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
    staleTime: Infinity, // This data rarely changes
  });
  
  const form = useForm<InsertJob>({
    resolver: zodResolver(insertJobSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      preferredDate: "",
      preferredTime: "",
    },
  });
  
  const onSubmit = async (data: InsertJob) => {
    setIsSubmitting(true);
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add job data
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      }
      
      // Add photos
      uploadedFiles.forEach(file => {
        formData.append("photos", file);
      });
      
      // Send the request
      const response = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to create job request");
      }
      
      const result = await response.json();
      
      toast({
        title: "Job request submitted",
        description: `Your request has been submitted successfully. ${result.matchingContractorsCount} contractors matched.`,
      });
      
      // Invalidate jobs cache
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      
      // Redirect to dashboard or jobs page
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error submitting job request:", error);
      toast({
        title: "Error",
        description: "Failed to submit job request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFileChange = (files: File[]) => {
    setUploadedFiles(files);
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Submit a New Job Request</CardTitle>
        <CardDescription>
          Provide details about the home maintenance or repair service you need
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Leaky Faucet Repair" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tradeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                    disabled={isLoadingTrades}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingTrades ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        trades?.map((trade) => (
                          <SelectItem key={trade.id} value={trade.id.toString()}>
                            {trade.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the issue in detail..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location in Home</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Kitchen, Bathroom" {...field} />
                  </FormControl>
                  <FormDescription>
                    Specify where in your home the issue is located
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferredDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="preferredTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Time</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Morning (8AM - 12PM)">Morning (8AM - 12PM)</SelectItem>
                        <SelectItem value="Afternoon (12PM - 4PM)">Afternoon (12PM - 4PM)</SelectItem>
                        <SelectItem value="Evening (4PM - 8PM)">Evening (4PM - 8PM)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormLabel>Upload Photos</FormLabel>
              <FileUpload
                maxFiles={5}
                acceptedFileTypes={["image/jpeg", "image/png", "image/gif"]}
                maxSize={10 * 1024 * 1024} // 10MB
                onFilesChange={handleFileChange}
              />
              <FormDescription>
                Upload photos of the issue to help contractors better understand the job
              </FormDescription>
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Job Request"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          Your request will be matched with qualified contractors in your area
        </p>
      </CardFooter>
    </Card>
  );
}

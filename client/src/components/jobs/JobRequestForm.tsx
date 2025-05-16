import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, ImagePlus, X } from "lucide-react";
import { format } from "date-fns";

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }).max(100),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  location: z.string().min(5, { message: "Location is required" }),
  tradeId: z.string({ required_error: "Please select a trade category" }),
  preferredDate: z.date().optional(),
  preferredTime: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function JobRequestForm() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  
  // Fetch trade categories
  const { data: trades, isLoading: isLoadingTrades } = useQuery({
    queryKey: ['/api/trades'],
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      preferredTime: "",
    },
  });
  
  const createJobMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const formData = new FormData();
      
      // Add form values
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("location", values.location);
      formData.append("tradeId", values.tradeId);
      
      if (values.preferredDate) {
        formData.append("preferredDate", format(values.preferredDate, 'yyyy-MM-dd'));
      }
      
      if (values.preferredTime) {
        formData.append("preferredTime", values.preferredTime);
      }
      
      // Add photos
      photos.forEach(photo => {
        formData.append("photos", photo);
      });
      
      return apiRequest('/api/jobs', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Job request submitted successfully",
        description: "Contractors in your area will be notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit job request",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });
  
  async function onSubmit(values: FormValues) {
    createJobMutation.mutate(values);
  }
  
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files);
      
      if (photos.length + newPhotos.length > 5) {
        toast({
          title: "Maximum 5 photos allowed",
          description: "Please remove some photos before adding more",
          variant: "destructive",
        });
        return;
      }
      
      setPhotos(prev => [...prev, ...newPhotos]);
      
      // Create preview URLs
      const newPreviews = newPhotos.map(file => URL.createObjectURL(file));
      setPhotoPreview(prev => [...prev, ...newPreviews]);
    }
  }
  
  function removePhoto(index: number) {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
    
    const newPreviews = [...photoPreview];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPhotoPreview(newPreviews);
  }
  
  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photoPreview.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Details</CardTitle>
        <CardDescription>
          Provide detailed information about the job you need help with
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
                    <Input placeholder="E.g., Leaking kitchen sink" {...field} />
                  </FormControl>
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
                      placeholder="Please describe the issue in detail" 
                      {...field} 
                      rows={5}
                    />
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
                  <FormLabel>Trade Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingTrades ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        trades?.map((trade: any) => (
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Your address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="preferredDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Preferred Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="preferredTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Time (Optional)</FormLabel>
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
                        <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12PM - 4PM)</SelectItem>
                        <SelectItem value="evening">Evening (4PM - 8PM)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormLabel>Photos (Optional)</FormLabel>
              <FormDescription>
                Upload up to 5 photos to help contractors understand the job
              </FormDescription>
              
              <div className="mt-2 flex items-center gap-4">
                <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImagePlus className="h-8 w-8 text-gray-400" />
                    <p className="mt-1 text-xs text-gray-500">Add Photo</p>
                  </div>
                  <Input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handlePhotoChange} 
                    disabled={photos.length >= 5}
                  />
                </label>
                
                {photoPreview.map((url, index) => (
                  <div key={index} className="relative h-32 w-32">
                    <img 
                      src={url} 
                      alt={`Job photo ${index + 1}`} 
                      className="h-full w-full rounded-md object-cover" 
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 rounded-full bg-white p-1 shadow-md"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={createJobMutation.isPending}
            >
              {createJobMutation.isPending ? (
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
    </Card>
  );
}
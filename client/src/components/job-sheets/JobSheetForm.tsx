import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Camera, 
  Upload,
  Clock, 
  CheckCircle, 
  Trash, 
  Briefcase, 
  Edit, 
  XCircle, 
  CheckSquare,
  MapPin,
  FileSignature
} from "lucide-react";

// Job sheet form validation schema
const jobSheetSchema = z.object({
  jobId: z.number(),
  contractorNotes: z.string().optional(),
  materialsUsed: z.string().optional(),
  timeSpent: z.string().optional(),
  additionalCosts: z.number().optional().default(0),
  status: z.string().default("not_started"),
});

type JobSheetFormValues = z.infer<typeof jobSheetSchema>;

interface JobSheetFormProps {
  jobId: number;
  job: any;
  existingJobSheet?: any;
  onSuccess?: () => void;
}

export function JobSheetForm({ jobId, job, existingJobSheet, onSuccess }: JobSheetFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(existingJobSheet?.signature || null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  
  // Form setup
  const form = useForm<JobSheetFormValues>({
    resolver: zodResolver(jobSheetSchema),
    defaultValues: {
      jobId,
      contractorNotes: existingJobSheet?.contractorNotes || "",
      materialsUsed: existingJobSheet?.materialsUsed || "",
      timeSpent: existingJobSheet?.timeSpent || "",
      additionalCosts: existingJobSheet?.additionalCosts || 0,
      status: existingJobSheet?.status || "not_started"
    }
  });
  
  // Load existing photos if available
  useEffect(() => {
    if (existingJobSheet?.photos && existingJobSheet.photos.length > 0) {
      // Set preview URLs for existing photos
      setPhotoPreviewUrls(existingJobSheet.photos.map((p: string) => p));
    }
  }, [existingJobSheet]);
  
  // Canvas setup for signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        
        // Load existing signature if available
        if (existingJobSheet?.signature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = existingJobSheet.signature;
        }
      }
    }
  }, [existingJobSheet]);
  
  // Get current location
  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          setIsGettingLocation(false);
          toast({
            title: "Location found",
            description: `Lat: ${position.coords.latitude.toFixed(4)}, Long: ${position.coords.longitude.toFixed(4)}`,
          });
        },
        (error) => {
          setIsGettingLocation(false);
          toast({
            title: "Location error",
            description: error.message,
            variant: "destructive",
          });
        }
      );
    } else {
      setIsGettingLocation(false);
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
    }
  };
  
  // Handle file selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setSelectedPhotos((prev) => [...prev, ...newFiles]);
      
      // Create preview URLs
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  };
  
  // Remove a photo
  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  // Signature canvas event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e instanceof MouseEvent 
      ? e.clientX - rect.left 
      : e.touches[0].clientX - rect.left;
    const y = e instanceof MouseEvent 
      ? e.clientY - rect.top 
      : e.touches[0].clientY - rect.top;
    
    setLastPoint({ x, y });
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e instanceof MouseEvent 
      ? e.clientX - rect.left 
      : e.touches[0].clientX - rect.left;
    const y = e instanceof MouseEvent 
      ? e.clientY - rect.top 
      : e.touches[0].clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setLastPoint({ x, y });
  };
  
  const endDrawing = () => {
    setIsDrawing(false);
    // Save signature as data URL
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignature(null);
      }
    }
  };
  
  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!currentLocation) {
        throw new Error("Location is required for check-in");
      }
      
      const checkInData = {
        jobId,
        checkInLocation: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
          timestamp: new Date().toISOString()
        }
      };
      
      const res = await fetch("/api/job-sheets/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkInData),
      });
      
      if (!res.ok) {
        throw new Error("Failed to check in");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Checked in successfully",
        description: "Your check-in time has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/job-sheets/job/${jobId}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Check-in failed",
        description: error instanceof Error ? error.message : "Failed to check in. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!currentLocation) {
        throw new Error("Location is required for check-out");
      }
      
      const checkOutData = {
        jobId,
        checkOutLocation: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
          timestamp: new Date().toISOString()
        }
      };
      
      const res = await fetch("/api/job-sheets/check-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkOutData),
      });
      
      if (!res.ok) {
        throw new Error("Failed to check out");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Checked out successfully",
        description: "Your check-out time has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/job-sheets/job/${jobId}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Check-out failed",
        description: error instanceof Error ? error.message : "Failed to check out. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Submit job sheet mutation
  const submitJobSheetMutation = useMutation({
    mutationFn: async (values: JobSheetFormValues) => {
      // Create form data to handle file uploads
      const formData = new FormData();
      
      // Add form values
      formData.append("jobId", values.jobId.toString());
      formData.append("contractorNotes", values.contractorNotes || "");
      formData.append("materialsUsed", values.materialsUsed || "");
      formData.append("timeSpent", values.timeSpent || "");
      formData.append("additionalCosts", values.additionalCosts?.toString() || "0");
      formData.append("status", values.status);
      
      // Add signature if available
      if (signature) {
        formData.append("signature", signature);
      }
      
      // Add new photos
      selectedPhotos.forEach((photo) => {
        formData.append("photos", photo);
      });
      
      // Determine if this is an update or a new submission
      const url = existingJobSheet
        ? `/api/job-sheets/${existingJobSheet.id}`
        : "/api/job-sheets";
      
      const method = existingJobSheet ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit job sheet");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: existingJobSheet ? "Job sheet updated" : "Job sheet created",
        description: existingJobSheet 
          ? "Your job sheet has been updated successfully." 
          : "Your job sheet has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/job-sheets/job/${jobId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit job sheet. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (values: JobSheetFormValues) => {
    submitJobSheetMutation.mutate(values);
  };
  
  // Determine if check-in/check-out is allowed
  const canCheckIn = !existingJobSheet?.checkInTime;
  const canCheckOut = existingJobSheet?.checkInTime && !existingJobSheet?.checkOutTime;
  
  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">
          {existingJobSheet ? "Update Job Sheet" : "Create Job Sheet"}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">
              <Briefcase className="mr-2 h-4 w-4" />
              Job Details
            </TabsTrigger>
            <TabsTrigger value="check-in-out">
              <Clock className="mr-2 h-4 w-4" />
              Check In/Out
            </TabsTrigger>
            <TabsTrigger value="photos">
              <Camera className="mr-2 h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="signature">
              <FileSignature className="mr-2 h-4 w-4" />
              Signature
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="contractorNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the work completed..."
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
                  name="materialsUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materials Used</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List materials used for the job..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="timeSpent"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Time Spent</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 3.5 hours"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="additionalCosts"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Additional Costs ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button type="submit" disabled={submitJobSheetMutation.isPending}>
                  {submitJobSheetMutation.isPending ? (
                    "Saving..."
                  ) : existingJobSheet ? (
                    "Update Job Sheet"
                  ) : (
                    "Save Job Sheet"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="check-in-out">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Check In</CardTitle>
                </CardHeader>
                <CardContent>
                  {existingJobSheet?.checkInTime ? (
                    <div>
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <CheckCircle />
                        <span className="font-medium">Checked In</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(existingJobSheet.checkInTime).toLocaleString()}
                      </p>
                      {existingJobSheet?.checkInLocation && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Lat: {existingJobSheet.checkInLocation.latitude.toFixed(6)}, 
                            Long: {existingJobSheet.checkInLocation.longitude.toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">
                        Check in when you arrive at the job location. This will record your time and current GPS location.
                      </p>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getLocation}
                          disabled={isGettingLocation || !canCheckIn}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          {isGettingLocation ? "Getting Location..." : "Get Location"}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => checkInMutation.mutate()}
                          disabled={!currentLocation || checkInMutation.isPending || !canCheckIn}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          {checkInMutation.isPending ? "Checking In..." : "Check In"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Check Out</CardTitle>
                </CardHeader>
                <CardContent>
                  {existingJobSheet?.checkOutTime ? (
                    <div>
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <CheckCircle />
                        <span className="font-medium">Checked Out</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(existingJobSheet.checkOutTime).toLocaleString()}
                      </p>
                      {existingJobSheet?.checkOutLocation && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Lat: {existingJobSheet.checkOutLocation.latitude.toFixed(6)}, 
                            Long: {existingJobSheet.checkOutLocation.longitude.toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">
                        Check out when you complete the job. This will record your ending time and current GPS location.
                      </p>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getLocation}
                          disabled={isGettingLocation || !canCheckOut}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          {isGettingLocation ? "Getting Location..." : "Get Location"}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => checkOutMutation.mutate()}
                          disabled={!currentLocation || checkOutMutation.isPending || !canCheckOut}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          {checkOutMutation.isPending ? "Checking Out..." : "Check Out"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {existingJobSheet?.checkInTime && existingJobSheet?.checkOutTime && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Job Duration</h3>
                  <p>
                    {(() => {
                      const checkIn = new Date(existingJobSheet.checkInTime);
                      const checkOut = new Date(existingJobSheet.checkOutTime);
                      const diffMs = checkOut.getTime() - checkIn.getTime();
                      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      return `${diffHrs} hours, ${diffMins} minutes`;
                    })()}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="photos">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Upload Photos</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Add photos showing the work completed, before/after shots, or any issues encountered.
                </p>
                <div className="flex gap-4">
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-md hover:border-primary">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <span className="mt-2 block text-sm text-gray-500">Select Photos</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                    />
                  </label>
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-md hover:border-primary">
                      <div className="text-center">
                        <Camera className="mx-auto h-8 w-8 text-gray-400" />
                        <span className="mt-2 block text-sm text-gray-500">Take Photo</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
              </div>
              
              {photoPreviewUrls.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Uploaded Photos ({photoPreviewUrls.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Job photo ${index + 1}`}
                          className="h-40 w-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button
                type="button"
                onClick={() => form.handleSubmit(onSubmit)()}
                disabled={submitJobSheetMutation.isPending}
              >
                {submitJobSheetMutation.isPending ? "Saving..." : "Save Photos"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="signature">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Digital Signature</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Sign with your finger or mouse to confirm completion of work.
                </p>
                
                <div className="border-2 border-gray-300 rounded-md mb-4">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearSignature}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Clear Signature
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => form.handleSubmit(onSubmit)()}
                    disabled={submitJobSheetMutation.isPending || !signature}
                  >
                    {submitJobSheetMutation.isPending ? "Saving..." : "Save Signature"}
                  </Button>
                </div>
              </div>
              
              {signature && existingJobSheet && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500">
                    Last updated: {existingJobSheet.updatedAt ? new Date(existingJobSheet.updatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div>
          {existingJobSheet && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mark job as completed:</span>
              <Switch 
                checked={form.getValues("status") === "completed"}
                onCheckedChange={(checked) => {
                  form.setValue("status", checked ? "completed" : "in_progress");
                  // Auto-submit when marking as completed
                  if (checked) {
                    form.handleSubmit(onSubmit)();
                  }
                }}
              />
            </div>
          )}
        </div>
        
        <Button
          type="button"
          onClick={() => form.handleSubmit(onSubmit)()}
          variant="default"
          disabled={submitJobSheetMutation.isPending}
        >
          {submitJobSheetMutation.isPending ? (
            "Saving..."
          ) : existingJobSheet ? (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Update Job Sheet
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Job Sheet
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default JobSheetForm;
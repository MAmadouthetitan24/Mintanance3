import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Clock, ClipboardCheck, CheckCircle2, Upload, Trash2 } from "lucide-react";
import FileUpload from "@/components/shared/FileUpload";
import type { JobSheet as JobSheetType } from "@shared/schema";
import { formatDateTime } from "@/lib/utils";

interface JobSheetProps {
  jobId: number;
  jobSheet?: JobSheetType;
  isLoading: boolean;
  userRole: "homeowner" | "contractor";
}

export default function JobSheet({ jobId, jobSheet, isLoading, userRole }: JobSheetProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [workDetails, setWorkDetails] = useState(jobSheet?.workDetails || "");
  const [materials, setMaterials] = useState(jobSheet?.materials || "");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  
  // Create job sheet mutation
  const createJobSheetMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/job-sheets`, {
        method: "POST",
        body: data,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to create job sheet");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Job sheet created",
        description: "The job sheet has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/job-sheets/job/${jobId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create job sheet. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Update job sheet mutation
  const updateJobSheetMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/job-sheets/${jobSheet?.id}`, {
        method: "PATCH",
        body: data,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to update job sheet");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Job sheet updated",
        description: "The job sheet has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/job-sheets/job/${jobId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update job sheet. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (jobSheet) {
        const res = await apiRequest("PATCH", `/api/job-sheets/${jobSheet.id}`, {
          checkInTime: new Date().toISOString()
        });
        return res.json();
      } else {
        // Create new job sheet with check-in time
        const formData = new FormData();
        formData.append("jobId", jobId.toString());
        formData.append("checkInTime", new Date().toISOString());
        
        const res = await fetch(`/api/job-sheets`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!res.ok) {
          throw new Error("Failed to check in");
        }
        
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Checked in",
        description: "You have successfully checked in to this job.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/job-sheets/job/${jobId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check in. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!jobSheet) return null;
      
      const res = await apiRequest("PATCH", `/api/job-sheets/${jobSheet.id}`, {
        checkOutTime: new Date().toISOString()
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Checked out",
        description: "You have successfully checked out from this job.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/job-sheets/job/${jobId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check out. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle signature pad events
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    setIsDrawing(true);
    setLastPosition({ x, y });
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.strokeStyle = "#0047AB";
    ctx.lineWidth = 2;
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setLastPosition({ x, y });
  };
  
  const endDrawing = () => {
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignature(null);
    }
  };
  
  const handleFileChange = (files: File[]) => {
    setUploadedFiles(files);
  };
  
  const handleSaveJobSheet = () => {
    const formData = new FormData();
    
    // Add job ID
    formData.append("jobId", jobId.toString());
    
    // Add work details and materials if provided
    if (workDetails) formData.append("workDetails", workDetails);
    if (materials) formData.append("materials", materials);
    
    // Add photos
    uploadedFiles.forEach(file => {
      formData.append("photos", file);
    });
    
    // Add signature if available
    if (signature) {
      if (userRole === "contractor") {
        formData.append("contractorSignature", signature);
      } else {
        formData.append("homeownerSignature", signature);
      }
    }
    
    if (jobSheet) {
      // Update existing job sheet
      updateJobSheetMutation.mutate(formData);
    } else {
      // Create new job sheet
      createJobSheetMutation.mutate(formData);
    }
  };
  
  const handleCheckIn = () => {
    checkInMutation.mutate();
  };
  
  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };
  
  const isJobSheetComplete = 
    jobSheet?.checkInTime && 
    jobSheet?.checkOutTime && 
    jobSheet?.homeownerSignature && 
    jobSheet?.contractorSignature;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-40 mb-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Sheet</CardTitle>
      </CardHeader>
      <CardContent>
        {isJobSheetComplete ? (
          <div className="flex items-center justify-center bg-green-50 text-green-700 p-4 rounded-md mb-6">
            <CheckCircle2 className="h-6 w-6 mr-2" />
            <span className="font-medium">This job has been completed and signed off</span>
          </div>
        ) : null}
        
        <div className="space-y-6">
          {userRole === "contractor" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-md">
              <div>
                <h3 className="font-medium flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-gray-500" />
                  Time Tracking
                </h3>
                <div className="mt-2 text-sm">
                  {jobSheet?.checkInTime ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium">Checked in:</span>
                      <span>{formatDateTime(jobSheet.checkInTime)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Not checked in yet</span>
                  )}
                  
                  {jobSheet?.checkOutTime && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                      <span className="font-medium">Checked out:</span>
                      <span>{formatDateTime(jobSheet.checkOutTime)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                {!jobSheet?.checkInTime && (
                  <Button onClick={handleCheckIn} disabled={checkInMutation.isPending}>
                    {checkInMutation.isPending ? "Checking in..." : "Check In"}
                  </Button>
                )}
                
                {jobSheet?.checkInTime && !jobSheet?.checkOutTime && (
                  <Button onClick={handleCheckOut} disabled={checkOutMutation.isPending}>
                    {checkOutMutation.isPending ? "Checking out..." : "Check Out"}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="workDetails">Work Details</Label>
              <Textarea
                id="workDetails"
                placeholder="Describe the work performed..."
                className="mt-1 min-h-[120px]"
                value={workDetails}
                onChange={(e) => setWorkDetails(e.target.value)}
                disabled={userRole === "homeowner" || isJobSheetComplete}
              />
            </div>
            
            <div>
              <Label htmlFor="materials">Materials Used</Label>
              <Textarea
                id="materials"
                placeholder="List materials used for the job..."
                className="mt-1 min-h-[80px]"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                disabled={userRole === "homeowner" || isJobSheetComplete}
              />
            </div>
            
            {!isJobSheetComplete && userRole === "contractor" && (
              <div>
                <Label>Upload Photos</Label>
                <div className="mt-1">
                  <FileUpload
                    maxFiles={10}
                    acceptedFileTypes={["image/jpeg", "image/png", "image/gif"]}
                    maxSize={10 * 1024 * 1024} // 10MB
                    onFilesChange={handleFileChange}
                  />
                </div>
              </div>
            )}
            
            {jobSheet?.photos && jobSheet.photos.length > 0 && (
              <div>
                <Label>Job Photos</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                  {jobSheet.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
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
            
            <Separator />
            
            <div>
              <h3 className="font-medium text-lg flex items-center mb-2">
                <ClipboardCheck className="mr-2 h-5 w-5 text-gray-500" />
                Signatures
              </h3>
              
              {/* Homeowner Signature Section */}
              <div className="mb-4">
                <Label className="mb-2 block">
                  {userRole === "homeowner" ? "Your Signature" : "Homeowner's Signature"}
                </Label>
                
                {jobSheet?.homeownerSignature ? (
                  <div className="border rounded-md p-2 bg-white">
                    <img 
                      src={jobSheet.homeownerSignature} 
                      alt="Homeowner Signature" 
                      className="max-h-32"
                    />
                  </div>
                ) : userRole === "homeowner" && !isJobSheetComplete ? (
                  <div className="space-y-2">
                    <div 
                      className="border rounded-md bg-white"
                      style={{ touchAction: 'none' }}
                    >
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={200}
                        className="w-full border-0"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={endDrawing}
                        onMouseLeave={endDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={endDrawing}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearSignature}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Signature
                    </Button>
                    <p className="text-xs text-gray-500">
                      By signing, you confirm that the work has been completed to your satisfaction.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-md p-4 bg-gray-50 text-gray-500 text-center">
                    Awaiting homeowner's signature
                  </div>
                )}
              </div>
              
              {/* Contractor Signature Section */}
              <div>
                <Label className="mb-2 block">
                  {userRole === "contractor" ? "Your Signature" : "Contractor's Signature"}
                </Label>
                
                {jobSheet?.contractorSignature ? (
                  <div className="border rounded-md p-2 bg-white">
                    <img 
                      src={jobSheet.contractorSignature} 
                      alt="Contractor Signature" 
                      className="max-h-32"
                    />
                  </div>
                ) : userRole === "contractor" && !isJobSheetComplete ? (
                  <div className="space-y-2">
                    <div 
                      className="border rounded-md bg-white"
                      style={{ touchAction: 'none' }}
                    >
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={200}
                        className="w-full border-0"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={endDrawing}
                        onMouseLeave={endDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={endDrawing}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearSignature}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Signature
                    </Button>
                    <p className="text-xs text-gray-500">
                      By signing, you confirm that the work has been completed as described.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-md p-4 bg-gray-50 text-gray-500 text-center">
                    Awaiting contractor's signature
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {!isJobSheetComplete && (
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSaveJobSheet} 
            disabled={
              (createJobSheetMutation.isPending || updateJobSheetMutation.isPending) ||
              // Require both signatures for completion
              (userRole === "homeowner" && !signature && jobSheet?.contractorSignature) ||
              (userRole === "contractor" && !signature && !workDetails)
            }
          >
            {createJobSheetMutation.isPending || updateJobSheetMutation.isPending ? (
              "Saving..."
            ) : jobSheet ? (
              "Update Job Sheet"
            ) : (
              "Create Job Sheet"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

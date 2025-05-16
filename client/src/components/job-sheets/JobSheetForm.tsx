import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Clock, MapPin, Save, Upload, Trash, Check, X } from 'lucide-react';
import { format } from 'date-fns';

// Form validation schema
const jobSheetSchema = z.object({
  jobId: z.number(),
  contractorNotes: z.string().min(10, "Please provide detailed notes about the work completed"),
  materialsUsed: z.string().optional(),
  timeSpent: z.string().optional(),
  additionalCosts: z.number().optional(),
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>(existingJobSheet?.photos || []);
  const [signature, setSignature] = useState<string | null>(existingJobSheet?.signature || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null);
  const [showSignature, setShowSignature] = useState(false);

  // Get location
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          toast({
            title: 'Location Error',
            description: `Could not get your location: ${error.message}`,
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({
        title: 'Location Not Supported',
        description: 'Your browser does not support geolocation',
        variant: 'destructive',
      });
    }
  };

  // Initialize form with existing data if available
  const form = useForm<JobSheetFormValues>({
    resolver: zodResolver(jobSheetSchema),
    defaultValues: {
      jobId,
      contractorNotes: existingJobSheet?.contractorNotes || '',
      materialsUsed: existingJobSheet?.materialsUsed || '',
      timeSpent: existingJobSheet?.timeSpent || '',
      additionalCosts: existingJobSheet?.additionalCosts || 0,
    },
  });

  // Check in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      setIsCheckingIn(true);
      getLocation();
      
      const response = await fetch(`/api/job-sheets/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          contractorId: user?.id,
          checkInTime: new Date().toISOString(),
          checkInLocation: position,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to check in');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Checked In Successfully',
        description: 'Your check-in has been recorded',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/job-sheets/job/${jobId}`] });
      setIsCheckingIn(false);
    },
    onError: (error) => {
      toast({
        title: 'Check-in Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      setIsCheckingIn(false);
    }
  });

  // Check out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      setIsCheckingOut(true);
      getLocation();
      
      const response = await fetch(`/api/job-sheets/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          contractorId: user?.id,
          checkOutTime: new Date().toISOString(),
          checkOutLocation: position,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to check out');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Checked Out Successfully',
        description: 'Your check-out has been recorded',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/job-sheets/job/${jobId}`] });
      setIsCheckingOut(false);
    },
    onError: (error) => {
      toast({
        title: 'Check-out Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      setIsCheckingOut(false);
    }
  });

  // Clear signature
  const clearSignature = () => {
    setSignature(null);
    setShowSignature(false);
  };

  // Save signature
  const captureSignature = () => {
    // In a real app, we'd use a proper signature capture component
    // For this demo, we'll simulate a signature
    const mockSignature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAANJ0lEQVR4Xu3dW49dVRnH4Tnbe2YyM5BJQiYhBGICJF4AasRL9EJNFG+URIkmqolifICm+AH0A+AXkA9givESEhMgkZAQSCCEXJjMZK7t/e97OGfvs7t7rzX/51nrnfTf56y15/esX9YaPTl/7vQkfAgQIBBAYEnAAoyRSyRAgJ2CRYBAmACChTFeF02AgGARABAIDCBYgcfLpRMQrPYMeP78ebty5Yo9fPiw/X9+xIHt27fbs88+a2fPnrVjx47ZysrKom9J//oEBKstU9evX7erV6/a8vKynTx5sp1/yU87ceLEfIauXbtmjx8/tuXl5Xn4Li0t2ZkzZ+zUqVP274cP7f79+7a6umqHDh0SsFnHXbDaMnT37l27cOGCHTlyxPbu3Wt79uyxAwcOtPMv+Wn37t2ze/fu2cOHD+eTfOvWLbt9+7YdP37cDh8+bLt377aLFy/Oli37Vv3X+Prrr9vnn39uH3zwgZ05c2bRt6V/fQKC1aapq1ev2qVLl2xjY2NtG5ZgLS7L5o+E9+/fn/2ZwBKsi9A39xeslt8EG6OrzZ8FnzZKm2C9+OKLduvWLfvyyy+fjLAEq+UJmnmaYLVk6sTJk/bRRx/Nhf7qq6/s0qVLs32Zq1ev2t9v3LBfvfGGXbhwwX7/u9/ZK6+8Mr8EwWrJwcynCNYM+L/16A/ef9/eeecdO3bs2PyW7t+/b3/6wx/tzTffnO0Jvfvuu/bLX/3KXn/ttSe7ZoL1tEY6+/8Eq7Oh/fHPf26PHj2aB2t9fd3+8qc/2i9+9avZvXz04Yf22muv2VtvvSVYnU3K4m5MsBbn95Xef/nFL+ziF1/MQ/TgwQP7/fvv2ZtvvTXf9Pesn/n0tF/BaumdIVgtodq2bdvsEO/Fixdne1Obm5v2t48/tjfeeGN+JT/5+OPZptfPf/nL2Z+bH8FqCcHMpwjWDPi3b9tm33/ppdk+1uaOu2C1ZGD2UwSrZQNvv/22ffbZZ7Mzg/v27bMff/jhbL/q5MmT9q9//tPee+89+9FPfjI/LiJYLSOY+TTBmgF/8+jFDz/88Mne1MrKir366qv2ww8+sNdff312xPmDDz+0H//0p7PnC1bLBmY/TbBaNvD999/bxx9/bF9//bUdOHDA3nzzTfvOd79rV65csY8++sief/55e+utt2YnyB8/fjz7iYJgteRg5lMEawb85uUnm3tYm5twgtWygdlPE6yZDQjWTAKdDi9YnQ7v5o/EgtWpfcFq/x0vWO1nrY2RFKw23nFPeYpgdTq8gtX+8ApW+1lrYyQFq413nBGWa7AEawLBchwIVh5HbY6iYLWZtkd7WK5BEizBasvA7OcIlmC1ZWD28wRrAsESLMGawMD/BcvrHpZgCZZgCZZglRoQrFJ8T14sWILVloHZzxOsCQRLsARrAgP+Ewk5ruYRLMESLMESrFIDglWKz/FqQcFqy8Ds5wnWBIIlWII1gQH/iYQcV/MIlmAJlmAJVqkBwSrF53i1oGC1ZWD28wRrAsESLMGawID/REKOq3kES7AES7AEq9SAYJXic7xaULDaMjD7eYI1gWAJlmBNYMB/IiHH1TyCJViCJViCVWpAsErxOV4tKFhtGZj9PMGaQLAES7AmMOA/kZDjah7BEizBEizBKjUgWKX4HK8WFKy2DMx+nmBNIFiCJVgTGPCfSMhxNY9gCZZgCZZglRoQrFJ8jlcLClZbBmY/T7AmECzBEqwJDPhPJOS4mkewBEuwBEuwSg0IVik+x6sFBaslA7t3P2vHb9+2jY2N2bPX1tYsZcE6ePCg3blzx9bX12c+VldX7ejRo3bt2rXZn62srNjc73y6det/7NChQ7Z3797Z7964cdMOHDhge/bssdu3b9vDhw9nz9m1a5cdOXLErl+/busP1mdfd+zYYYcPH7aNjcd248ZN27lzpx06dNBu3rxlDx48mH3dnj177Pnnn7dLly7Z48cbT/1+0Ndv3/5f27dvn+3bt9du3Lhp//73v2dfv3fvXnvhhRfs8uXLtv5o/Sffd/P37u7du+273/ueffnll/bPf/zDdiyt2PLyTtvcG9y8X8FK+ccjWC2De+GFF+y3b79tP/vZz+yll16yl19+uXzRu3Lliv3hd7+zv/71r09+JFxbW7W//vWv9utf/9quX79un3zyib3zzju2c+dOu3z5sv3md7+z3/72t/NwbL7JfvGLX9jKyort37/fPv30U/vNb39r58+ftwMHDs7C9ec//9l++9vfzo8JbT7/nXfemb0ZL1++bJ999pm9++67dvDgQbt69ar94le/tHfffXf+tfv27bfPP//c3n//ffv000/tvffes/X1R/bu+++Zhcxe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";
    setSignature(mockSignature);
    setShowSignature(true);
    toast({
      title: 'Signature Captured',
      description: 'Digital signature has been saved',
    });
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...newPhotos]);
      
      // Create preview URLs
      newPhotos.forEach(photo => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoUrls(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(photo);
      });
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Submit form
  const onSubmit = async (values: JobSheetFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Upload photos if any
      let uploadedPhotoUrls: string[] = [...photoUrls];
      
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => {
          formData.append('photos', photo);
        });
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photos');
        }
        
        const uploadResult = await uploadResponse.json();
        uploadedPhotoUrls = [...photoUrls.filter(url => url.startsWith('http')), ...uploadResult.fileUrls];
      }
      
      // Create or update job sheet
      const endpoint = existingJobSheet ? 
        `/api/job-sheets/${existingJobSheet.id}` : 
        '/api/job-sheets';
      
      const method = existingJobSheet ? 'PATCH' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          photos: uploadedPhotoUrls,
          signature,
          status: signature ? 'completed' : 'in_progress',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save job sheet');
      }
      
      toast({
        title: 'Job Sheet Saved',
        description: 'The job sheet has been successfully saved',
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/job-sheets/job/${jobId}`] });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCheckedIn = !!existingJobSheet?.checkInTime;
  const isCheckedOut = !!existingJobSheet?.checkOutTime;
  const isCompleted = existingJobSheet?.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Check In/Out Section */}
      <Card>
        <CardHeader>
          <CardTitle>Job Check-In/Out</CardTitle>
          <CardDescription>
            Record your arrival and departure from the job site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Check-In
                </h3>
                {isCheckedIn ? (
                  <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    Checked In
                  </span>
                ) : (
                  <span className="text-sm px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                    Not Checked In
                  </span>
                )}
              </div>
              
              {isCheckedIn && existingJobSheet?.checkInTime ? (
                <div className="text-sm text-muted-foreground">
                  <p>Time: {format(new Date(existingJobSheet.checkInTime), 'PPp')}</p>
                  {existingJobSheet.checkInLocation && (
                    <p className="flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      Location recorded
                    </p>
                  )}
                </div>
              ) : (
                <Button 
                  onClick={() => checkInMutation.mutate()}
                  disabled={isCheckedIn || isCheckingIn}
                  className="w-full mt-2"
                >
                  {isCheckingIn ? 'Checking In...' : 'Check In Now'}
                </Button>
              )}
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Check-Out
                </h3>
                {isCheckedOut ? (
                  <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    Checked Out
                  </span>
                ) : (
                  <span className="text-sm px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                    Not Checked Out
                  </span>
                )}
              </div>
              
              {isCheckedOut && existingJobSheet?.checkOutTime ? (
                <div className="text-sm text-muted-foreground">
                  <p>Time: {format(new Date(existingJobSheet.checkOutTime), 'PPp')}</p>
                  {existingJobSheet.checkOutLocation && (
                    <p className="flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      Location recorded
                    </p>
                  )}
                </div>
              ) : (
                <Button 
                  onClick={() => checkOutMutation.mutate()}
                  disabled={!isCheckedIn || isCheckedOut || isCheckingOut}
                  className="w-full mt-2"
                >
                  {isCheckingOut ? 'Checking Out...' : 'Check Out Now'}
                </Button>
              )}
            </div>
          </div>
          
          {isCheckedIn && isCheckedOut && (
            <div className="text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Total Time on Site: </span>
                {existingJobSheet?.checkInTime && existingJobSheet?.checkOutTime ? (
                  (() => {
                    const start = new Date(existingJobSheet.checkInTime);
                    const end = new Date(existingJobSheet.checkOutTime);
                    const diffMs = end.getTime() - start.getTime();
                    const diffHrs = Math.floor(diffMs / 1000 / 60 / 60);
                    const diffMins = Math.floor((diffMs / 1000 / 60) % 60);
                    return `${diffHrs} hours, ${diffMins} minutes`;
                  })()
                ) : (
                  'Not available'
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Details Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>
                Record details about the work completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contractorNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the work completed..." 
                        className="min-h-[120px]"
                        disabled={isCompleted}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="materialsUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materials Used</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List materials used..." 
                          className="min-h-[80px]"
                          disabled={isCompleted}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="timeSpent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Hours</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 4 hours 30 minutes" 
                          disabled={isCompleted}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="additionalCosts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Costs</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        disabled={isCompleted}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel>Photos</FormLabel>
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {photoUrls.map((url, index) => (
                      <div key={index} className="relative h-20 w-20 border rounded overflow-hidden">
                        <img src={url} alt={`Job photo ${index}`} className="h-full w-full object-cover" />
                        {!isCompleted && (
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {!isCompleted && (
                    <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-4">
                      <label className="cursor-pointer w-full">
                        <div className="flex flex-col items-center justify-center text-center">
                          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium mb-1">Click to upload photos</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG, HEIC up to 10MB</p>
                          <Input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            className="hidden" 
                            onChange={handlePhotoUpload}
                          />
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Homeowner Signature */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Homeowner Signature</CardTitle>
              <CardDescription>
                Have the homeowner sign to confirm completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signature ? (
                <div className="mb-4">
                  <p className="text-sm mb-2">Signature captured:</p>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img src={signature} alt="Homeowner signature" className="max-h-[150px] mx-auto" />
                  </div>
                  {!isCompleted && (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={clearSignature}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Clear Signature
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[150px] flex items-center justify-center">
                    {showSignature ? (
                      <p className="text-sm text-muted-foreground">Drawing signature...</p>
                    ) : (
                      <Button
                        type="button"
                        onClick={captureSignature}
                      >
                        Capture Customer Signature
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="text-sm text-muted-foreground">
                <p>
                  {existingJobSheet?.signature 
                    ? 'Job sheet has been signed and completed.' 
                    : 'Homeowner signature is required to mark the job as complete.'}
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || isCompleted}
              >
                {isSubmitting ? 'Saving...' : 'Save Job Sheet'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
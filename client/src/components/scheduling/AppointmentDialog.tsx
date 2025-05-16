import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addHours, setHours, setMinutes } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Define form validation schema
const appointmentFormSchema = z.object({
  title: z.string().optional(),
  startTime: z.string().nonempty("Start time is required"),
  endTime: z.string().nonempty("End time is required"),
}).refine(data => {
  // Ensure end time is after start time
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSubmit: (data: AppointmentFormValues) => void;
}

export function AppointmentDialog({ 
  open, 
  onOpenChange, 
  selectedDate,
  onSubmit 
}: AppointmentDialogProps) {
  // Initialize with business hours
  const defaultStartDate = selectedDate ? 
    setHours(setMinutes(selectedDate, 0), 9) : // Default to 9:00 AM
    setHours(setMinutes(new Date(), 0), 9);
  
  const defaultEndDate = selectedDate ?
    setHours(setMinutes(selectedDate, 0), 17) : // Default to 5:00 PM
    setHours(setMinutes(new Date(), 0), 17);
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      title: 'Available',
      startTime: defaultStartDate.toISOString(),
      endTime: defaultEndDate.toISOString(),
    }
  });

  // Update form when selected date changes
  useEffect(() => {
    if (selectedDate) {
      // Set the date but maintain default business hours
      const startDate = setHours(setMinutes(selectedDate, 0), 9);
      const endDate = setHours(setMinutes(selectedDate, 0), 17);
      
      form.setValue('startTime', startDate.toISOString());
      form.setValue('endTime', endDate.toISOString());
    }
  }, [selectedDate, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = (values: AppointmentFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Availability</DialogTitle>
          <DialogDescription>
            Set your available time slots for clients to book appointments.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Available" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ''} 
                        onChange={(e) => {
                          field.onChange(new Date(e.target.value).toISOString());
                          
                          // Auto-set end time to 1 hour after start time
                          const startDate = new Date(e.target.value);
                          form.setValue('endTime', addHours(startDate, 1).toISOString());
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ''} 
                        onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
              >
                Save Availability
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
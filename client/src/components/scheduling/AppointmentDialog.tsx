import React, { useState, useEffect } from 'react';
import { format, addHours, setHours, setMinutes } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Define props for the dialog component
interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedEvent: any | null;
  onAddAvailability: (data: any) => void;
  onUpdateSlot: (slotId: number, data: any) => void;
  onRespondToProposal: (proposalId: number, status: string, message?: string) => void;
}

// Form schema for adding/editing availability
const availabilityFormSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
});

// Form schema for responding to proposal
const proposalResponseSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'countered']),
  message: z.string().optional(),
});

export function AppointmentDialog({
  isOpen,
  onClose,
  selectedDate,
  selectedEvent,
  onAddAvailability,
  onUpdateSlot,
  onRespondToProposal,
}: AppointmentDialogProps) {
  const [dialogTab, setDialogTab] = useState<string>('details');
  
  // For new availability slots
  const availabilityForm = useForm<z.infer<typeof availabilityFormSchema>>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      startTime: selectedDate ? new Date(selectedDate) : new Date(),
      endTime: selectedDate ? addHours(new Date(selectedDate), 2) : addHours(new Date(), 2),
    },
  });

  // For responding to proposals
  const proposalForm = useForm<z.infer<typeof proposalResponseSchema>>({
    resolver: zodResolver(proposalResponseSchema),
    defaultValues: {
      status: 'accepted',
      message: '',
    },
  });

  // Set form values if we have a selected event (editing mode)
  useEffect(() => {
    if (selectedEvent) {
      if (selectedEvent.extendedProps?.slotId) {
        // Editing an availability slot
        availabilityForm.reset({
          title: selectedEvent.title || '',
          description: selectedEvent.extendedProps?.description || '',
          location: selectedEvent.extendedProps?.location || '',
          startTime: new Date(selectedEvent.start),
          endTime: new Date(selectedEvent.end),
        });
      }
    } else if (selectedDate) {
      // Creating a new slot - set default times
      const roundedDate = new Date(selectedDate);
      // Round to nearest half hour
      const minutes = roundedDate.getMinutes();
      const roundedMinutes = minutes < 30 ? 30 : 0;
      const roundedHour = minutes < 30 ? roundedDate.getHours() : roundedDate.getHours() + 1;
      
      const start = setMinutes(setHours(new Date(selectedDate), roundedHour), roundedMinutes);
      const end = addHours(start, 2);
      
      availabilityForm.reset({
        title: '',
        description: '',
        location: '',
        startTime: start,
        endTime: end,
      });
    }
  }, [selectedEvent, selectedDate, availabilityForm]);

  // Handle form submission for availability
  const onAvailabilitySubmit = (data: z.infer<typeof availabilityFormSchema>) => {
    if (selectedEvent?.extendedProps?.slotId) {
      // Update existing slot
      onUpdateSlot(selectedEvent.extendedProps.slotId, {
        title: data.title,
        description: data.description,
        location: data.location,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
      });
    } else {
      // Create new availability slot
      onAddAvailability({
        title: data.title,
        description: data.description,
        location: data.location,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
      });
    }
    onClose();
  };

  // Handle form submission for proposal response
  const onProposalSubmit = (data: z.infer<typeof proposalResponseSchema>) => {
    if (selectedEvent?.extendedProps?.proposalId) {
      onRespondToProposal(
        selectedEvent.extendedProps.proposalId,
        data.status,
        data.message
      );
    }
    onClose();
  };

  // Render the appropriate dialog content based on the context
  const renderDialogContent = () => {
    // If we're viewing a job
    if (selectedEvent?.extendedProps?.jobId && !selectedEvent?.extendedProps?.proposalId) {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Job Details</h3>
            <p className="text-sm text-muted-foreground">
              This appointment is for a scheduled job.
            </p>
          </div>
          
          <div className="grid gap-2">
            <div>
              <strong className="block text-sm">Date & Time:</strong>
              <span className="text-sm">
                {format(new Date(selectedEvent.start), "MMMM d, yyyy")} at {format(new Date(selectedEvent.start), "h:mm a")} 
                - {format(new Date(selectedEvent.end), "h:mm a")}
              </span>
            </div>
            
            <div>
              <strong className="block text-sm">Title:</strong>
              <span className="text-sm">{selectedEvent.title}</span>
            </div>
            
            {selectedEvent.extendedProps?.description && (
              <div>
                <strong className="block text-sm">Description:</strong>
                <span className="text-sm">{selectedEvent.extendedProps.description}</span>
              </div>
            )}
            
            {selectedEvent.extendedProps?.location && (
              <div>
                <strong className="block text-sm">Location:</strong>
                <span className="text-sm">{selectedEvent.extendedProps.location}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => {
                window.location.href = `/jobs/${selectedEvent.extendedProps.jobId}`;
              }}
            >
              View Job Details
            </Button>
          </div>
        </div>
      );
    }
    
    // If we're viewing a proposal
    if (selectedEvent?.extendedProps?.proposalId) {
      return (
        <Tabs defaultValue={dialogTab} className="w-full" onValueChange={setDialogTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="respond">Respond</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div>
              <h3 className="font-medium">Appointment Proposal</h3>
              <p className="text-sm text-muted-foreground">
                A homeowner has proposed this appointment time for a job.
              </p>
            </div>
            
            <div className="grid gap-2">
              <div>
                <strong className="block text-sm">Proposed Time:</strong>
                <span className="text-sm">
                  {format(new Date(selectedEvent.start), "MMMM d, yyyy")} at {format(new Date(selectedEvent.start), "h:mm a")} 
                  - {format(new Date(selectedEvent.end), "h:mm a")}
                </span>
              </div>
              
              <div>
                <strong className="block text-sm">Status:</strong>
                <Badge variant={
                  selectedEvent.extendedProps.status === 'pending' ? 'outline' :
                  selectedEvent.extendedProps.status === 'accepted' ? 'success' :
                  'destructive'
                }>
                  {selectedEvent.extendedProps.status.charAt(0).toUpperCase() + selectedEvent.extendedProps.status.slice(1)}
                </Badge>
              </div>
              
              <div>
                <strong className="block text-sm">For Job:</strong>
                <span className="text-sm">Job #{selectedEvent.extendedProps.jobId}</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="respond">
            <Form {...proposalForm}>
              <form onSubmit={proposalForm.handleSubmit(onProposalSubmit)} className="space-y-4">
                <FormField
                  control={proposalForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Response</FormLabel>
                      <div className="flex flex-col gap-1.5">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="accepted"
                            checked={field.value === 'accepted'}
                            onChange={() => field.onChange('accepted')}
                            className="h-4 w-4"
                          />
                          <span>Accept this appointment time</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="rejected"
                            checked={field.value === 'rejected'}
                            onChange={() => field.onChange('rejected')}
                            className="h-4 w-4"
                          />
                          <span>Decline this appointment time</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="countered"
                            checked={field.value === 'countered'}
                            onChange={() => field.onChange('countered')}
                            className="h-4 w-4"
                          />
                          <span>Suggest a different time</span>
                        </label>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={proposalForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a message to the homeowner about this appointment..."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Send Response
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      );
    }
    
    // If we're adding/editing availability
    return (
      <Form {...availabilityForm}>
        <form onSubmit={availabilityForm.handleSubmit(onAvailabilitySubmit)} className="space-y-4">
          <FormField
            control={availabilityForm.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Available for work" {...field} />
                </FormControl>
                <FormDescription>
                  A title to help you remember what this time slot is for
                </FormDescription>
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={availabilityForm.control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <DatePicker
                      selected={field.value}
                      onChange={field.onChange}
                      showTimeSelect
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={availabilityForm.control}
              name="endTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <DatePicker
                      selected={field.value}
                      onChange={field.onChange}
                      showTimeSelect
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={availabilityForm.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. City or area" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={availabilityForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any notes about your availability..."
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedEvent?.extendedProps?.slotId ? 'Update Availability' : 'Add Availability'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {selectedEvent?.extendedProps?.jobId && !selectedEvent?.extendedProps?.proposalId
              ? 'Scheduled Job'
              : selectedEvent?.extendedProps?.proposalId
              ? 'Appointment Proposal'
              : selectedEvent?.extendedProps?.slotId
              ? 'Edit Availability'
              : 'Add Availability'}
          </DialogTitle>
          <DialogDescription>
            {selectedEvent?.extendedProps?.jobId && !selectedEvent?.extendedProps?.proposalId
              ? 'View details for this scheduled job'
              : selectedEvent?.extendedProps?.proposalId
              ? 'Review and respond to this appointment proposal'
              : selectedEvent?.extendedProps?.slotId
              ? 'Update your availability for this time slot'
              : 'Set your availability for clients to book'}
          </DialogDescription>
        </DialogHeader>
        
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { ScheduleSlot } from '@shared/schema';
import { AppointmentDialog } from './AppointmentDialog';
import { CalendarSyncDialog } from './CalendarSyncDialog';

interface Event {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    status: string;
    jobId?: number;
    description?: string;
    location?: string;
    isProposal?: boolean;
  };
}

export function ContractorCalendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isCalendarSyncDialogOpen, setIsCalendarSyncDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [calendarView, setCalendarView] = useState('timeGridWeek');

  // Fetch contractor's schedule slots
  const { data: scheduleSlots = [], isLoading } = useQuery({
    queryKey: ['/api/schedule-slots'],
    enabled: !!user,
  });

  // Fetch appointment proposals
  const { data: appointmentProposals = [] } = useQuery({
    queryKey: ['/api/appointment-proposals'],
    enabled: !!user,
  });

  // Fetch assigned jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/jobs', 'contractor'],
    enabled: !!user,
  });

  // Construct events for calendar from different data sources
  const events: Event[] = React.useMemo(() => {
    // Convert schedule slots to events
    const slotEvents = scheduleSlots.map((slot: ScheduleSlot) => ({
      id: `slot-${slot.id}`,
      title: slot.isBooked 
        ? `Booked${slot.jobId ? `: Job #${slot.jobId}` : ''}` 
        : 'Available',
      start: new Date(slot.startTime),
      end: new Date(slot.endTime),
      backgroundColor: slot.isBooked ? '#FFA500' : '#3EB489',
      borderColor: slot.isBooked ? '#FFA500' : '#3EB489',
      extendedProps: {
        status: slot.status || (slot.isBooked ? 'booked' : 'available'),
        jobId: slot.jobId,
        description: slot.description,
        location: slot.location,
      }
    }));

    // Convert appointment proposals to events
    const proposalEvents = appointmentProposals.map((proposal: any) => ({
      id: `proposal-${proposal.id}`,
      title: `Proposed: Job #${proposal.jobId}`,
      start: new Date(proposal.startTime),
      end: new Date(proposal.endTime),
      backgroundColor: '#004080',
      borderColor: '#004080',
      extendedProps: {
        status: proposal.status,
        jobId: proposal.jobId,
        isProposal: true,
      }
    }));

    // Convert scheduled jobs to events
    const jobEvents = jobs
      .filter((job: any) => job.status === 'scheduled' && job.scheduledDate)
      .map((job: any) => ({
        id: `job-${job.id}`,
        title: `Job: ${job.title}`,
        start: new Date(job.scheduledDate),
        end: new Date(new Date(job.scheduledDate).getTime() + (job.estimatedDuration || 60) * 60000),
        backgroundColor: '#004080',
        borderColor: '#004080',
        extendedProps: {
          status: 'scheduled',
          jobId: job.id,
          description: job.description,
          location: job.location,
        }
      }));

    return [...slotEvents, ...proposalEvents, ...jobEvents];
  }, [scheduleSlots, appointmentProposals, jobs]);

  // Create a mutation for adding availability slots
  const createSlotMutation = useMutation({
    mutationFn: async (newSlot: any) => {
      return apiRequest('/api/schedule-slots', {
        method: 'POST',
        body: JSON.stringify(newSlot),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-slots'] });
      toast({
        title: 'Availability Added',
        description: 'Your availability slot has been added to the calendar.',
        variant: 'default',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add availability slot. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Create a mutation for updating slots
  const updateSlotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/schedule-slots/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-slots'] });
      toast({
        title: 'Updated',
        description: 'Your calendar has been updated.',
      });
    },
  });

  // Create a mutation for responding to appointment proposals
  const respondToProposalMutation = useMutation({
    mutationFn: async ({ id, status, message }: { id: number; status: string; message?: string }) => {
      return apiRequest(`/api/appointment-proposals/${id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ status, message }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointment-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-slots'] });
      toast({
        title: 'Response Sent',
        description: 'Your response to the appointment proposal has been sent.',
      });
    },
  });

  // Handle clicking on a date to add availability
  const handleDateClick = (info: any) => {
    setSelectedDate(info.date);
    setSelectedEvent(null);
    setIsAppointmentDialogOpen(true);
  };

  // Handle clicking on an event
  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    const eventType = eventId.split('-')[0];
    
    if (eventType === 'proposal') {
      // Handle appointment proposal click
      const proposalId = parseInt(eventId.split('-')[1]);
      const proposal = appointmentProposals.find((p: any) => p.id === proposalId);
      
      if (proposal) {
        setSelectedEvent({
          id: eventId,
          title: info.event.title,
          start: info.event.start,
          end: info.event.end,
          extendedProps: {
            ...info.event.extendedProps,
            proposalId: proposalId,
          }
        });
        setIsAppointmentDialogOpen(true);
      }
    } else if (eventType === 'slot') {
      // Handle slot click
      const slotId = parseInt(eventId.split('-')[1]);
      const slot = scheduleSlots.find((s: any) => s.id === slotId);
      
      if (slot) {
        setSelectedEvent({
          id: eventId,
          title: info.event.title,
          start: info.event.start,
          end: info.event.end,
          extendedProps: {
            ...info.event.extendedProps,
            slotId: slotId,
          }
        });
        setIsAppointmentDialogOpen(true);
      }
    } else if (eventType === 'job') {
      // Handle job click
      const jobId = parseInt(eventId.split('-')[1]);
      const job = jobs.find((j: any) => j.id === jobId);
      
      if (job) {
        setSelectedEvent({
          id: eventId,
          title: info.event.title,
          start: info.event.start,
          end: info.event.end,
          extendedProps: {
            ...info.event.extendedProps,
            jobId: jobId,
          }
        });
        setIsAppointmentDialogOpen(true);
      }
    }
  };
  
  // Handle adding a new availability slot
  const handleAddAvailability = (slotData: any) => {
    createSlotMutation.mutate({
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      title: slotData.title || 'Available',
      description: slotData.description || '',
      location: slotData.location || '',
      status: 'available',
    });
    setIsAppointmentDialogOpen(false);
  };

  // Handle updating a slot
  const handleUpdateSlot = (slotId: number, data: any) => {
    updateSlotMutation.mutate({
      id: slotId,
      data,
    });
    setIsAppointmentDialogOpen(false);
  };

  // Handle responding to a proposal
  const handleRespondToProposal = (proposalId: number, status: string, message?: string) => {
    respondToProposalMutation.mutate({
      id: proposalId,
      status,
      message,
    });
    setIsAppointmentDialogOpen(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading calendar...</div>;
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Contractor Schedule</CardTitle>
            <CardDescription>
              Manage your availability and view scheduled appointments
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCalendarSyncDialogOpen(true)}
            >
              Sync with External Calendar
            </Button>
            <Button onClick={() => {
              setSelectedDate(new Date());
              setSelectedEvent(null);
              setIsAppointmentDialogOpen(true);
            }}>
              Add Availability
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={calendarView} className="w-full" onValueChange={setCalendarView}>
          <TabsList className="mb-4">
            <TabsTrigger value="dayGridMonth">Month</TabsTrigger>
            <TabsTrigger value="timeGridWeek">Week</TabsTrigger>
            <TabsTrigger value="timeGridDay">Day</TabsTrigger>
          </TabsList>
          <TabsContent value={calendarView} className="mt-0">
            <div className="h-[600px]">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={calendarView}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: '',
                }}
                events={events}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short',
                }}
                height="100%"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#3EB489] rounded-full"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#FFA500] rounded-full"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#004080] rounded-full"></div>
          <span>Scheduled Job</span>
        </div>
      </CardFooter>

      {/* Dialog for adding/editing availability or responding to proposals */}
      {isAppointmentDialogOpen && (
        <AppointmentDialog
          isOpen={isAppointmentDialogOpen}
          onClose={() => setIsAppointmentDialogOpen(false)}
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
          onAddAvailability={handleAddAvailability}
          onUpdateSlot={handleUpdateSlot}
          onRespondToProposal={handleRespondToProposal}
        />
      )}

      {/* Dialog for calendar sync settings */}
      {isCalendarSyncDialogOpen && (
        <CalendarSyncDialog
          isOpen={isCalendarSyncDialogOpen}
          onClose={() => setIsCalendarSyncDialogOpen(false)}
        />
      )}
    </Card>
  );
}
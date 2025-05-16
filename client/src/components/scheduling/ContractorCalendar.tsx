import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { CalendarPlus, CalendarCheck, Trash2, Plus, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, parseISO, isAfter } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppointmentDialog } from './AppointmentDialog';
import { CalendarSyncDialog } from './CalendarSyncDialog';

interface ScheduleSlot {
  id: number;
  contractorId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  title?: string;
}

interface AppointmentProposal {
  id: number;
  jobId: number;
  proposedTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string;
}

interface Job {
  id: number;
  title: string;
  homeownerId: string;
  contractorId: string;
  scheduledDate?: string;
  status: string;
}

export function ContractorCalendar() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentProposal | null>(null);

  // Fetch schedule slots
  const { data: scheduleSlots = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: ['/api/schedule-slots'],
    enabled: !!user,
  });

  // Fetch appointment proposals
  const { data: appointmentProposals = [], isLoading: isLoadingProposals } = useQuery({
    queryKey: ['/api/appointment-proposals'],
    enabled: !!user,
  });

  // Fetch jobs associated with the user
  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/jobs', 'contractor'],
    enabled: !!user,
  });

  // Handle slot creation
  const handleSlotCreate = async (data: any) => {
    if (!user) return;

    try {
      const response = await fetch('/api/schedule-slots', {
        method: 'POST',
        body: JSON.stringify({
          contractorId: user.id,
          startTime: data.startTime,
          endTime: data.endTime,
          isBooked: false,
          title: data.title || 'Available'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Availability added',
          description: 'Your availability slot was successfully added to the calendar.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/schedule-slots'] });
      } else {
        throw new Error('Failed to create availability slot');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem adding your availability.',
        variant: 'destructive',
      });
    }
  };

  // Handle slot deletion
  const handleSlotDelete = async (slotId: number) => {
    try {
      const response = await fetch(`/api/schedule-slots/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Availability removed',
          description: 'The availability slot was successfully removed.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/schedule-slots'] });
      } else {
        throw new Error('Failed to delete availability slot');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem removing your availability.',
        variant: 'destructive',
      });
    }
  };

  // Handle calendar date click
  const handleDateClick = (info: any) => {
    // Set the selected date and open the dialog
    setSelectedDate(info.date);
    setIsScheduleDialogOpen(true);
  };

  // Handle event click
  const handleEventClick = (info: any) => {
    const eventId = parseInt(info.event.id);
    
    // Check if it's a schedule slot
    const slot = scheduleSlots.find((s: any) => s.id === eventId);
    if (slot) {
      setSelectedSlot(slot);
      return;
    }
    
    // Check if it's an appointment proposal
    const proposal = appointmentProposals.find((p: any) => p.id === eventId);
    if (proposal) {
      setSelectedAppointment(proposal);
    }
  };

  // Format events for FullCalendar
  const calendarEvents = React.useMemo(() => {
    const events = [];

    // Add schedule slots
    if (scheduleSlots && Array.isArray(scheduleSlots)) {
      for (const slot of scheduleSlots) {
        events.push({
          id: slot.id.toString(),
          title: slot.isBooked ? 'Booked' : slot.title || 'Available',
          start: slot.startTime,
          end: slot.endTime,
          backgroundColor: slot.isBooked ? '#004080' : '#3EB489',
          borderColor: slot.isBooked ? '#004080' : '#3EB489',
          extendedProps: { type: 'slot', isBooked: slot.isBooked }
        });
      }
    }

    // Add appointment proposals
    if (appointmentProposals && Array.isArray(appointmentProposals)) {
      for (const proposal of appointmentProposals) {
        const job = jobs?.find((j: any) => j.id === proposal.jobId);
        events.push({
          id: proposal.id.toString(),
          title: `${job?.title || 'Job'} - ${proposal.status}`,
          start: proposal.proposedTime,
          end: new Date(new Date(proposal.proposedTime).getTime() + 60 * 60 * 1000).toISOString(), // Add 1 hour
          backgroundColor: 
            proposal.status === 'accepted' ? '#4CAF50' : 
            proposal.status === 'rejected' ? '#F44336' : '#FFC107',
          borderColor: 
            proposal.status === 'accepted' ? '#4CAF50' : 
            proposal.status === 'rejected' ? '#F44336' : '#FFC107',
          extendedProps: { type: 'proposal', status: proposal.status }
        });
      }
    }

    // Add scheduled jobs
    if (jobs && Array.isArray(jobs)) {
      for (const job of jobs) {
        if (job.scheduledDate) {
          events.push({
            id: `job-${job.id}`,
            title: `${job.title} - Scheduled`,
            start: job.scheduledDate,
            end: new Date(new Date(job.scheduledDate).getTime() + 2 * 60 * 60 * 1000).toISOString(), // Add 2 hours
            backgroundColor: '#004080',
            borderColor: '#004080',
            extendedProps: { type: 'job' }
          });
        }
      }
    }

    return events;
  }, [scheduleSlots, appointmentProposals, jobs]);

  const pendingProposals = React.useMemo(() => {
    return appointmentProposals.filter((proposal: any) => proposal.status === 'pending');
  }, [appointmentProposals]);

  if (isLoadingSlots || isLoadingProposals || isLoadingJobs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Calendar...</CardTitle>
          <CardDescription>Please wait while we load your scheduling data</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Your Calendar</CardTitle>
            <CardDescription>
              Manage your availability and appointments
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsScheduleDialogOpen(true)}
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Add Availability
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCalendarSyncOpen(true)}
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              Sync Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            height="auto"
            aspectRatio={1.5}
            events={calendarEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            nowIndicator={true}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short'
            }}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '08:00',
              endTime: '18:00',
            }}
            slotDuration="00:30:00"
            allDaySlot={false}
          />
        </CardContent>
      </Card>

      {pendingProposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Appointments</CardTitle>
            <CardDescription>
              Review and respond to appointment requests from clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingProposals.map((proposal: any) => {
                const job = jobs?.find((j: any) => j.id === proposal.jobId);
                return (
                  <div key={proposal.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">
                          {job?.title || 'Job Request'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job?.description?.substring(0, 100)}
                          {job?.description?.length > 100 ? '...' : ''}
                        </p>
                      </div>
                      <Badge>Pending Response</Badge>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="font-medium">Proposed Date: </span>
                        {format(parseISO(proposal.proposedTime), 'PPP')}
                      </div>
                      <div>
                        <span className="font-medium">Proposed Time: </span>
                        {format(parseISO(proposal.proposedTime), 'p')}
                      </div>
                      <div>
                        <span className="font-medium">Client: </span>
                        {job?.homeownerName || 'Unknown Client'}
                      </div>
                      <div>
                        <span className="font-medium">Notes: </span>
                        {proposal.notes || 'No additional notes'}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Implement rejection logic
                          setSelectedAppointment(proposal);
                        }}
                      >
                        Decline
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          // Implement acceptance logic
                          setSelectedAppointment(proposal);
                        }}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Availability Slot</CardTitle>
              <CardDescription>
                {selectedSlot.isBooked 
                  ? 'This time slot is already booked.' 
                  : 'This time slot is currently available.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Start Time:</p>
                  <p>{format(parseISO(selectedSlot.startTime), 'PPP p')}</p>
                </div>
                <div>
                  <p className="font-medium">End Time:</p>
                  <p>{format(parseISO(selectedSlot.endTime), 'PPP p')}</p>
                </div>
              </div>
            </CardContent>
            <div className="p-4 bg-muted/20 flex justify-end gap-2 border-t">
              <Button 
                variant="outline" 
                onClick={() => setSelectedSlot(null)}
              >
                Close
              </Button>
              {!selectedSlot.isBooked && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleSlotDelete(selectedSlot.id);
                    setSelectedSlot(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Slot
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Date selection dialog with time pickers */}
      <AppointmentDialog 
        open={isScheduleDialogOpen} 
        onOpenChange={setIsScheduleDialogOpen}
        selectedDate={selectedDate}
        onSubmit={handleSlotCreate}
      />

      {/* Calendar sync dialog */}
      <CalendarSyncDialog
        open={isCalendarSyncOpen}
        onOpenChange={setIsCalendarSyncOpen}
      />
    </div>
  );
}
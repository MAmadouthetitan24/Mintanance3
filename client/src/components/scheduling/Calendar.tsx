import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ScheduleSlot, Job } from "@shared/schema";
import { formatDateTime } from "@/lib/utils";

interface CalendarProps {
  userId: number;
  userRole: "homeowner" | "contractor";
}

export default function Calendar({ userId, userRole }: CalendarProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [isAddSlotOpen, setIsAddSlotOpen] = useState<boolean>(false);
  const [newSlotDate, setNewSlotDate] = useState<string>("");
  const [newSlotStartTime, setNewSlotStartTime] = useState<string>("");
  const [newSlotEndTime, setNewSlotEndTime] = useState<string>("");
  
  // Start and end of the current week
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  // Generate an array of dates for the current week
  const weekDates = Array(7).fill(0).map((_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });
  
  // Fetch schedule slots
  const { data: scheduleSlots, isLoading } = useQuery<ScheduleSlot[]>({
    queryKey: [`/api/schedule-slots/${userRole === 'contractor' ? 'contractor' : 'available/contractor'}/${userId}`],
  });
  
  // Fetch jobs
  const { data: jobs } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });
  
  // Create a new schedule slot
  const createSlotMutation = useMutation({
    mutationFn: async (data: { startTime: string, endTime: string }) => {
      const res = await apiRequest("POST", "/api/schedule-slots", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Schedule slot created",
        description: "Your availability has been added to the calendar.",
      });
      setIsAddSlotOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/schedule-slots/contractor/${userId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create schedule slot. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Book a schedule slot
  const bookSlotMutation = useMutation({
    mutationFn: async (data: { slotId: number, jobId: number }) => {
      const res = await apiRequest("PATCH", `/api/schedule-slots/${data.slotId}`, { 
        isBooked: true,
        jobId: data.jobId
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment booked",
        description: "Your appointment has been scheduled successfully.",
      });
      setSelectedSlot(null);
      queryClient.invalidateQueries({ queryKey: [`/api/schedule-slots/available/contractor/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Filter slots for the current week
  const filterSlotsForWeek = () => {
    if (!scheduleSlots) return [];
    
    return scheduleSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return slotDate >= startOfWeek && slotDate <= endOfWeek;
    });
  };
  
  // Group slots by day
  const getSlotsByDay = (dayIndex: number) => {
    const slots = filterSlotsForWeek();
    const dayDate = weekDates[dayIndex];
    
    return slots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return (
        slotDate.getDate() === dayDate.getDate() &&
        slotDate.getMonth() === dayDate.getMonth() &&
        slotDate.getFullYear() === dayDate.getFullYear()
      );
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };
  
  // Handle navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };
  
  // Handle slot creation
  const handleCreateSlot = () => {
    if (!newSlotDate || !newSlotStartTime || !newSlotEndTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    const startTimeDate = new Date(`${newSlotDate}T${newSlotStartTime}`);
    const endTimeDate = new Date(`${newSlotDate}T${newSlotEndTime}`);
    
    if (endTimeDate <= startTimeDate) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }
    
    createSlotMutation.mutate({
      startTime: startTimeDate.toISOString(),
      endTime: endTimeDate.toISOString(),
    });
  };
  
  // Get available jobs for booking
  const getAvailableJobs = () => {
    if (!jobs) return [];
    
    return jobs.filter(job => 
      job.status === "matched" && 
      job.contractorId === userId && 
      !job.scheduledDate
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-semibold text-gray-900">Calendar</h2>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
            {endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {userRole === 'contractor' && (
            <Button size="sm" onClick={() => setIsAddSlotOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Availability
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <div className="grid grid-cols-7 gap-4 text-center">
            {weekDates.map((date, index) => (
              <div key={index}>
                <p className="text-sm font-medium text-gray-500">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className={`text-lg font-semibold ${
                  date.toDateString() === new Date().toDateString() 
                    ? 'text-primary-600' 
                    : 'text-gray-900'
                }`}>
                  {date.getDate()}
                </p>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-4">
            {weekDates.map((date, dayIndex) => (
              <div key={dayIndex} className="min-h-[200px] border rounded-md p-2">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getSlotsByDay(dayIndex).map((slot) => {
                      const startTime = new Date(slot.startTime);
                      const endTime = new Date(slot.endTime);
                      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // in minutes
                      
                      // Get the associated job if any
                      const slotJob = jobs?.find(job => job.id === slot.jobId);
                      
                      return (
                        <div 
                          key={slot.id} 
                          className={`p-2 rounded-md text-xs cursor-pointer ${
                            slot.isBooked 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                          }`}
                          onClick={() => !slot.isBooked && userRole === 'homeowner' && setSelectedSlot(slot)}
                        >
                          <p className="font-medium">
                            {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - 
                            {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                          <p>{Math.round(duration / 60 * 10) / 10} hours</p>
                          {slot.isBooked && slotJob && (
                            <p className="mt-1 truncate font-medium">{slotJob.title}</p>
                          )}
                        </div>
                      );
                    })}
                    
                    {getSlotsByDay(dayIndex).length === 0 && (
                      <p className="text-xs text-gray-500 text-center mt-4">No slots available</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Add Slot Dialog */}
      <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">Date</label>
              <Input
                id="date"
                type="date"
                value={newSlotDate}
                onChange={(e) => setNewSlotDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="startTime" className="text-sm font-medium">Start Time</label>
                <Input
                  id="startTime"
                  type="time"
                  value={newSlotStartTime}
                  onChange={(e) => setNewSlotStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="endTime" className="text-sm font-medium">End Time</label>
                <Input
                  id="endTime"
                  type="time"
                  value={newSlotEndTime}
                  onChange={(e) => setNewSlotEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSlotOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSlot} disabled={createSlotMutation.isPending}>
              {createSlotMutation.isPending ? 'Creating...' : 'Add Slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Book Slot Dialog */}
      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4 py-4">
              <p>
                <span className="font-medium">Date:</span> {formatDateTime(selectedSlot.startTime)}
              </p>
              <p>
                <span className="font-medium">Duration:</span> {
                  Math.round(
                    (new Date(selectedSlot.endTime).getTime() - new Date(selectedSlot.startTime).getTime()) 
                    / (1000 * 60 * 60) * 10
                  ) / 10
                } hours
              </p>
              
              <div className="space-y-2">
                <label htmlFor="job" className="text-sm font-medium">Select a Job</label>
                <Select onValueChange={(value) => {
                  if (selectedSlot && value) {
                    bookSlotMutation.mutate({
                      slotId: selectedSlot.id,
                      jobId: parseInt(value)
                    });
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableJobs().length > 0 ? (
                      getAvailableJobs().map((job) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No available jobs</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSlot(null)}>Cancel</Button>
            <Button disabled={getAvailableJobs().length === 0 || bookSlotMutation.isPending}>
              {bookSlotMutation.isPending ? 'Booking...' : 'Book Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

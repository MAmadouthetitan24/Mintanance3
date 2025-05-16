import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface CalendarSyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarSyncDialog({ isOpen, onClose }: CalendarSyncDialogProps) {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<string>('google');
  
  // Fetch current calendar integrations
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['/api/calendar-integrations'],
  });
  
  // Connect to external calendar
  const connectCalendarMutation = useMutation({
    mutationFn: async (data: { provider: string }) => {
      return apiRequest('/api/calendar-integrations/connect', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-integrations'] });
      
      // For Google/Outlook - redirect to OAuth flow
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast({
          title: 'Connected',
          description: `Successfully connected to ${provider} calendar.`,
        });
        onClose();
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Could not connect to external calendar. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Disconnect calendar integration
  const disconnectCalendarMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/calendar-integrations/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-integrations'] });
      toast({
        title: 'Disconnected',
        description: 'Calendar integration has been removed.',
      });
    },
  });
  
  // Toggle auto-sync
  const toggleSyncMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest(`/api/calendar-integrations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-integrations'] });
    },
  });
  
  const handleConnectCalendar = () => {
    connectCalendarMutation.mutate({ provider });
  };
  
  const handleDisconnectCalendar = (id: number) => {
    disconnectCalendarMutation.mutate(id);
  };
  
  const handleToggleSync = (id: number, currentState: boolean) => {
    toggleSyncMutation.mutate({ id, isActive: !currentState });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Calendar Integration</DialogTitle>
          <DialogDescription>
            Sync your Mintenance schedule with your external calendars
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Existing Integrations */}
          {integrations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Connected Calendars</h3>
              <div className="space-y-2">
                {integrations.map((integration: any) => (
                  <Card key={integration.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)} Calendar
                          </CardTitle>
                          <CardDescription>{integration.calendarId}</CardDescription>
                        </div>
                        <Badge variant={integration.isActive ? 'default' : 'outline'}>
                          {integration.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor={`sync-toggle-${integration.id}`} className="flex items-center gap-2">
                          Auto-sync
                          <span className="text-xs text-muted-foreground">
                            {integration.isActive ? 'Enabled' : 'Disabled'}
                          </span>
                        </Label>
                        <Switch
                          id={`sync-toggle-${integration.id}`}
                          checked={integration.isActive}
                          onCheckedChange={() => handleToggleSync(integration.id, integration.isActive)}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="flex justify-end w-full">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDisconnectCalendar(integration.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Connect New Calendar */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Add Calendar</h3>
            <RadioGroup 
              value={provider} 
              onValueChange={setProvider}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="google" id="google" />
                <Label htmlFor="google">Google Calendar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outlook" id="outlook" />
                <Label htmlFor="outlook">Outlook Calendar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="apple" id="apple" />
                <Label htmlFor="apple">Apple Calendar</Label>
              </div>
            </RadioGroup>
            
            <div className="pt-2">
              <Button 
                onClick={handleConnectCalendar}
                disabled={connectCalendarMutation.isPending}
                className="w-full"
              >
                {connectCalendarMutation.isPending ? 'Connecting...' : 'Connect Calendar'}
              </Button>
            </div>
          </div>
          
          {/* Note about calendar sync */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              When enabled, your availability and appointments from Mintenance will sync with your external calendar. 
              Your personal events will be considered when suggesting available times to homeowners.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
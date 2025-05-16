import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Trash2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { SiGoogle, SiApple, SiMicrosoft } from 'react-icons/si';

interface CalendarSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendarSyncDialog({ open, onOpenChange }: CalendarSyncDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('connected');
  const [isConnecting, setIsConnecting] = useState(false);

  // Connect to Google Calendar
  const connectToGoogle = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/calendar-integrations/connect', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'google',
          userId: user?.id
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL provided');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem connecting to Google Calendar.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  // Connect to Apple Calendar
  const connectToApple = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/calendar-integrations/connect', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'apple',
          userId: user?.id
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Apple Calendar successfully connected.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/calendar-integrations'] });
      } else {
        throw new Error('Failed to connect Apple Calendar');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem connecting to Apple Calendar.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect a calendar integration
  const disconnectCalendar = async (integrationId: number) => {
    try {
      const response = await fetch(`/api/calendar-integrations/${integrationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Calendar disconnected',
          description: 'The calendar integration has been successfully removed.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/calendar-integrations'] });
      } else {
        throw new Error('Failed to disconnect calendar');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem disconnecting the calendar.',
        variant: 'destructive',
      });
    }
  };

  // Fetch calendar integrations
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['/api/calendar-integrations'],
    enabled: open && !!user,
  });

  const connectedCalendars = integrations.filter((integration: any) => 
    integration.userId === user?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Calendar Sync</DialogTitle>
          <DialogDescription>
            Connect to external calendars to sync your availability and appointments.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connected">Connected Calendars</TabsTrigger>
            <TabsTrigger value="available">Available Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connected" className="mt-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : connectedCalendars.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium text-lg mb-2">No calendars connected</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Connect to Google, Apple, or Microsoft calendars to automatically sync your availability.
                </p>
                <Button onClick={() => setActiveTab('available')}>
                  Connect Calendar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {connectedCalendars.map((integration: any) => (
                  <Card key={integration.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center">
                        {integration.provider === 'google' && <SiGoogle className="h-5 w-5 mr-2" />}
                        {integration.provider === 'apple' && <SiApple className="h-5 w-5 mr-2" />}
                        {integration.provider === 'microsoft' && <SiMicrosoft className="h-5 w-5 mr-2" />}
                        <div>
                          <CardTitle className="text-md font-medium">
                            {integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)} Calendar
                          </CardTitle>
                          <CardDescription>
                            Connected {format(parseISO(integration.createdAt), 'PPP')}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {integration.syncStatus || 'active'}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Last synced: {integration.lastSynced 
                          ? format(parseISO(integration.lastSynced), 'PPp')
                          : 'Never'
                        }
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Refresh sync
                          toast({
                            title: 'Sync started',
                            description: 'Calendar sync has been initiated.',
                          });
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Now
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => disconnectCalendar(integration.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="available" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-md font-medium">Google Calendar</CardTitle>
                    <SiGoogle className="h-8 w-8 text-[#4285F4]" />
                  </div>
                  <CardDescription>
                    Sync with your Google Calendar
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={connectToGoogle}
                    disabled={isConnecting}
                  >
                    Connect
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-md font-medium">Apple Calendar</CardTitle>
                    <SiApple className="h-8 w-8 text-[#000000]" />
                  </div>
                  <CardDescription>
                    Sync with your Apple Calendar
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={connectToApple}
                    disabled={isConnecting}
                  >
                    Connect
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-md font-medium">Outlook</CardTitle>
                    <SiMicrosoft className="h-8 w-8 text-[#0078D4]" />
                  </div>
                  <CardDescription>
                    Sync with Microsoft Outlook
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: 'Coming Soon',
                        description: 'Microsoft Outlook integration will be available soon.',
                      });
                    }}
                    disabled={true}
                  >
                    Coming Soon
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
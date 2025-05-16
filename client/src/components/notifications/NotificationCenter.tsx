import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useWebSocketListener } from '@/lib/websocket';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

// Type for notifications
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  jobId?: number;
  timestamp: string;
  read: boolean;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Listen for job match notifications
  useWebSocketListener('new_job_match', (data) => {
    // Create a new notification from the WebSocket message
    const newNotification: Notification = {
      id: `job-${data.jobId}-${Date.now()}`,
      type: 'job_match',
      title: 'New Job Match!',
      message: data.message || `You've been matched with a new job: ${data.title}`,
      jobId: data.jobId,
      timestamp: data.timestamp || new Date().toISOString(),
      read: false
    };
    
    // Add to notifications list
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast notification
    toast({
      title: newNotification.title,
      description: newNotification.message,
      action: (
        <Link href={`/jobs/${data.jobId}`}>
          <Button variant="link" size="sm">View Job</Button>
        </Link>
      )
    });
  });
  
  // Calculate unread count whenever notifications change
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };
  
  // If user isn't logged in, don't show notifications
  if (!user) return null;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <Bell className="h-5 w-5" />
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="h-7 text-xs"
                disabled={unreadCount === 0}
              >
                Mark all read
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAll} 
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            <BellOff className="mx-auto h-6 w-6 mb-2" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${notification.read ? 'opacity-70' : 'bg-muted/30'}`}
                onClick={() => markAsRead(notification.id)}
              >
                <Link href={notification.jobId ? `/jobs/${notification.jobId}` : '#'}>
                  <div className="w-full">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{notification.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
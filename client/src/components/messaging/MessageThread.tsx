import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, ChevronLeft, Info } from "lucide-react";
import type { Job, Message, User } from "@shared/schema";
import { getInitials, formatDateTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface MessageThreadProps {
  jobId: number;
  otherUserId: number;
  currentUserId: number;
  onBack?: () => void;
  isMobile?: boolean;
}

export default function MessageThread({ 
  jobId, 
  otherUserId, 
  currentUserId,
  onBack,
  isMobile = false 
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Fetch job details
  const { data: job, isLoading: isLoadingJob } = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
  });
  
  // Fetch other user's details
  const { data: otherUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/users/${otherUserId}`],
  });
  
  // Fetch messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: [`/api/messages/job/${jobId}`],
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { jobId: number, receiverId: number, content: string }) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return res.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/job/${jobId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/user'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("PATCH", `/api/messages/${messageId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/job/${jobId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/user'] });
    }
  });
  
  // Scroll to bottom of messages on load or new message
  useEffect(() => {
    if (messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Mark unread messages as read when viewed
  useEffect(() => {
    if (messages) {
      messages
        .filter(msg => msg.receiverId === currentUserId && !msg.isRead)
        .forEach(msg => markAsReadMutation.mutate(msg.id));
    }
  }, [messages, currentUserId, markAsReadMutation]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      jobId,
      receiverId: otherUserId,
      content: newMessage.trim()
    });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center">
        {isMobile && (
          <Button variant="ghost" size="icon" className="mr-2" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        
        {isLoadingUser || isLoadingJob ? (
          <div className="flex items-center">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="ml-3">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ) : (
          <>
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.profileImage} />
              <AvatarFallback className="bg-primary-100 text-primary-700">
                {getInitials(otherUser?.name || 'User')}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="font-medium text-gray-900">{otherUser?.name}</p>
              <p className="text-sm text-gray-500">{job?.title}</p>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto" asChild>
              <a href={`/job-detail/${jobId}`}>
                <Info className="h-5 w-5" />
              </a>
            </Button>
          </>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, index) => (
              <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] ${index % 2 === 0 ? 'bg-gray-100' : 'bg-primary-100'} rounded-lg p-3`}>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {messages.map((message) => {
              const isCurrentUser = message.senderId === currentUserId;
              
              return (
                <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${
                    isCurrentUser 
                      ? 'bg-primary-100 text-primary-800 rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg'
                  } p-3`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(message.createdAt)}
                      {isCurrentUser && (
                        <span className="ml-2">
                          {message.isRead ? '• Read' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="bg-gray-100 rounded-full p-4 mb-3">
              <i className="ri-message-3-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
            <p className="text-gray-500 max-w-md">
              Send your first message to start the conversation.
            </p>
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end">
          <Textarea
            placeholder="Type a message..."
            className="flex-1 resize-none"
            rows={2}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button 
            className="ml-2 h-10 w-10 p-2 rounded-full"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            onClick={handleSendMessage}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

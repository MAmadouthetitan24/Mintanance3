import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Job, Message } from "@shared/schema";
import { getInitials, getTimeAgo } from "@/lib/utils";

interface MessageListProps {
  userId: number;
  selectedJobId?: number;
  selectedUserId?: number;
}

export default function MessageList({ userId, selectedJobId, selectedUserId }: MessageListProps) {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch user's jobs
  const { data: jobs, isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch user's messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages/user'],
    staleTime: 30000, // 30 seconds
  });
  
  // Group messages by job and other user
  const getConversations = () => {
    if (!messages || !jobs) return [];
    
    const conversationMap = new Map<string, {
      jobId: number;
      jobTitle: string;
      otherUserId: number;
      otherUserName: string;
      otherUserImage?: string;
      lastMessage: Message;
      unreadCount: number;
    }>();
    
    messages.forEach(message => {
      const isIncoming = message.senderId !== userId;
      const otherUserId = isIncoming ? message.senderId : message.receiverId;
      const job = jobs.find(j => j.id === message.jobId);
      
      if (!job) return;
      
      const key = `${message.jobId}-${otherUserId}`;
      
      if (!conversationMap.has(key) || new Date(message.createdAt) > new Date(conversationMap.get(key)!.lastMessage.createdAt)) {
        const otherUserName = isIncoming 
          ? (job.homeownerId === otherUserId ? job.homeownerName : job.contractorName) 
          : (job.homeownerId === otherUserId ? job.homeownerName : job.contractorName);
        
        conversationMap.set(key, {
          jobId: message.jobId,
          jobTitle: job.title,
          otherUserId,
          otherUserName: otherUserName || 'User',
          lastMessage: message,
          unreadCount: (!message.isRead && isIncoming) ? 1 : 0
        });
      } else if (!message.isRead && isIncoming) {
        const conversation = conversationMap.get(key)!;
        conversation.unreadCount += 1;
        conversationMap.set(key, conversation);
      }
    });
    
    // Convert map to array, sort by last message time (newest first)
    return Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime())
      .filter(conv => 
        searchTerm === "" || 
        conv.otherUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };
  
  const conversations = getConversations();
  
  return (
    <div className="w-full md:w-80 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoadingJobs || isLoadingMessages ? (
          <div className="space-y-2 p-2">
            {Array(5).fill(0).map((_, index) => (
              <div key={index} className="p-3 rounded-md">
                <div className="flex items-start">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="ml-3 flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <div>
            {conversations.map(conversation => (
              <Link 
                key={`${conversation.jobId}-${conversation.otherUserId}`}
                href={`/messaging/${conversation.jobId}/${conversation.otherUserId}`}
              >
                <a className={`block p-3 hover:bg-gray-50 ${
                  selectedJobId === conversation.jobId && selectedUserId === conversation.otherUserId
                    ? 'bg-primary-50'
                    : ''
                }`}>
                  <div className="flex items-start">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.otherUserImage} />
                      <AvatarFallback className="bg-primary-100 text-primary-700">
                        {getInitials(conversation.otherUserName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm text-gray-900 truncate">{conversation.otherUserName}</p>
                        <span className="text-xs text-gray-500">{getTimeAgo(conversation.lastMessage.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-1">{conversation.jobTitle}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage.senderId === userId ? 'You: ' : ''}
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="bg-primary-100 text-primary-700 hover:bg-primary-100">
                            {conversation.unreadCount} new
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <i className="ri-message-3-line text-xl text-gray-400"></i>
            </div>
            <p className="mb-1">No conversations yet</p>
            <p className="text-sm">Messages for your jobs will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

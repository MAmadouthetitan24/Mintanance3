import { useState, useEffect } from "react";
import { useRequireAuth } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import MainLayout from "@/components/layout/MainLayout";
import MessageList from "@/components/messaging/MessageList";
import MessageThread from "@/components/messaging/MessageThread";
import { MessageSquare } from "lucide-react";

export default function Messaging() {
  const { user, isReady } = useRequireAuth();
  const isMobile = useIsMobile();
  const [showThread, setShowThread] = useState(!isMobile);
  
  // Get job ID and user ID from URL if provided
  const pathname = window.location.pathname;
  const pathParts = pathname.split('/').filter(Boolean);
  const hasThreadParams = pathParts.length === 3 && pathParts[0] === 'messaging';
  
  const jobId = hasThreadParams ? parseInt(pathParts[1]) : undefined;
  const otherUserId = hasThreadParams ? parseInt(pathParts[2]) : undefined;
  
  // On mobile, show the thread if URL has thread params
  useEffect(() => {
    if (isMobile && hasThreadParams) {
      setShowThread(true);
    }
  }, [isMobile, hasThreadParams]);
  
  const handleThreadBack = () => {
    setShowThread(false);
  };
  
  if (!isReady || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <MainLayout title="Messages">
      <div className="flex h-[calc(100vh-12rem)]">
        {(!isMobile || !showThread) && (
          <MessageList 
            userId={user.id} 
            selectedJobId={jobId} 
            selectedUserId={otherUserId} 
          />
        )}
        
        {(!isMobile || showThread) && (
          <div className="flex-1 flex flex-col">
            {jobId && otherUserId ? (
              <MessageThread 
                jobId={jobId} 
                otherUserId={otherUserId} 
                currentUserId={user.id} 
                onBack={handleThreadBack}
                isMobile={isMobile}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-700 mb-2">Select a conversation</h2>
                <p className="text-gray-500 max-w-md">
                  Choose a conversation from the list or start a new one from your jobs page.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

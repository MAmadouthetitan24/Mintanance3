import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Job } from "@shared/schema";
import { getInitials, getJobStatusColor, getJobStatusText, getTimeAgo } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  userRole: "homeowner" | "contractor";
}

export default function JobCard({ job, userRole }: JobCardProps) {
  const statusStyles = getJobStatusColor(job.status);
  
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className={`status-pill ${statusStyles.bgColor} ${statusStyles.textColor}`}>
            {getJobStatusText(job.status)}
          </span>
          <span className="text-sm text-gray-500">{getTimeAgo(job.createdAt)}</span>
        </div>
        
        <h3 className="font-medium text-gray-900 mb-1">{job.title}</h3>
        
        <p className="text-sm text-gray-500 mb-3">
          {job.scheduledDate 
            ? `Scheduled for ${new Date(job.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
            : job.preferredDate ? `Preferred date: ${job.preferredDate}, ${job.preferredTime}` : 'No date scheduled yet'
          }
        </p>
        
        {userRole === "homeowner" && job.contractorId ? (
          <div className="flex items-center mb-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary-100 text-primary-700">
                {getInitials(job.contractorName || 'C')}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{job.contractorName || 'Assigned Contractor'}</p>
              <div className="flex items-center">
                <i className="ri-star-fill text-yellow-400 text-sm"></i>
                <span className="text-xs text-gray-500 ml-1">{job.contractorRating || '4.8'} reviews</span>
              </div>
            </div>
          </div>
        ) : userRole === "contractor" && job.homeownerId ? (
          <div className="flex items-center mb-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary-100 text-primary-700">
                {getInitials(job.homeownerName || 'H')}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{job.homeownerName || 'Homeowner'}</p>
              <p className="text-xs text-gray-500">{job.location || 'No location specified'}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <i className="ri-user-search-line text-gray-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {userRole === "homeowner" ? "Finding contractors..." : "Waiting for match"}
              </p>
              <p className="text-xs text-gray-500">Matching in progress</p>
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          {(userRole === "homeowner" && job.contractorId) || 
           (userRole === "contractor" && ["matched", "scheduled", "in_progress"].includes(job.status)) ? (
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/messaging/${job.id}/${userRole === "homeowner" ? job.contractorId : job.homeownerId}`}>
                <i className="ri-message-3-line mr-1"></i> Message
              </Link>
            </Button>
          ) : null}
          
          <Button 
            className={`flex-1 ${userRole === "contractor" ? "bg-secondary-600 hover:bg-secondary-700" : "bg-primary-600 hover:bg-primary-700"}`} 
            asChild
          >
            <Link href={`/job-detail/${job.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

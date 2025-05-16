import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, Wrench, ArrowRight } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { Link } from 'wouter';

interface JobCardProps {
  id: number;
  title: string;
  tradeType?: string;
  location?: string;
  status: string;
  createdAt: Date;
  scheduledFor?: Date | null;
  isContractor?: boolean;
  estimatedCost?: number | null;
  actualCost?: number | null;
}

export function JobCard({
  id,
  title,
  tradeType,
  location,
  status,
  createdAt,
  scheduledFor,
  isContractor = false,
  estimatedCost,
  actualCost
}: JobCardProps) {
  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'matched':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-lg text-gray-900 line-clamp-1">{title}</h3>
            <Badge className={`ml-2 ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </Badge>
          </div>
          
          <div className="space-y-2 mb-3 text-sm text-gray-600">
            {tradeType && (
              <div className="flex items-center">
                <Wrench className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{tradeType}</span>
              </div>
            )}
            
            {location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{formatDistance(new Date(createdAt), new Date(), { addSuffix: true })}</span>
            </div>
            
            {scheduledFor && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{new Date(scheduledFor).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          {(estimatedCost || actualCost) && (
            <div className="text-right mt-1 font-medium">
              {actualCost ? (
                <span className="text-green-700">${actualCost.toFixed(2)}</span>
              ) : estimatedCost ? (
                <span className="text-gray-700">Est. ${estimatedCost.toFixed(2)}</span>
              ) : null}
            </div>
          )}
        </div>
        
        <div className="bg-white p-4 pt-2 flex justify-end">
          <Link href={`/job-detail/${id}`}>
            <Button variant="ghost" className="text-primary hover:bg-primary/5 hover:text-primary/90 p-0 h-8">
              View Details <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
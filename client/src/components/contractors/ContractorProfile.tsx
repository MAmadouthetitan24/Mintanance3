import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatDate, getInitials, getRandomProfileColor } from "@/lib/utils";

import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Briefcase, 
  Award,
  Check,
  MessageSquare
} from "lucide-react";

import ContractorReviews from "./ContractorReviews";
import AvailabilityCalendar from "./AvailabilityCalendar";

interface ContractorProfileProps {
  contractorId: string;
  jobId?: number;
  onSendMessage?: () => void;
  onSchedule?: () => void;
}

export default function ContractorProfile({ 
  contractorId, 
  jobId,
  onSendMessage,
  onSchedule
}: ContractorProfileProps) {
  const [activeTab, setActiveTab] = useState("about");
  
  // Fetch contractor data
  const { data: contractor, isLoading } = useQuery({
    queryKey: [`/api/users/${contractorId}`],
    enabled: !!contractorId,
  });
  
  // Fetch contractor trades
  const { data: contractorTrades } = useQuery({
    queryKey: [`/api/contractors/${contractorId}/trades`],
    enabled: !!contractorId,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!contractor) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Contractor information not found</p>
      </div>
    );
  }
  
  const fullName = `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim() || 'Contractor';
  
  return (
    <div className="space-y-6">
      {/* Contractor Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Avatar className="h-24 w-24 border-2 border-white shadow-md">
              {contractor.profileImageUrl ? (
                <AvatarImage src={contractor.profileImageUrl} alt={fullName} />
              ) : (
                <AvatarFallback className={`text-xl bg-${getRandomProfileColor()}-500`}>
                  {getInitials(fullName)}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 text-center md:text-left space-y-2">
              <h2 className="text-2xl font-bold">{fullName}</h2>
              
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {contractorTrades?.map((trade: any) => (
                  <Badge key={trade.id} variant="secondary">
                    {trade.name}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="h-4 w-4" 
                    fill={i < Math.round(contractor.averageRating || 0) ? "currentColor" : "none"} 
                  />
                ))}
                <span className="text-gray-500 text-sm ml-1">
                  ({contractor.reviewCount || 0} reviews)
                </span>
              </div>
              
              {contractor.location && (
                <div className="flex items-center justify-center md:justify-start gap-1 text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{contractor.location}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              {onSendMessage && (
                <Button onClick={onSendMessage} variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              )}
              
              {onSchedule && (
                <Button onClick={onSchedule} size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultValue="about" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="space-y-6">
          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              {contractor.bio ? (
                <p className="text-gray-700">{contractor.bio}</p>
              ) : (
                <p className="text-gray-500 italic">No bio provided</p>
              )}
            </CardContent>
          </Card>
          
          {/* Services & Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Services & Experience</CardTitle>
            </CardHeader>
            <CardContent>
              {contractorTrades && contractorTrades.length > 0 ? (
                <div className="space-y-4">
                  {contractorTrades.map((trade: any) => (
                    <div key={trade.id} className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">{trade.name}</h3>
                        {trade.isVerified && (
                          <Badge variant="outline" className="ml-auto">
                            <Check className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      
                      {trade.yearsOfExperience > 0 && (
                        <div className="ml-7 mt-1 text-sm text-gray-500">
                          {trade.yearsOfExperience} {trade.yearsOfExperience === 1 ? 'year' : 'years'} of experience
                        </div>
                      )}
                      
                      <Separator className="my-3" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No services or experience information available</p>
              )}
            </CardContent>
          </Card>
          
          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Certifications & Qualifications</CardTitle>
            </CardHeader>
            <CardContent>
              {contractor.certifications && contractor.certifications.length > 0 ? (
                <div className="space-y-2">
                  {contractor.certifications.map((cert: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <Award className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{cert.name}</h4>
                        {cert.issuer && (
                          <p className="text-sm text-gray-500">
                            {cert.issuer}{cert.year ? ` • ${cert.year}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No certifications listed</p>
              )}
            </CardContent>
          </Card>
          
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contractor.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{contractor.email}</span>
                  </div>
                )}
                
                {contractor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{contractor.phone}</span>
                  </div>
                )}
                
                {(!contractor.email && !contractor.phone) && (
                  <p className="text-gray-500 italic">No contact information available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reviews">
          <ContractorReviews contractorId={contractorId} />
        </TabsContent>
        
        <TabsContent value="availability">
          <AvailabilityCalendar contractorId={contractorId} jobId={jobId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
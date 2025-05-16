import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { User, Review } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, formatDate } from "@/lib/utils";
import { ChevronLeft, MapPin, Phone, Mail, Calendar, Star } from "lucide-react";

interface ContractorProfileProps {
  contractorId: number;
}

export default function ContractorProfile({ contractorId }: ContractorProfileProps) {
  // Fetch contractor details
  const { data: contractor, isLoading: isLoadingContractor } = useQuery<User>({
    queryKey: [`/api/users/${contractorId}`],
  });
  
  // Fetch contractor's reviews
  const { data: reviews, isLoading: isLoadingReviews } = useQuery<Review[]>({
    queryKey: [`/api/reviews/contractor/${contractorId}`],
  });
  
  if (isLoadingContractor) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-40 mb-4" />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="mt-4 md:mt-0 md:ml-6">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          <div className="mt-6 border-t pt-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!contractor) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Contractor Not Found</h1>
        <p className="mb-6">The contractor profile you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }
  
  // Calculate rating stats
  const calculateRatingStats = () => {
    if (!reviews || reviews.length === 0) {
      return {
        average: 0,
        counts: [0, 0, 0, 0, 0],
        total: 0
      };
    }
    
    const counts = [0, 0, 0, 0, 0]; // 5-star, 4-star, etc.
    let sum = 0;
    
    reviews.forEach(review => {
      sum += review.rating;
      counts[5 - review.rating]++;
    });
    
    return {
      average: sum / reviews.length,
      counts,
      total: reviews.length
    };
  };
  
  const ratingStats = calculateRatingStats();
  
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={contractor.profileImage || undefined} />
              <AvatarFallback className="bg-primary-100 text-primary-700 text-2xl">
                {getInitials(contractor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 md:mt-0 md:ml-6">
              <CardTitle className="text-2xl">{contractor.name}</CardTitle>
              <p className="text-gray-500">{contractor.tradeName || 'Professional Contractor'}</p>
              <div className="flex items-center mt-2">
                <div className="flex">
                  {Array(5).fill(0).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(contractor.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  {contractor.averageRating?.toFixed(1) || '0.0'} ({contractor.reviewCount || '0'} reviews)
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="about">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Bio</h3>
                  <p className="text-gray-700 mt-2">
                    {contractor.bio || 'No bio provided.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium">Contact Information</h3>
                    <ul className="mt-2 space-y-2">
                      {contractor.email && (
                        <li className="flex items-center text-gray-700">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          {contractor.email}
                        </li>
                      )}
                      {contractor.phone && (
                        <li className="flex items-center text-gray-700">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {contractor.phone}
                        </li>
                      )}
                      {contractor.city && (
                        <li className="flex items-center text-gray-700">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          {contractor.city}{contractor.state ? `, ${contractor.state}` : ''}
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Experience</h3>
                    <ul className="mt-2 space-y-2">
                      {contractor.tradeExperience ? (
                        contractor.tradeExperience.map((exp, index) => (
                          <li key={index} className="text-gray-700">
                            <span className="font-medium">{exp.tradeName}</span>: {exp.years} years
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">Experience information not available</li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                  <Button asChild>
                    <Link href="/job-request">
                      Request Service
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews">
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-3xl font-bold">{ratingStats.average.toFixed(1)}</span>
                        <div className="ml-4">
                          <div className="flex">
                            {Array(5).fill(0).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-5 w-5 ${i < Math.floor(ratingStats.average) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-500">{ratingStats.total} reviews</p>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block w-80">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center">
                          <span className="text-xs text-gray-500 w-8">{stars} star</span>
                          <div className="w-48 h-2 mx-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${ratingStats.total ? (ratingStats.counts[5-stars] / ratingStats.total * 100) : 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 w-6">{ratingStats.counts[5-stars]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {isLoadingReviews ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center mb-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="ml-3">
                              <Skeleton className="h-4 w-32 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <div className="mb-2">
                            <Skeleton className="h-3 w-20" />
                          </div>
                          <Skeleton className="h-12 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center mb-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gray-100 text-gray-700">
                                {getInitials(review.homeownerName || 'C')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-3">
                              <p className="font-medium">{review.homeownerName || 'Homeowner'}</p>
                              <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex mb-2">
                            {Array(5).fill(0).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium">No Reviews Yet</h3>
                    <p className="text-gray-500">This contractor hasn't received any reviews yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

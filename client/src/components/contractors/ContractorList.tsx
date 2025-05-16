import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { User, Trade } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContractorListProps {
  jobId?: number;
  onSelectContractor?: (contractorId: number) => void;
}

export default function ContractorList({ jobId, onSelectContractor }: ContractorListProps) {
  const [selectedTradeId, setSelectedTradeId] = useState<string>("");
  
  // Fetch trades
  const { data: trades, isLoading: isLoadingTrades } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
    staleTime: Infinity, // This data rarely changes
  });
  
  // Fetch contractors by trade
  const { data: contractors, isLoading: isLoadingContractors } = useQuery<User[]>({
    queryKey: [`/api/contractors/by-trade/${selectedTradeId}`],
    enabled: !!selectedTradeId,
  });
  
  // Fetch recommended contractors for a job
  const { data: recommendedContractors, isLoading: isLoadingRecommended } = useQuery<User[]>({
    queryKey: [`/api/jobs/${jobId}/matching-contractors`],
    enabled: !!jobId,
  });
  
  const handleTradeChange = (value: string) => {
    setSelectedTradeId(value);
  };
  
  const displayContractors = jobId ? recommendedContractors : contractors;
  const isLoading = jobId ? isLoadingRecommended : isLoadingContractors;
  
  return (
    <div className="space-y-6">
      {!jobId && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-heading font-semibold text-gray-900">Find Contractors</h2>
          
          <div className="mt-3 sm:mt-0 w-full sm:w-64">
            <Select onValueChange={handleTradeChange} value={selectedTradeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a trade" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTrades ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  trades?.map((trade) => (
                    <SelectItem key={trade.id} value={trade.id.toString()}>
                      {trade.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array(6).fill(0).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="ml-4">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mt-4" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-9 w-full mt-4" />
              </CardContent>
            </Card>
          ))
        ) : displayContractors && displayContractors.length > 0 ? (
          displayContractors.map((contractor) => (
            <Card key={contractor.id}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={contractor.profileImage || undefined} />
                    <AvatarFallback className="bg-primary-100 text-primary-700 text-xl">
                      {getInitials(contractor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <h3 className="font-medium text-lg">{contractor.name}</h3>
                    <p className="text-gray-500 text-sm">{contractor.tradeName || 'Contractor'}</p>
                    <div className="flex items-center mt-1">
                      <div className="flex">
                        {Array(5).fill(0).map((_, i) => (
                          <i 
                            key={i} 
                            className={`ri-star-${i < Math.floor(contractor.averageRating || 0) ? 'fill' : 'line'} text-yellow-400 text-sm`}
                          ></i>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">
                        {contractor.averageRating?.toFixed(1) || '0.0'} ({contractor.reviewCount || '0'})
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-4 line-clamp-2">
                  {contractor.bio || 'Professional contractor available for quality work.'}
                </p>
                
                {onSelectContractor ? (
                  <Button 
                    className="w-full mt-4"
                    onClick={() => onSelectContractor(contractor.id)}
                  >
                    Select Contractor
                  </Button>
                ) : (
                  <Button className="w-full mt-4" asChild>
                    <Link href={`/contractor/${contractor.id}`}>
                      View Profile
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center p-6 bg-white rounded-lg shadow">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="ri-user-search-line text-xl text-gray-400"></i>
            </div>
            {selectedTradeId ? (
              <>
                <h3 className="text-lg font-medium mb-2">No contractors found</h3>
                <p className="text-gray-500">
                  No contractors available for the selected trade. Try selecting a different trade.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">Select a trade</h3>
                <p className="text-gray-500">
                  Please select a trade to see available contractors.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

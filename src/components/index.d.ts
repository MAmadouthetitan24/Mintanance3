import { FC } from 'react';
import type { Job } from '../services/api';

interface JobCardProps {
  job: Job;
  onPress?: () => void;
}

interface StatsCardProps {
  label: string;
  value: number;
  icon: string;
  trend?: number;
  isCurrency?: boolean;
}

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

interface ErrorMessageProps {
  message: string;
}

export const JobCard: FC<JobCardProps>;
export const StatsCard: FC<StatsCardProps>;
export const FilterButton: FC<FilterButtonProps>;
export const LoadingSpinner: FC;
export const ErrorMessage: FC<ErrorMessageProps>;
export const BidList: FC; 
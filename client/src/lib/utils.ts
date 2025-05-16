import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '$0.00';
  
  // Convert from cents to dollars
  const dollars = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(dateObj);
}

export function getInitials(name: string | undefined | null): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function truncateText(text: string | undefined | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
}

export function getDaysFromNow(date: string | Date): string {
  const now = new Date();
  const compareDate = typeof date === 'string' ? new Date(date) : date;
  
  const diffTime = Math.abs(compareDate.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  
  return `In ${diffDays} days`;
}

export function getTimeAgo(date: string | Date): string {
  const now = new Date();
  const compareDate = typeof date === 'string' ? new Date(date) : date;
  
  const diffTime = now.getTime() - compareDate.getTime();
  const diffSeconds = Math.floor(diffTime / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(compareDate);
}

export function getJobStatusColor(status: string): {
  bgColor: string;
  textColor: string;
} {
  switch(status) {
    case 'pending':
      return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    case 'matched':
      return { bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
    case 'scheduled':
      return { bgColor: 'bg-purple-100', textColor: 'text-purple-800' };
    case 'in_progress':
      return { bgColor: 'bg-secondary-100', textColor: 'text-secondary-800' };
    case 'completed':
      return { bgColor: 'bg-green-100', textColor: 'text-green-800' };
    case 'cancelled':
      return { bgColor: 'bg-red-100', textColor: 'text-red-800' };
    default:
      return { bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
}

export function getJobStatusText(status: string): string {
  switch(status) {
    case 'pending':
      return 'Pending';
    case 'matched':
      return 'Contractor Matched';
    case 'scheduled':
      return 'Scheduled';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  }
}

export function getRandomProfileColor(): string {
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-secondary-100 text-secondary-700',
    'bg-purple-100 text-purple-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

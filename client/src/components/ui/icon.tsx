import React from 'react';
import {
  Search,
  CheckCircle,
  FileText,
  MessageSquare,
  Calendar,
  Home,
  User,
  Settings,
  Bell,
  LogOut,
  Mail,
  Briefcase,
  Clock,
  DollarSign,
  Star,
  CheckSquare,
  X,
  Send,
  Plus,
  ChevronLeft,
  Menu,
  MoreVertical,
  HelpCircle,
  AlertCircle,
  Info
} from 'lucide-react';

// This component provides a replacement for the remix-icon classes
// that were previously used throughout the application
export interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = "" }: IconProps) {
  const size = className.includes('text-3xl') ? 24 : 
               className.includes('text-2xl') ? 20 : 
               className.includes('text-xl') ? 18 : 16;
  
  const iconProps = {
    size,
    className
  };

  // Map the ri-* classes to the corresponding Lucide icons
  switch (name) {
    case 'ri-search-line':
      return <Search {...iconProps} />;
    case 'ri-check-line':
      return <CheckCircle {...iconProps} />;
    case 'ri-file-list-3-line':
      return <FileText {...iconProps} />;
    case 'ri-message-3-line':
      return <MessageSquare {...iconProps} />;
    case 'ri-calendar-line':
      return <Calendar {...iconProps} />;
    case 'ri-home-line':
      return <Home {...iconProps} />;
    case 'ri-user-line':
      return <User {...iconProps} />;
    case 'ri-settings-3-line':
      return <Settings {...iconProps} />;
    case 'ri-notification-line':
      return <Bell {...iconProps} />;
    case 'ri-logout-box-line':
      return <LogOut {...iconProps} />;
    case 'ri-mail-line':
      return <Mail {...iconProps} />;
    case 'ri-briefcase-line':
      return <Briefcase {...iconProps} />;
    case 'ri-time-line':
      return <Clock {...iconProps} />;
    case 'ri-money-dollar-circle-line':
      return <DollarSign {...iconProps} />;
    case 'ri-star-line':
      return <Star {...iconProps} />;
    case 'ri-checkbox-circle-line':
      return <CheckSquare {...iconProps} />;
    case 'ri-close-line':
      return <X {...iconProps} />;
    case 'ri-send-plane-fill':
      return <Send {...iconProps} />;
    case 'ri-add-line':
      return <Plus {...iconProps} />;
    case 'ri-arrow-left-s-line':
      return <ChevronLeft {...iconProps} />;
    case 'ri-menu-line':
      return <Menu {...iconProps} />;
    case 'ri-more-2-fill':
      return <MoreVertical {...iconProps} />;
    case 'ri-question-line':
      return <HelpCircle {...iconProps} />;
    case 'ri-error-warning-line':
      return <AlertCircle {...iconProps} />;
    case 'ri-information-line':
      return <Info {...iconProps} />;
    default:
      console.warn(`Unknown icon name: ${name}`);
      return <div className={className}>{name}</div>;
  }
}
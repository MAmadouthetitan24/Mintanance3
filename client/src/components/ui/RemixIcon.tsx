import React from 'react';
import { 
  Search, File, CheckCircle, MessageSquare, Calendar, 
  Home, User, Settings, Bell, LogOut, 
  Mail, Briefcase, Clock, DollarSign, Star, 
  CheckSquare, X, Send, Plus, ChevronLeft,
  ChevronRight, Upload, Wrench as Tool, BarChart3, FileCheck,
  Wrench, Paintbrush, Scissors, Thermometer, MoreHorizontal,
  MapPin
} from 'lucide-react';

type IconProps = {
  className?: string;
};

// This component serves as a replacement for Remix Icons
// It maps the ri-* classes to appropriate Lucide React icons
export const RemixIcon: React.FC<React.PropsWithChildren<IconProps>> = ({ children, className = '' }) => {
  if (!children || typeof children !== 'string') {
    return null;
  }

  const iconName = children.toString();
  const size = className.includes('text-3xl') ? 24 : 
              className.includes('text-2xl') ? 20 : 
              className.includes('text-xl') ? 18 : 16;

  const iconProps = {
    size,
    className
  };

  // Map ri-* names to Lucide icons
  if (iconName.includes('ri-search-line')) return <Search {...iconProps} />;
  if (iconName.includes('ri-file-list-3-line')) return <File {...iconProps} />;
  if (iconName.includes('ri-check-line')) return <CheckCircle {...iconProps} />;
  if (iconName.includes('ri-message-3-line')) return <MessageSquare {...iconProps} />;
  if (iconName.includes('ri-calendar-line')) return <Calendar {...iconProps} />;
  if (iconName.includes('ri-home-line') || iconName.includes('ri-home-4-line')) return <Home {...iconProps} />;
  if (iconName.includes('ri-user-line')) return <User {...iconProps} />;
  if (iconName.includes('ri-settings-3-line')) return <Settings {...iconProps} />;
  if (iconName.includes('ri-notification-line') || iconName.includes('ri-notification-3-line')) return <Bell {...iconProps} />;
  if (iconName.includes('ri-logout-box-line') || iconName.includes('ri-logout-box-r-line')) return <LogOut {...iconProps} />;
  if (iconName.includes('ri-mail-line')) return <Mail {...iconProps} />;
  if (iconName.includes('ri-briefcase-line')) return <Briefcase {...iconProps} />;
  if (iconName.includes('ri-time-line')) return <Clock {...iconProps} />;
  if (iconName.includes('ri-money-dollar-circle-line')) return <DollarSign {...iconProps} />;
  if (iconName.includes('ri-star-line') || iconName.includes('ri-star-fill')) return <Star {...iconProps} />;
  if (iconName.includes('ri-checkbox-circle-line')) return <CheckSquare {...iconProps} />;
  if (iconName.includes('ri-close-line')) return <X {...iconProps} />;
  if (iconName.includes('ri-send-plane-fill')) return <Send {...iconProps} />;
  if (iconName.includes('ri-add-line')) return <Plus {...iconProps} />;
  if (iconName.includes('ri-arrow-left-s-line')) return <ChevronLeft {...iconProps} />;
  if (iconName.includes('ri-arrow-right-s-line')) return <ChevronRight {...iconProps} />;
  if (iconName.includes('ri-upload-cloud-2-line')) return <Upload {...iconProps} />;
  if (iconName.includes('ri-tools-line')) return <Tool {...iconProps} />;
  if (iconName.includes('ri-user-search-line')) return <User {...iconProps} />;
  if (iconName.includes('ri-line-chart-line')) return <BarChart3 {...iconProps} />;
  if (iconName.includes('ri-task-line')) return <FileCheck {...iconProps} />;
  if (iconName.includes('ri-hammer-line')) return <Wrench {...iconProps} />;
  if (iconName.includes('ri-brush-line')) return <Paintbrush {...iconProps} />;
  if (iconName.includes('ri-scissors-line')) return <Scissors {...iconProps} />;
  if (iconName.includes('ri-heating-line')) return <Thermometer {...iconProps} />;
  if (iconName.includes('ri-more-line')) return <MoreHorizontal {...iconProps} />;
  if (iconName.includes('ri-map-pin-line')) return <MapPin {...iconProps} />;
  
  // Default fallback
  return <span className={className}></span>;
};
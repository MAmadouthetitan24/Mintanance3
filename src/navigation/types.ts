export type RootStackParamList = {
  // Auth Screens
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  // Main Screens
  Dashboard: undefined;
  
  // Job Related
  Jobs: undefined;
  JobDetail: { jobId: string };
  NewJob: undefined;
  JobBids: { jobId: number };
  
  // Appointment Related
  Appointments: undefined;
  AppointmentDetail: { appointmentId: number };
  
  // Messaging
  Messaging: undefined;
  ChatRoom: { jobId: number; contractorId: string };
  
  // Profile & Settings
  Profile: undefined;
  ContractorProfile: { contractorId: string };
  Settings: undefined;
  
  // Payment Related
  Payment: { jobId: string };
  PaymentHistory: undefined;
  
  // Job Sheets
  JobSheet: { jobId: number };
  JobSheetSignature: { jobId: number };
  
  // Misc
  NotFound: undefined;

  // Chat
  Chat: { jobId: string; contractorId: string };

  // Notifications
  Notifications: undefined;
}; 
import { storage } from '../storage';
import { Notification, User } from '@shared/schema';

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface NotificationPayload {
  type: 'job_request' | 'job_update' | 'payment' | 'message';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export async function sendNotification(userId: string, notification: NotificationPayload): Promise<void> {
  try {
    // Create notification in database
    await storage.createNotification({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: false,
      createdAt: new Date(),
    });

    // If we have push notification tokens for the user, send push notification
    const user = await storage.getUser(userId);
    if (user?.pushTokens?.length) {
      // Implement push notification logic here
      // This could use Firebase Cloud Messaging, Apple Push Notifications, etc.
    }

    // If user has email notifications enabled, send email
    const preferences = user?.notificationPreferences as NotificationPreferences | undefined;
    if (preferences?.email) {
      // Implement email notification logic here
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw error to prevent payment flow from failing
  }
} 
import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';
import { z } from 'zod';
import { payments, type Payment, type Job, type User } from '../../shared/schema';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface PaymentWithDetails {
  id: number;
  jobId: number;
  userId: string;
  amount: string | number;
  currency: string;
  status: string;
  method: string;
  transactionId: string | null;
  receiptUrl: string | null;
  error: string | null;
  refundId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  job?: Job;
  client?: User;
}

interface Refund {
  id: number;
  amount: number;
  createdAt: Date;
  status: string;
}

interface ServiceStats {
  revenue: number;
  count: number;
}

type PaymentAnalytics = {
  totalPayments: number;
  totalRevenue: number;
  averagePayment: number;
  paymentsByDay: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  topServices: Array<{ service: string; revenue: number; count: number }>;
};

// Get payment analytics
router.get('/payment-analytics', isAuthenticated, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Only allow admin and contractors to view analytics
    if (!['admin', 'contractor'].includes(user.role)) {
      res.status(403).json({ error: 'Not authorized to view analytics' });
      return;
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get all completed payments in date range
    const completedPayments = await storage.getPaymentsByDateRange(start, end, {
      status: 'completed',
      ...(user.role === 'contractor' ? { contractorId: user.id } : {}),
    });

    // Load job and client details for each payment
    const paymentsWithDetails: PaymentWithDetails[] = await Promise.all(
      completedPayments.map(async (payment) => {
        const job = await storage.getJob(payment.jobId);
        const client = job ? await storage.getUser(job.homeownerId) : undefined;
        return { 
          ...payment, 
          job: job || undefined,
          client: client || undefined
        };
      })
    );

    // Calculate analytics
    const analytics: PaymentAnalytics = {
      totalPayments: paymentsWithDetails.length,
      totalRevenue: paymentsWithDetails.reduce((sum: number, payment: PaymentWithDetails) => sum + Number(payment.amount), 0),
      averagePayment: paymentsWithDetails.length > 0
        ? paymentsWithDetails.reduce((sum: number, payment: PaymentWithDetails) => sum + Number(payment.amount), 0) / paymentsWithDetails.length
        : 0,
      paymentsByDay: {},
      paymentMethodBreakdown: {},
      topServices: [],
    };

    // Calculate daily payments
    paymentsWithDetails.forEach((payment: PaymentWithDetails) => {
      const date = payment.createdAt ? new Date(payment.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      analytics.paymentsByDay[date] = (analytics.paymentsByDay[date] || 0) + Number(payment.amount);
      analytics.paymentMethodBreakdown[payment.method] = (analytics.paymentMethodBreakdown[payment.method] || 0) + 1;
    });

    // Calculate top services
    const serviceStats = paymentsWithDetails.reduce<Record<string, ServiceStats>>((acc, payment: PaymentWithDetails) => {
      if (!payment.job) return acc;
      const service = payment.job.title;
      if (!acc[service]) {
        acc[service] = { revenue: 0, count: 0 };
      }
      acc[service].revenue += Number(payment.amount);
      acc[service].count += 1;
      return acc;
    }, {});

    analytics.topServices = Object.entries(serviceStats)
      .map(([service, stats]) => ({
        service,
        revenue: stats.revenue,
        count: stats.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get refund statistics
    const refunds = await storage.getRefundsByDateRange(start, end, {
      ...(user.role === 'contractor' ? { contractorId: user.id } : {}),
    });

    const refundAnalytics = {
      totalRefunds: refunds.length,
      totalRefundAmount: refunds.reduce((sum, refund) => sum + Number(refund.amount), 0),
      refundRate: paymentsWithDetails.length > 0
        ? (refunds.length / paymentsWithDetails.length) * 100
        : 0,
    };

    res.json({
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      payments: analytics,
      refunds: refundAnalytics,
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch payment analytics' });
  }
});

// Get detailed payment report
router.get('/payment-report', isAuthenticated, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Only allow admin and contractors to view reports
    if (!['admin', 'contractor'].includes(user.role)) {
      res.status(403).json({ error: 'Not authorized to view reports' });
      return;
    }

    const { startDate, endDate, format = 'json' } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get all payments in date range with job and client details
    const payments = await storage.getPaymentsByDateRange(start, end, {
      ...(user.role === 'contractor' ? { contractorId: user.id } : {}),
    });

    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment: Payment) => {
        const job = await storage.getJob(payment.jobId);
        const client = job ? await storage.getUser(job.homeownerId) : undefined;
        return { ...payment, job, client };
      })
    );

    if (format === 'csv') {
      // Generate CSV report
      const csv = [
        'Date,Job ID,Service,Amount,Status,Payment Method,Customer,Receipt URL',
        ...paymentsWithDetails.map((payment) => [
          payment.createdAt ? new Date(payment.createdAt).toISOString() : '',
          payment.jobId,
          payment.job?.title || '',
          payment.amount,
          payment.status,
          payment.method,
          payment.client?.firstName ? `${payment.client.firstName} ${payment.client.lastName || ''}` : '',
          payment.receiptUrl || '',
        ].join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=payment-report-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.csv`);
      res.send(csv);
      return;
    }

    // Return JSON report
    res.json({
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      payments: paymentsWithDetails.map((payment) => ({
        id: payment.id,
        date: payment.createdAt,
        jobId: payment.jobId,
        service: payment.job?.title || '',
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        customer: payment.client?.firstName ? `${payment.client.firstName} ${payment.client.lastName || ''}` : '',
        receiptUrl: payment.receiptUrl || '',
      })),
    });
  } catch (error) {
    console.error('Error generating payment report:', error);
    res.status(500).json({ error: 'Failed to generate payment report' });
  }
});

export default router; 
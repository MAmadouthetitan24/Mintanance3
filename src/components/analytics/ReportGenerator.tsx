import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AnalyticsService } from '../../services/AnalyticsService';

interface ReportGeneratorProps {
  contractorId?: string;
  startDate?: Date;
  endDate?: Date;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  contractorId,
  startDate,
  endDate,
}) => {
  const [generating, setGenerating] = useState(false);
  const analyticsService = AnalyticsService.getInstance();

  const generateReport = async () => {
    try {
      setGenerating(true);

      // Collect all metrics
      const metrics = contractorId
        ? await analyticsService.getContractorMetrics(contractorId)
        : null;
      const customerMetrics = await analyticsService.getCustomerSatisfactionMetrics();
      const revenueMetrics = await analyticsService.getRevenueMetrics();
      const marketTrends = await analyticsService.getMarketTrends();

      // Generate HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .section { margin: 20px 0; }
              .metric { margin: 10px 0; }
              .chart { margin: 20px 0; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            <h1>HomeFixConnector Analytics Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            
            ${contractorId && metrics ? `
              <div class="section">
                <h2>Contractor Performance</h2>
                <table>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                  </tr>
                  <tr>
                    <td>Total Jobs</td>
                    <td>${metrics.totalJobs}</td>
                  </tr>
                  <tr>
                    <td>Completed Jobs</td>
                    <td>${metrics.completedJobs}</td>
                  </tr>
                  <tr>
                    <td>Average Rating</td>
                    <td>${metrics.averageRating.toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td>Total Revenue</td>
                    <td>$${metrics.totalRevenue.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Response Time</td>
                    <td>${metrics.responseTime.toFixed(1)} hours</td>
                  </tr>
                  <tr>
                    <td>Customer Satisfaction</td>
                    <td>${metrics.customerSatisfaction.toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td>Repeat Customers</td>
                    <td>${metrics.repeatCustomers}</td>
                  </tr>
                  <tr>
                    <td>On-time Completion</td>
                    <td>${metrics.onTimeCompletion.toFixed(1)}%</td>
                  </tr>
                </table>
              </div>
            ` : ''}

            <div class="section">
              <h2>Customer Satisfaction</h2>
              <table>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
                <tr>
                  <td>Average Rating</td>
                  <td>${customerMetrics.averageRating.toFixed(1)}</td>
                </tr>
                <tr>
                  <td>Response Rate</td>
                  <td>${customerMetrics.responseRate.toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>Complaint Resolution</td>
                  <td>${customerMetrics.complaintResolution.toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>Customer Retention</td>
                  <td>${customerMetrics.customerRetention.toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>Net Promoter Score</td>
                  <td>${customerMetrics.netPromoterScore.toFixed(1)}</td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>Revenue Analysis</h2>
              <table>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
                <tr>
                  <td>Total Revenue</td>
                  <td>$${revenueMetrics.totalRevenue.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Average Job Value</td>
                  <td>$${revenueMetrics.averageJobValue.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Growth Rate</td>
                  <td>${revenueMetrics.growthRate.toFixed(1)}%</td>
                </tr>
              </table>

              <h3>Revenue by Trade</h3>
              <table>
                <tr>
                  <th>Trade</th>
                  <th>Revenue</th>
                </tr>
                ${Object.entries(revenueMetrics.revenueByTrade)
                  .map(([trade, revenue]) => `
                    <tr>
                      <td>${trade}</td>
                      <td>$${revenue.toLocaleString()}</td>
                    </tr>
                  `).join('')}
              </table>
            </div>

            <div class="section">
              <h2>Market Trends</h2>
              <h3>Popular Trades</h3>
              <table>
                <tr>
                  <th>Trade</th>
                  <th>Job Count</th>
                </tr>
                ${marketTrends.popularTrades
                  .slice(0, 5)
                  .map(({ trade, count }) => `
                    <tr>
                      <td>${trade}</td>
                      <td>${count}</td>
                    </tr>
                  `).join('')}
              </table>

              <h3>Location Demand</h3>
              <table>
                <tr>
                  <th>Location</th>
                  <th>Demand</th>
                </tr>
                ${Object.entries(marketTrends.locationDemand)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([location, demand]) => `
                    <tr>
                      <td>${location}</td>
                      <td>${demand}</td>
                    </tr>
                  `).join('')}
              </table>
            </div>
          </body>
        </html>
      `;

      // Save HTML to file
      const fileUri = `${FileSystem.documentDirectory}analytics-report.html`;
      await FileSystem.writeAsStringAsync(fileUri, htmlContent);

      // Share the file
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'Analytics Report',
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.generateButton}
        onPress={generateReport}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Generate Report</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
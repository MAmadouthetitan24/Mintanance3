import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { AnalyticsService, ContractorMetrics, CustomerSatisfactionMetrics, RevenueMetrics, MarketTrends } from '../../services/AnalyticsService';

interface AnalyticsDashboardProps {
  contractorId?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  contractorId,
}) => {
  const [loading, setLoading] = useState(true);
  const [contractorMetrics, setContractorMetrics] = useState<ContractorMetrics | null>(null);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerSatisfactionMetrics | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrends | null>(null);
  const analyticsService = AnalyticsService.getInstance();

  useEffect(() => {
    loadData();
  }, [contractorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (contractorId) {
        const metrics = await analyticsService.getContractorMetrics(contractorId);
        setContractorMetrics(metrics);
      }
      const customerMetrics = await analyticsService.getCustomerSatisfactionMetrics();
      const revenueMetrics = await analyticsService.getRevenueMetrics();
      const marketTrends = await analyticsService.getMarketTrends();

      setCustomerMetrics(customerMetrics);
      setRevenueMetrics(revenueMetrics);
      setMarketTrends(marketTrends);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView style={styles.container}>
      {contractorId && contractorMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contractor Performance</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{contractorMetrics.totalJobs}</Text>
              <Text style={styles.metricLabel}>Total Jobs</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{contractorMetrics.completedJobs}</Text>
              <Text style={styles.metricLabel}>Completed Jobs</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{contractorMetrics.averageRating.toFixed(1)}</Text>
              <Text style={styles.metricLabel}>Average Rating</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>${contractorMetrics.totalRevenue.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Total Revenue</Text>
            </View>
          </View>
        </View>
      )}

      {customerMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Satisfaction</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={[
                {
                  name: 'Promoters',
                  population: customerMetrics.netPromoterScore,
                  color: '#4CAF50',
                  legendFontColor: '#7F7F7F',
                },
                {
                  name: 'Passives',
                  population: 100 - customerMetrics.netPromoterScore,
                  color: '#FFC107',
                  legendFontColor: '#7F7F7F',
                },
              ]}
              width={screenWidth - 40}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
            />
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{customerMetrics.responseRate.toFixed(1)}%</Text>
              <Text style={styles.metricLabel}>Response Rate</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{customerMetrics.customerRetention.toFixed(1)}%</Text>
              <Text style={styles.metricLabel}>Customer Retention</Text>
            </View>
          </View>
        </View>
      )}

      {revenueMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Analysis</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: Object.keys(revenueMetrics.revenueByMonth).slice(-6),
                datasets: [
                  {
                    data: Object.values(revenueMetrics.revenueByMonth).slice(-6),
                  },
                ],
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>${revenueMetrics.totalRevenue.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Total Revenue</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{revenueMetrics.growthRate.toFixed(1)}%</Text>
              <Text style={styles.metricLabel}>Growth Rate</Text>
            </View>
          </View>
        </View>
      )}

      {marketTrends && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Trends</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: marketTrends.popularTrades.slice(0, 5).map(t => t.trade),
                datasets: [
                  {
                    data: marketTrends.popularTrades.slice(0, 5).map(t => t.count),
                  },
                ],
              }}
              width={screenWidth - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              style={styles.chart}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metricCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  chartContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 
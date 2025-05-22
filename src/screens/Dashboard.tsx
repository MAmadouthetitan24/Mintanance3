import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useQuery } from '@tanstack/react-query';
import { fetchJobs, fetchStats, type Job, type Stats } from '../services/api';
import { JobCard } from '../components/JobCard.js';
import { StatsCard } from '../components/StatsCard.js';
import { FilterButton } from '../components/FilterButton.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { ErrorMessage } from '../components/ErrorMessage.js';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = React.useState('active');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch jobs data
  const { 
    data: jobs, 
    isLoading: jobsLoading, 
    error: jobsError,
    refetch: refetchJobs 
  } = useQuery({
    queryKey: ['jobs', activeFilter],
    queryFn: () => fetchJobs(activeFilter),
  });

  // Fetch stats data
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchJobs(), refetchStats()]);
    setRefreshing(false);
  }, [refetchJobs, refetchStats]);

  if (jobsLoading || statsLoading) {
    return <LoadingSpinner />;
  }

  if (jobsError || statsError) {
    return <ErrorMessage message="Failed to load dashboard data" />;
  }

  const safeStats: Stats = stats || {
    activeJobs: 0,
    completedJobs: 0,
    earnings: 0,
    activeJobsTrend: 0,
    completedJobsTrend: 0,
    earningsTrend: 0,
  };

  const safeJobs: Job[] = jobs || [];

  return (
    <View style={styles.container}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatsCard
            label="Active Jobs"
            value={safeStats.activeJobs}
            icon="briefcase"
            trend={safeStats.activeJobsTrend}
          />
          <StatsCard
            label="Completed"
            value={safeStats.completedJobs}
            icon="checkmark-circle"
            trend={safeStats.completedJobsTrend}
          />
          <StatsCard
            label="Earnings"
            value={safeStats.earnings}
            icon="cash"
            trend={safeStats.earningsTrend}
            isCurrency
          />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <FilterButton
            label="Active Jobs"
            isActive={activeFilter === 'active'}
            onPress={() => setActiveFilter('active')}
          />
          <FilterButton
            label="Completed"
            isActive={activeFilter === 'completed'}
            onPress={() => setActiveFilter('completed')}
          />
          <FilterButton
            label="All"
            isActive={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
        </View>

        {/* Jobs Grid */}
        <View style={styles.jobsGrid}>
          {safeJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
            />
          ))}
          {safeJobs.length === 0 && (
            <Text style={styles.noJobsText}>
              No jobs found for the selected filter
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('NewJob')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  jobsGrid: {
    padding: 16,
    gap: 16,
  },
  noJobsText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
}); 
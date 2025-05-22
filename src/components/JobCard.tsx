import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Job } from '../services/api';

interface JobCardProps {
  job: Job;
  onPress?: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {job.description || 'No description available'}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.date}>
          {job.date ? new Date(job.date).toLocaleDateString() : 'Not scheduled'}
        </Text>
        <Text style={styles.location}>
          {job.location}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999999',
  },
  location: {
    fontSize: 12,
    color: '#999999',
  },
}); 
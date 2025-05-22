import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button } from '@/components/ui';
import { format } from 'date-fns';

interface Contractor {
  id: string;
  name: string;
  rating: number;
  completedJobs: number;
}

interface JobDetails {
  id: string;
  title: string;
  description: string;
  category: {
    id: string;
    name: string;
  };
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  images: string[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  contractor: Contractor | null;
  createdAt: string;
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };
}

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

export default function JobDetailScreen({ route, navigation }: Props) {
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const jobId = route.params.jobId;

  useEffect(() => {
    fetchJobDetails();
  }, []);

  const fetchJobDetails = async () => {
    try {
      // This would fetch from your API
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();
      setJob(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: JobDetails['status']) => {
    switch (status) {
      case 'pending':
        return '#FCD34D';
      case 'assigned':
        return '#60A5FA';
      case 'in_progress':
        return '#34D399';
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getUrgencyColor = (urgency: JobDetails['urgency']) => {
    switch (urgency) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Job not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{job.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
            <Text style={styles.statusText}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{job.category.name}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Urgency</Text>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(job.urgency) }]}>
                <Text style={styles.urgencyText}>
                  {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Posted</Text>
              <Text style={styles.detailValue}>
                {format(new Date(job.createdAt), 'MMM d, yyyy')}
              </Text>
            </View>
            {job.estimatedCost && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Estimated Cost</Text>
                <Text style={styles.detailValue}>
                  {job.estimatedCost.currency}
                  {job.estimatedCost.min} - {job.estimatedCost.currency}
                  {job.estimatedCost.max}
                </Text>
              </View>
            )}
          </View>
        </View>

        {job.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {job.images.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={styles.image}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {job.contractor ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Contractor</Text>
            <View style={styles.contractorCard}>
              <Text style={styles.contractorName}>{job.contractor.name}</Text>
              <View style={styles.contractorDetails}>
                <Text style={styles.contractorStat}>
                  Rating: {job.contractor.rating.toFixed(1)}★
                </Text>
                <Text style={styles.contractorStat}>
                  {job.contractor.completedJobs} jobs completed
                </Text>
              </View>
              <Button
                variant="outline"
                onPress={() => navigation.navigate('Chat', {
                  jobId: jobId,
                  contractorId: job?.contractor?.id || ''
                })}
              >
                Message Contractor
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <Text style={styles.pendingText}>
              Waiting for contractor assignment...
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
  },
  contractorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contractorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  contractorDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  contractorStat: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 16,
  },
  pendingText: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
}); 
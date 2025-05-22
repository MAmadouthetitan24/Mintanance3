import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ImageUploader } from '../components/shared/ImageUploader';
import { Button } from '@/components/ui';
import { JobRequestForm, JobFormValues } from '../components/jobs/JobRequestForm';
import type { Category } from '../types/common';
import type { LocationObject } from 'expo-location';
import * as ExpoLocation from 'expo-location';

type Props = NativeStackScreenProps<RootStackParamList, 'NewJob'>;

export const JobRequestScreen: React.FC<Props> = ({ navigation }) => {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    requestLocationPermission();
    fetchCategories();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await ExpoLocation.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    } catch (error) {
      Alert.alert(
        'Location Access Required',
        'We need your location to find nearby contractors.'
      );
    }
  };

  const fetchCategories = async () => {
    try {
      // This would fetch from your API
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (values: JobFormValues) => {
    try {
      setLoading(true);

      if (!location) {
        Alert.alert('Location Required', 'Please enable location services to continue.');
        return;
      }

      const jobData = {
        ...values,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // This would submit to your API
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Your job request has been submitted. Contractors will be notified shortly.',
          [
            {
              text: 'View Job',
              onPress: () => navigation.replace('JobDetail', { jobId: result.id }),
            },
          ]
        );
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit job request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <JobRequestForm
            onSubmit={handleSubmit}
            categories={categories}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
}); 
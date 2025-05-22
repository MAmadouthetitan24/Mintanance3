import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+44 7700 900123',
  address: '123 Main St, London, UK',
  profilePicture: null,
  jobsCompleted: 12,
  rating: 4.8,
};

export default function ProfileScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profilePicContainer}>
          {mockUser.profilePicture ? (
            <Image source={{ uri: mockUser.profilePicture }} style={styles.profilePic} />
          ) : (
            <Ionicons name="person-circle" size={100} color="#007AFF" />
          )}
          <TouchableOpacity style={styles.editPicButton}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{mockUser.name}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mockUser.jobsCompleted}</Text>
          <Text style={styles.statLabel}>Jobs Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mockUser.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoItem}>
          <Ionicons name="mail" size={24} color="#666" />
          <Text style={styles.infoText}>{mockUser.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="call" size={24} color="#666" />
          <Text style={styles.infoText}>{mockUser.phone}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location" size={24} color="#666" />
          <Text style={styles.infoText}>{mockUser.address}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Ionicons name="log-out" size={24} color="#fff" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profilePicContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editPicButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 
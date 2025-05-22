import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Messaging'>;

const mockChats = [
  {
    id: '1',
    contractorId: 'contractor1',
    contractorName: 'John Smith',
    jobTitle: 'Leaky Tap',
    lastMessage: "I'll be there in 20 minutes",
    timestamp: '10:30 AM',
    unread: 2,
  },
  {
    id: '2',
    contractorId: 'contractor2',
    contractorName: 'Sarah Wilson',
    jobTitle: 'Boiler Service',
    lastMessage: 'The part has been ordered',
    timestamp: 'Yesterday',
    unread: 0,
  },
];

export default function MessagingScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('Chat', { 
              jobId: item.id,
              contractorId: item.contractorId
            })}
          >
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={50} color="#007AFF" />
            </View>
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={styles.contractorName}>{item.contractorName}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
              <Text style={styles.jobTitle}>{item.jobTitle}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    marginRight: 16,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  jobTitle: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 
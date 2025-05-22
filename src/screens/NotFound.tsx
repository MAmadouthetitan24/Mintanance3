import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NotFound'>;

export default function NotFoundScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorCode}>404</Text>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.message}>
        Sorry, we couldn't find that page.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Jobs')}
      >
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorCode: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
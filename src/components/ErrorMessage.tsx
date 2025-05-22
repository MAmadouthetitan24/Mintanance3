import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  message: string;
}

export const ErrorMessage: React.FC<Props> = ({ message }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={48} color="#DC2626" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
}); 
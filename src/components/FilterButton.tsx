import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export const FilterButton: React.FC<Props> = ({ label, isActive, onPress }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isActive && styles.containerActive
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.text,
        isActive && styles.textActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  containerActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  textActive: {
    color: '#fff',
  },
}); 
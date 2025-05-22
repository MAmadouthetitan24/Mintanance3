import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatsCardProps {
  label: string;
  value: number;
  icon: string;
  trend?: number;
  isCurrency?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  trend,
  isCurrency = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={icon as any} size={24} color="#666666" />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>
        {isCurrency ? `$${value.toLocaleString()}` : value.toLocaleString()}
      </Text>
      {trend !== undefined && (
        <View style={styles.trendContainer}>
          <Text
            style={[
              styles.trendValue,
              { color: trend >= 0 ? '#4CAF50' : '#F44336' },
            ]}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </Text>
          <Text style={styles.trendLabel}>vs last month</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  trendLabel: {
    fontSize: 12,
    color: '#999999',
  },
}); 
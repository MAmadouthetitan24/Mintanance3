import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Bid } from '../services/api';

interface Props {
  bids: Bid[];
  onAcceptBid?: (bid: Bid) => Promise<void>;
  onRejectBid?: (bid: Bid) => Promise<void>;
  isOwner: boolean;
}

export const BidList: React.FC<Props> = ({ 
  bids, 
  onAcceptBid, 
  onRejectBid, 
  isOwner 
}) => {
  const handleAcceptBid = async (bid: Bid) => {
    try {
      Alert.alert(
        'Accept Bid',
        `Are you sure you want to accept this bid for £${bid.amount}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Accept',
            onPress: async () => {
              if (onAcceptBid) {
                await onAcceptBid(bid);
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to accept bid. Please try again.');
    }
  };

  const handleRejectBid = async (bid: Bid) => {
    try {
      Alert.alert(
        'Reject Bid',
        'Are you sure you want to reject this bid?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: async () => {
              if (onRejectBid) {
                await onRejectBid(bid);
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reject bid. Please try again.');
    }
  };

  if (bids.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No bids yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {bids.map((bid) => (
        <View key={bid.id} style={styles.bidCard}>
          <View style={styles.bidHeader}>
            <View style={styles.contractorInfo}>
              <Text style={styles.contractorName}>
                {bid.contractor?.name || 'Anonymous'}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FBC02D" />
                <Text style={styles.rating}>{bid.contractor?.rating || 0}</Text>
              </View>
            </View>
            <Text style={styles.amount}>£{bid.amount}</Text>
          </View>
          
          {bid.message && (
            <Text style={styles.message}>{bid.message}</Text>
          )}
          
          <View style={styles.bidFooter}>
            <Text style={styles.completedJobs}>
              {bid.contractor?.completedJobs || 0} jobs completed
            </Text>
            <Text style={styles.date}>
              {new Date(bid.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {isOwner && bid.status === 'pending' && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleAcceptBid(bid)}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => handleRejectBid(bid)}
              >
                <Text style={[styles.buttonText, styles.rejectButtonText]}>
                  Reject
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {bid.status !== 'pending' && (
            <View style={[
              styles.statusBadge,
              bid.status === 'accepted' ? styles.acceptedBadge : styles.rejectedBadge
            ]}>
              <Text style={[
                styles.statusText,
                bid.status === 'accepted' ? styles.acceptedText : styles.rejectedText
              ]}>
                {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  bidCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#4B5563',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  message: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedJobs: {
    fontSize: 12,
    color: '#6B7280',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#059669',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  rejectButtonText: {
    color: '#DC2626',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  acceptedBadge: {
    backgroundColor: '#DEF7EC',
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  acceptedText: {
    color: '#059669',
  },
  rejectedText: {
    color: '#DC2626',
  },
}); 
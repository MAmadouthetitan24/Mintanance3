import React, { useState, useEffect, useMemo, useRef } from 'react';
import TinderCard from 'react-tinder-card';
import { useRouter } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ContractorSearchPage: React.FC = () => {
  const [location, setLocation] = useState('');
  const [trade, setTrade] = useState('');
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const childRefs: any = useMemo(() => Array(contractors.length).fill(0).map(i => React.createRef()), [contractors.length]);

  const getUserLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject(error);
          }
        );
      }
    });
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setContractors([]);
    setCurrentIndex(0);

    try {
      const userLocation = await getUserLocation();
      const response = await fetch(`/api/contractors/search?tradeId=${encodeURIComponent(trade)}&latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`);

      if (!response.ok) {
        throw new Error(`Error fetching contractors: ${response.statusText}`);
      }
      const data = await response.json();
      setContractors(data);

    } catch (err: any) {
      setError(err.message);
      setContractors([]);
    } finally {
      setLoading(false);
    }
  };

  const onSwipe = (direction: string, contractorId: string) => {
    console.log('You swiped: ' + direction + ' on ' + contractorId);
    setLastSwipeDirection(direction);

    if (direction === 'right') {
      // TODO: Call backend endpoint to record the "like" for this user and contractor
    }
  };

  const onCardLeftScreen = (direction: string, contractorId: string) => {
    console.log(contractorId + ' left the screen to the ' + direction);
  };

  const swipe = (dir: string) => {
    const cardsLeft = contractors.length - currentIndex;
    if (cardsLeft > 0) {
      const lastCardIndex = contractors.length - 1;
      if (childRefs[lastCardIndex - (cardsLeft - 1)] && childRefs[lastCardIndex - (cardsLeft - 1)].current) {
        childRefs[lastCardIndex - (cardsLeft - 1)].current.swipe(dir);
      }
    }
  };

  const navigateToProfile = (contractorId: string) => {
    router.push(`/contractors/${contractorId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Your Pro</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter Location"
            placeholderTextColor="#666"
            value={location}
            onChangeText={setLocation}
          />
        </View>
        <View style={styles.inputContainer}>
          <Ionicons name="briefcase-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Trade (e.g., Plumber, Electrician)"
            placeholderTextColor="#666"
            value={trade}
            onChangeText={setTrade}
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
          {loading ? (
            <Text style={styles.searchButtonText}>Searching...</Text>
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}

      <View style={styles.contractorCardsContainer}>
        {contractors.length > 0 ? (
          contractors.map((contractor: any, index) => (
            <TinderCard
              ref={childRefs[index]}
              key={contractor.id}
              onSwipe={(dir: string) => onSwipe(dir, contractor.id)}
              onCardLeftScreen={(dir: string) => onCardLeftScreen(dir, contractor.id)}
              preventSwipe={['up', 'down']}
            >
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigateToProfile(contractor.id)}
                activeOpacity={0.9}
              >
                <View style={styles.contractorImagePlaceholder}>
                  {contractor.profileImageUrl ? (
                    <Image source={{ uri: contractor.profileImageUrl }} style={styles.contractorImage} />
                  ) : (
                    <Ionicons name="person-circle-outline" size={60} color="#ccc" />
                  )}
                </View>
                <View style={styles.contractorInfo}>
                  <Text style={styles.contractorName}>{contractor.firstName} {contractor.lastName}</Text>
                  <Text style={styles.contractorTrade}>Trade: {contractor.tradeName || 'N/A'}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.contractorRating}>{contractor.averageRating ? contractor.averageRating.toFixed(1) : 'N/A'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </TinderCard>
          ))
        ) : (
          !loading && !error && <Text style={styles.noResultsText}>Search to find contractors</Text>
        )}
        {lastSwipeDirection && <Text key={lastSwipeDirection} style={styles.lastSwipeText}>You swiped {lastSwipeDirection}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  searchSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  contractorCardsContainer: {
    flex: 1,
    position: 'relative',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 350,
    height: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contractorImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  contractorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contractorInfo: {
    alignItems: 'center',
  },
  contractorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  contractorTrade: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contractorRating: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  lastSwipeText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
});

export default ContractorSearchPage;
import React, { useState, useEffect, useMemo, useRef } from 'react';
// Import the swipeable card library - you need to install this first: npm install react-tinder-card
import TinderCard from 'react-tinder-card'; // Assuming react-tinder-card library is used
import { useNavigate } from 'react-router-dom'; // Assuming you are using react-router-dom
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native'; // Assuming React Native components
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo icons are available


const ContractorSearchPage: React.FC = () => {
  const [location, setLocation] = useState('');
  const [trade, setTrade] = useState('');
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0); // To track the current card in the swipe stack

  const navigate = useNavigate(); // Hook for navigation

  // Refs for TinderCard (if using the library)
  const childRefs: any = useMemo(() => Array(contractors.length).fill(0).map(i => React.createRef()), [contractors.length]);


  // Function to get user's current location
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
    setContractors([]); // Clear previous results
    setCurrentIndex(0); // Reset index for new search

    try {
      const userLocation = await getUserLocation(); // Get user's location

      // Replace with actual API call using fetch or a library like axios
      const response = await fetch(`/api/contractors/search?tradeId=${encodeURIComponent(trade)}&latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`);

      if (!response.ok) {
        throw new Error(`Error fetching contractors: ${response.statusText}`);
      }
      const data = await response.json();
      setContractors(data);

    } catch (err: any) {
      setError(err.message);
       setContractors([]); // Ensure contractors is empty on error
    } finally {
      setLoading(false);
    }
  };

  // Handle swipe actions
  const onSwipe = (direction: string, contractorId: string) => {
    console.log('You swiped: ' + direction + ' on ' + contractorId);
    setLastSwipeDirection(direction);

    if (direction === 'right') {
      // User "liked" the contractor
      // TODO: Call backend endpoint to record the "like" for this user and contractor
      // Example: fetch(`/api/users/${currentUser.id}/liked-contractors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contractorId }) });
    }

     // Move to the next card (managed by the library, but updating index for tracking)
     // setCurrentIndex(prevIndex => prevIndex + 1); // Update index if needed for tracking
  };

   // Called when the card leaves the screen
   const onCardLeftScreen = (direction: string, contractorId: string) => {
     console.log(contractorId + ' left the screen to the ' + direction);
     // You might want to do something here, like pre-fetch the next batch of contractors
   };

   // Function to manually swipe (optional, for buttons)
   const swipe = (dir: string) => {
     const cardsLeft = contractors.length - currentIndex;
     if (cardsLeft > 0) {
        const lastCardIndex = contractors.length - 1;
        // Use the ref of the current card to trigger the swipe
        if (childRefs[lastCardIndex - (cardsLeft -1)] && childRefs[lastCardIndex - (cardsLeft -1)].current) {
             childRefs[lastCardIndex - (cardsLeft -1)].current.swipe(dir);
        }
     }
   };


   // Navigate to contractor profile
   const navigateToProfile = (contractorId: string) => {
       navigate(`/contractors/${contractorId}`);
   };


  return (
    <View style={styles.container}>
       {/* Header */}
       <View style={styles.header}>
         <Text style={styles.headerTitle}>Find Your Pro</Text>
       </View>

      {/* Search Input Section */}
      <View style={styles.searchSection}>
        <View style={styles.inputContainer}>
           <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
           {/* Location input - will be populated by getUserLocation or manual input */}
           <TextInput
            style={styles.input}
            placeholder="Enter Location" // Changed to allow manual input initially
            placeholderTextColor="#666"
            value={location}
            onChangeText={setLocation}
             // You might want to disable this after getting location
            // disabled={!location} // Example: disable after location is set
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
        {/* Swipeable Contractor Cards */}
        {contractors.length > 0 ? (
          // Map over contractors to create TinderCard components
          contractors.map((contractor: any, index) => (
            <TinderCard
              ref={childRefs[index]} // Ref for manual swiping
              key={contractor.id}
              onSwipe={(dir: string) => onSwipe(dir, contractor.id)}
              onCardLeftScreen={(dir: string) => onCardLeftScreen(dir, contractor.id)}
              preventSwipe={['up', 'down']} // Prevent vertical swipes
               swipeRequirementThreshold={50} // Adjust sensitivity as needed
            >
              {/* Individual Contractor Card Content */}
              <TouchableOpacity
                 style={styles.card}
                 onPress={() => navigateToProfile(contractor.id)} // Navigate on card press
                 activeOpacity={0.9} // Reduce opacity change on press
              >
                 {/* Placeholder for Image */}
                 <View style={styles.contractorImagePlaceholder}>
                    {contractor.profileImageUrl ? (
                       <Image source={{ uri: contractor.profileImageUrl }} style={styles.contractorImage} />
                    ) : (
                       <Ionicons name="person-circle-outline" size={60} color="#ccc" />
                    )}
                 </View>
                <View style={styles.contractorInfo}>
                   <Text style={styles.contractorName}>{contractor.firstName} {contractor.lastName}</Text>
                   {/* Assuming tradeName is available from the backend search endpoint */}
                   <Text style={styles.contractorTrade}>Trade: {contractor.tradeName || 'N/A'}</Text>
                   <View style={styles.ratingContainer}>
                     <Ionicons name="star" size={16} color="#FFD700" />
                     <Text style={styles.contractorRating}>{contractor.averageRating ? contractor.averageRating.toFixed(1) : 'N/A'}</Text>
                   </View>
                </View>
                 {/* Add more details here later as needed for the card preview */}
              </TouchableOpacity>
            </TinderCard>
          ))
        ) : (
          !loading && !error && <Text style={styles.noResultsText}>Search to find contractors</Text>
        )}
         {lastSwipeDirection && <Text key={lastSwipeDirection} style={styles.lastSwipeText}>You swiped {lastSwipeDirection}</Text>} {/* Display swipe direction */}
      </View>

       {/* Optional buttons for swiping - uncomment and style as needed */}
       {/*
       <View style={styles.swipeButtonsContainer}>
         <TouchableOpacity style={styles.nopeButton} onPress={() => swipe('left')}>
            <Text style={styles.buttonText}>Nope</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.likeButton} onPress={() => swipe('right')}>
            <Text style={styles.buttonText}>Like</Text>
         </TouchableOpacity>
       </View>
       */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Light grey background
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
    backgroundColor: '#007AFF', // Primary blue color
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
     flex: 1, // Take remaining space
     position: 'relative', // Needed for absolute positioning of TinderCards
     height: 400, // Set a fixed height or calculate based on screen size
     justifyContent: 'center', // Center cards vertically
     alignItems: 'center', // Center cards horizontally
  },
   card: {
      position: 'absolute', // Required by react-tinder-card
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      width: '90%', // Adjust width as needed
      maxWidth: 350, // Max width for larger screens
      height: 350, // Fixed height for the swipeable card
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 5, // Increased elevation for stacking effect
      justifyContent: 'center', // Center content within the card
      alignItems: 'center',
   },
   contractorImagePlaceholder: {
     width: 80,
     height: 80,
     borderRadius: 40,
     backgroundColor: '#eee', // Placeholder background
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 12,
     overflow: 'hidden', // Clip the image to the rounded border
   },
   contractorImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
   },
   contractorInfo: {
     alignItems: 'center', // Center text within the card
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
      marginTop: 20, // Adjust margin based on card container height
      fontSize: 16,
      color: '#555',
    },
    swipeButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
     nopeButton: {
        backgroundColor: '#ff4d4d', // Red color for nope
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 2 },
         shadowOpacity: 0.2,
         shadowRadius: 4,
         elevation: 5,
     },
      likeButton: {
        backgroundColor: '#4CAF50', // Green color for like
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
      },
       buttonText: {
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold',
       },
});


export default ContractorSearchPage;
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming react-router-dom is used for routing
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native'; // Using React Native components
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo icons

// Define types for contractor profile data (should match backend response)
interface ContractorProfile {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  averageRating?: number;
  reviewCount?: number;
  bio?: string;
  // Business details
  businessName?: string;
  licenseNumber?: string;
  yearsInBusiness?: number;
  // Experience (Trades)
  trades?: {
    trade: { name: string };
    yearsOfExperience?: number;
  }[]; // Assuming a structure like this from backend
  // Portfolio (assuming a structure for portfolio items)
  portfolio?: {
    id: number;
    title: string;
    description?: string;
    imageUrl: string;
  }[];
  // Reviews
  reviews?: {
    id: number;
    rating: number;
    comment?: string;
    homeowner: { // Assuming homeowner details are included in the review
      firstName: string;
      lastName: string;
    };
    createdAt: string; // Or Date object if parsed
  }[];
}


const ContractorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get contractor ID from URL
  const [contractor, setContractor] = useState<ContractorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractorProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/contractors/${id}/profile`); // Call the backend endpoint
        if (!response.ok) {
          throw new Error(`Error fetching contractor profile: ${response.statusText}`);
        }
        const data: ContractorProfile = await response.json();
        setContractor(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContractorProfile();
    }

  }, [id]); // Re-fetch if the ID changes

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!contractor) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Contractor not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Basic Info Section */}
      <View style={styles.basicInfoSection}>
         <View style={styles.profileImageContainer}>
           {contractor.profileImageUrl ? (
             <Image source={{ uri: contractor.profileImageUrl }} style={styles.profileImage} />
           ) : (
             <Ionicons name="person-circle-outline" size={100} color="#ccc" />
           )}
         </View>
        <Text style={styles.contractorName}>{contractor.firstName} {contractor.lastName}</Text>
        <View style={styles.ratingRow}>
           <Ionicons name="star" size={20} color="#FFD700" />
           <Text style={styles.overallRating}>{contractor.averageRating ? contractor.averageRating.toFixed(1) : 'N/A'}</Text>
           <Text style={styles.reviewCount}>({contractor.reviewCount || 0} reviews)</Text>
        </View>
         {contractor.bio && <Text style={styles.bioText}>{contractor.bio}</Text>}

         {/* Add "Request Quote" button here later */}
         <TouchableOpacity style={styles.requestQuoteButton} onPress={() => { /* TODO: Implement quote request */ }}>
             <Text style={styles.requestQuoteButtonText}>Request Quote</Text>
         </TouchableOpacity>

      </View>

      {/* Business Details Section */}
      {(contractor.businessName || contractor.licenseNumber || contractor.yearsInBusiness !== undefined) && (
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Business Details</Text>
           {contractor.businessName && <Text style={styles.detailText}>Business Name: {contractor.businessName}</Text>}
           {contractor.licenseNumber && <Text style={styles.detailText}>License Number: {contractor.licenseNumber}</Text>}
           {contractor.yearsInBusiness !== undefined && <Text style={styles.detailText}>Years in Business: {contractor.yearsInBusiness}</Text>}
         </View>
      )}


      {/* Experience Section (Trades) */}
      {contractor.trades && contractor.trades.length > 0 && (
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Experience</Text>
           {contractor.trades.map((tradeInfo, index) => (
             <Text key={index} style={styles.detailText}>
                {tradeInfo.trade.name} ({tradeInfo.yearsOfExperience} years)
             </Text>
           ))}
         </View>
      )}


      {/* Portfolio Section */}
      {contractor.portfolio && contractor.portfolio.length > 0 && (
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Portfolio</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScrollView}>
              {contractor.portfolio.map((item) => (
                <View key={item.id} style={styles.portfolioItem}>
                  <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} />
                   {item.title && <Text style={styles.portfolioTitle}>{item.title}</Text>}
                   {item.description && <Text style={styles.portfolioDescription}>{item.description}</Text>}
                </View>
              ))}
            </ScrollView>
         </View>
      )}

      {/* Reviews Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews ({contractor.reviews ? contractor.reviews.length : 0})</Text>
        {contractor.reviews && contractor.reviews.length > 0 ? (
          contractor.reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.homeowner.firstName} {review.homeowner.lastName}</Text>
                <View style={styles.ratingRow}>
                   <Ionicons name="star" size={16} color="#FFD700" />
                   <Text style={styles.reviewRating}>{review.rating}</Text>
                </View>
              </View>
              {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
              <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noReviewsText}>No reviews yet.</Text>
        )}
      </View>

       {/* Add more sections as needed (e.g., Contact Info, Services) */}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Light grey background
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
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
   notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    color: '#666',
  },
  basicInfoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
   profileImageContainer: {
     width: 100,
     height: 100,
     borderRadius: 50,
     backgroundColor: '#eee', // Placeholder background
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 12,
     overflow: 'hidden',
   },
   profileImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
   },
  contractorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
   ratingRow: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 8,
   },
   overallRating: {
     fontSize: 18,
     color: '#333',
     marginLeft: 4,
     fontWeight: 'bold',
   },
   reviewCount: {
      fontSize: 14,
      color: '#666',
      marginLeft: 4,
   },
   bioText: {
     fontSize: 16,
     color: '#555',
     textAlign: 'center',
     marginBottom: 16,
   },
   requestQuoteButton: {
      backgroundColor: '#007AFF', // Primary blue color
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      marginTop: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
   },
   requestQuoteButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
   },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
   portfolioScrollView: {
     // Styles for horizontal scroll view of portfolio items
   },
   portfolioItem: {
     marginRight: 12,
     width: 150, // Fixed width for portfolio item cards
     backgroundColor: '#f9f9f9',
     borderRadius: 8,
     padding: 8,
     alignItems: 'center',
      borderWidth: 1,
      borderColor: '#eee',
   },
   portfolioImage: {
     width: 140, // Slightly smaller than item width
     height: 100, // Fixed height for images
     borderRadius: 6,
     marginBottom: 8,
     resizeMode: 'cover',
   },
   portfolioTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
      textAlign: 'center',
   },
   portfolioDescription: {
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
   },
  reviewItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
     borderWidth: 1,
     borderColor: '#eee',
  },
   reviewHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 8,
   },
  reviewerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
   reviewRating: {
     fontSize: 16,
     color: '#555',
     marginLeft: 4,
   },
  reviewComment: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
  },
   reviewDate: {
     fontSize: 12,
     color: '#888',
     textAlign: 'right',
   },
   noReviewsText: {
     fontSize: 15,
     color: '#666',
     textAlign: 'center',
     marginTop: 10,
   },
});

export default ContractorProfilePage;
import React, { useState, useEffect, useMemo, useRef } from 'react';
// Import the swipeable card library - you need to install this
// import TinderCard from 'react-tinder-card';
import { useNavigate } from 'react-router-dom'; // Assuming you are using react-router-dom

// Mock TinderCard component for demonstration purposes if the library is not installed
const TinderCard = ({ children, onSwipe, onCardLeftScreen }: any) => {
  const cardRef = useRef(null); // Mock ref
  const handleSwipe = (dir: string) => {
    if (onSwipe) onSwipe(dir);
    if (onCardLeftScreen) onCardLeftScreen(dir);
  };
  return (
    <div style={{ position: 'absolute' }} ref={cardRef}> {/* Basic positioning */}
      {/* Add swipe gestures here if not using the library */}
      <div onClick={() => handleSwipe('left')} style={{ position: 'absolute', left: 0, top: '50%', zIndex: 10 }}>{'<'} Nope</div>
      <div onClick={() => handleSwipe('right')} style={{ position: 'absolute', right: 0, top: '50%', zIndex: 10 }}>Like {'>'}</div>
      {children}
    </div>
  );
};


const ContractorSearchPage: React.FC = () => {
  const [location, setLocation] = useState('');
  const [trade, setTrade] = useState('');
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0); // To track the current card in the swipe stack

  const navigate = useNavigate(); // Hook for navigation

  // Refs for TinderCard (if using the library)
  const childRefs: any = useMemo(() => Array(contractors.length).fill(0).map(i => React.createRef()), [contractors.length]);


  // Function to get user's current location
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
    setContractors([]); // Clear previous results
    setCurrentIndex(0); // Reset index for new search

    try {
      const userLocation = await getUserLocation(); // Get user's location

      const response = await fetch(`/api/contractors/search?tradeId=${encodeURIComponent(trade)}&latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`);

      if (!response.ok) {
        throw new Error(`Error fetching contractors: ${response.statusText}`);
      }
      const data = await response.json();
      setContractors(data);

    } catch (err: any) {
      setError(err.message);
       setContractors([]); // Ensure contractors is empty on error
    } finally {
      setLoading(false);
    }
  };

  // Handle swipe actions
  const onSwipe = (direction: string, contractorId: string) => {
    console.log('You swiped: ' + direction + ' on ' + contractorId);
    setLastSwipeDirection(direction);

    if (direction === 'right') {
      // User "liked" the contractor
      // TODO: Call backend endpoint to record the "like" for this user and contractor
      // Example: fetch(`/api/users/${currentUser.id}/liked-contractors`, { method: 'POST', body: JSON.stringify({ contractorId }) });
    }

     // Move to the next card
     setCurrentIndex(prevIndex => prevIndex + 1);
  };

   // Called when the card leaves the screen
   const onCardLeftScreen = (direction: string, contractorId: string) => {
     console.log(contractorId + ' left the screen to the ' + direction);
     // You might want to do something here, like pre-fetch the next batch of contractors
   };

   // Function to manually swipe (optional, for buttons)
   const swipe = (dir: string) => {
     const cardsLeft = contractors.length - currentIndex;
     if (cardsLeft > 0) {
        childRefs[currentIndex].current.swipe(dir);
     }
   };


   // Navigate to contractor profile
   const navigateToProfile = (contractorId: string) => {
       navigate(`/contractors/${contractorId}`);
   };


  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Find a Contractor</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter Trade (e.g., Plumber)"
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
          style={{ marginRight: '10px', padding: '8px' }}
        />
        {/* Location input - will be populated by getUserLocation */}
         <input
          type="text"
          placeholder="Getting Location..."
          value={location}
          disabled={true} // Disable manual input
          style={{ marginRight: '10px', padding: '8px' }}
        />
        <button onClick={handleSearch} disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
       {loading && <p>Loading contractors...</p>}

      <div className="contractor-cards-container" style={{ position: 'relative', width: '100%', height: '300px' }}>
        {/* Swipeable Contractor Cards */}
        {contractors.length > 0 ? (
          contractors.map((contractor: any, index) => (
            <TinderCard
              ref={childRefs[index]} // Ref for manual swiping
              key={contractor.id}
              onSwipe={(dir: string) => onSwipe(dir, contractor.id)}
              onCardLeftScreen={(dir: string) => onCardLeftScreen(dir, contractor.id)}
              preventSwipe={['up', 'down']} // Prevent vertical swipes
            >
              {/* Individual Contractor Card */}
              <div style={{
                position: 'absolute', // Required for react-tinder-card
                width: '100%',
                height: '300px',
                backgroundColor: '#fff',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0px 2px 5px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer', // Indicate clickable
              }} onClick={() => navigateToProfile(contractor.id)}> {/* Navigate on click */}
                 {/* Placeholder for Image */}
                 <div style={{ width: '80px', height: '80px', borderRadius: '40px', backgroundColor: '#eee', marginBottom: '10px', overflow: 'hidden' }}>
                    {contractor.profileImageUrl ? (
                       <img src={contractor.profileImageUrl} alt={`${contractor.firstName} ${contractor.lastName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    ) : (
                       <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', color: '#ccc' }}>👤</div> // Simple text icon
                    )}
                 </div>
                <h3>{contractor.firstName} {contractor.lastName}</h3>
                <p>Trade: {contractor.tradeName || 'N/A'}</p>
                <p>Rating: {contractor.averageRating ? contractor.averageRating.toFixed(1) : 'N/A'}</p>
                {/* Add more details here later */}
              </div>
            </TinderCard>
          ))
        ) : (
          !loading && !error && <p style={{ textAlign: 'center' }}>No contractors found or search to begin.</p>
        )}
         {lastSwipeDirection && <p key={lastSwipeDirection} style={{ textAlign: 'center', marginTop: contractors.length > 0 ? '320px' : '20px' }}>You swiped {lastSwipeDirection}</p>} {/* Display swipe direction */}
      </div>

       {/* Optional buttons for swiping */}
       {/*
       <div style={{ marginTop: '300px', display: 'flex', justifyContent: 'center' }}>
         <button onClick={() => swipe('left')} style={{ marginRight: '20px' }}>Nope</button>
         <button onClick={() => swipe('right')}>Like</button>
       </div>
       */}
    </div>
  );
};

export default ContractorSearchPage;
import React, { useState } from 'react';

const ContractorSearchPage: React.FC = () => {
  const [location, setLocation] = useState('');
  const [trade, setTrade] = useState('');
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setContractors([]); // Clear previous results
    try {
      // Replace with your actual API call
      const response = await fetch(`/api/contractors/search?location=${encodeURIComponent(location)}&trade=${encodeURIComponent(trade)}`);
      if (!response.ok) {
        throw new Error(`Error fetching contractors: ${response.statusText}`);
      }
      const data = await response.json();
      setContractors(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Find a Contractor</h1>
      <div>
        <input
          type="text"
          placeholder="Enter Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter Trade"
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div className="contractor-cards-container" style={{ marginTop: '20px' }}>
        {/* Placeholder for Swipeable Contractor Cards */}
        {contractors.length > 0 ? (
          contractors.map((contractor: any) => (
            <div key={contractor.id} className="contractor-card" style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
              <h3>{contractor.firstName} {contractor.lastName}</h3>
              <p>Trade: {contractor.tradeName || 'N/A'}</p> {/* Assuming tradeName is available */}
              <p>Rating: {contractor.averageRating || 'N/A'}</p>
              {/* Link to profile - you'll need routing set up */}
              <a href={`/contractors/${contractor.id}`}>View Profile</a>
            </div>
          ))
        ) : (
          !loading && <p>No contractors found or search to begin.</p>
        )}
      </div>
    </div>
  );
};

export default ContractorSearchPage;
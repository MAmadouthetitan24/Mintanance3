import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DemoProfile } from '../services/demoProfile';

type Props = NativeStackScreenProps<RootStackParamList, 'Jobs'>;

type Job = {
  id: string;
  title: string;
  status: string;
  location: string;
  date: string;
  description?: string;
  budget?: string;
  contractor?: {
    name: string;
    avatar?: string;
    rating?: number;
  };
};

// Demo jobs data with more details
const DEMO_JOBS: Job[] = [
  {
    id: "1",
    title: "Leaky Kitchen Faucet",
    status: "active",
    location: "12 Rose St, NW3",
    date: "3 days ago",
    description: "Constant dripping from the kitchen faucet, needs immediate repair",
    budget: "$150-200",
    contractor: {
      name: "Sarah Johnson",
      avatar: "https://randomuser.me/api/portraits/women/1.jpg",
      rating: 4.8,
    },
  },
  {
    id: "2",
    title: "Bathroom Socket Installation",
    status: "completed",
    location: "20 Elm Dr, SE1",
    date: "last week",
    description: "Need a new GFCI socket installed in the master bathroom",
    budget: "$200-250",
    contractor: {
      name: "Mike Wilson",
      avatar: "https://randomuser.me/api/portraits/men/2.jpg",
      rating: 4.9,
    },
  },
  {
    id: "3",
    title: "Annual AC Maintenance",
    status: "active",
    location: "8 Maple Rd, SW4",
    date: "today",
    description: "Regular maintenance and cleaning of central AC unit",
    budget: "$300-350",
  },
];

const statusTabs = [
  { key: "active", label: "Active Jobs" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

export default function JobsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<DemoProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    checkAuthAndLoadJobs();
  }, []);

  const checkAuthAndLoadJobs = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const profileStr = await AsyncStorage.getItem('userProfile');
      
      if (!token || !profileStr) {
        navigation.replace('Login');
        return;
      }

      const profile = JSON.parse(profileStr) as DemoProfile;
      setUserProfile(profile);
      setJobs(DEMO_JOBS);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = jobs.filter(
    (j) =>
      (activeTab === "all" || j.status === activeTab) &&
      (j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.location.toLowerCase().includes(search.toLowerCase()))
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="clipboard-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No jobs found</Text>
      <Text style={styles.emptySubtext}>
        {search
          ? "Try adjusting your search"
          : "Create a new job to get started"}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: Job }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text
          style={[
            styles.status,
            item.status === "active"
              ? styles.statusActive
              : styles.statusCompleted,
          ]}
        >
          {item.status}
        </Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.location}>{item.location}</Text>
      </View>

      {item.budget && (
        <View style={styles.budgetContainer}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.budget}>{item.budget}</Text>
        </View>
      )}

      {item.contractor && (
        <View style={styles.contractorContainer}>
          <Image
            source={{ uri: item.contractor.avatar }}
            style={styles.contractorAvatar}
          />
          <View style={styles.contractorInfo}>
            <Text style={styles.contractorName}>{item.contractor.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>{item.contractor.rating}</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.date}>{item.date}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {userProfile && (
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: userProfile.avatar }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userProfile.name}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity 
          style={styles.newJobButton}
          onPress={() => navigation.navigate('JobDetail', { jobId: "-1" })}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newJobText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {statusTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={activeTab === tab.key ? styles.activeTabText : styles.tabText}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmptyList}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('JobDetail', { jobId: "-1" })}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f9f9f9",
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    marginRight: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
  },
  newJobButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  newJobText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    color: "#888",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
    marginRight: 8,
  },
  description: {
    color: '#666',
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    color: "#666",
    marginLeft: 4,
    fontSize: 14,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  budget: {
    color: "#666",
    marginLeft: 4,
    fontSize: 14,
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  statusActive: {
    backgroundColor: "#E3F2FD",
    color: "#1976D2",
  },
  statusCompleted: {
    backgroundColor: "#E8F5E9",
    color: "#388E3C",
  },
  contractorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  contractorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  contractorInfo: {
    flex: 1,
  },
  contractorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  date: {
    position: 'absolute',
    top: 16,
    right: 16,
    color: "#888",
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#007AFF",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDemoProfile, type DemoProfile } from '../services/demoProfile';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'homeowner' | 'contractor'>('homeowner');

  useEffect(() => {
    checkExistingToken();
  }, []);

  const checkExistingToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const profile = await AsyncStorage.getItem('userProfile');
      if (token && profile) {
        navigation.replace('Jobs');
      }
    } catch (error) {
      console.error('Error checking token:', error);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      // Get demo profile based on selected role
      const demoProfile = getDemoProfile(selectedRole);
      
      // Store demo data
      await AsyncStorage.setItem('userToken', 'demo-token');
      await AsyncStorage.setItem('userProfile', JSON.stringify(demoProfile));
      
      navigation.replace('Jobs');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>HomeFixConnector</Text>
          <Text style={styles.subtitle}>Your Home Service Partner</Text>
          <Text style={styles.demoText}>Demo Mode</Text>
        </View>

        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              selectedRole === 'homeowner' && styles.roleButtonActive,
            ]}
            onPress={() => setSelectedRole('homeowner')}
          >
            <Text
              style={[
                styles.roleButtonText,
                selectedRole === 'homeowner' && styles.roleButtonTextActive,
              ]}
            >
              Homeowner
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleButton,
              selectedRole === 'contractor' && styles.roleButtonActive,
            ]}
            onPress={() => setSelectedRole('contractor')}
          >
            <Text
              style={[
                styles.roleButtonText,
                selectedRole === 'contractor' && styles.roleButtonTextActive,
              ]}
            >
              Contractor
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoProfileContainer}>
          <Image
            source={{ uri: getDemoProfile(selectedRole).avatar }}
            style={styles.avatar}
          />
          <Text style={styles.profileName}>{getDemoProfile(selectedRole).name}</Text>
          <Text style={styles.profileEmail}>{getDemoProfile(selectedRole).email}</Text>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          testID="login-button"
        >
          <Text style={styles.buttonText}>Login as {selectedRole}</Text>
        </TouchableOpacity>

        <Text style={styles.demoDisclaimer}>
          This is a demo version. No real authentication is required.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 14,
    color: '#ff9500',
    fontWeight: 'bold',
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleButtonText: {
    fontSize: 16,
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  demoProfileContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoDisclaimer: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 20,
  },
}); 
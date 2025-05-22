import React, { useCallback, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/navigation/types';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';

// Screens
import JobsScreen from './src/screens/Jobs';
import JobDetailScreen from './src/screens/JobDetail';
import ChatScreen from './src/screens/Chat';
import ProfileScreen from './src/screens/Profile';
import LoginScreen from './src/screens/Login';
import ForgotPasswordScreen from './src/screens/ForgotPassword';
import PaymentScreen from './src/screens/Payment';
import NotFoundScreen from './src/screens/NotFound';
import MessagingScreen from './src/screens/Messaging';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync({
          ...Ionicons.font,
        });
      } catch (e) {
        console.warn('Error loading fonts:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Error hiding splash screen:', e);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <StatusBar style="auto" />
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#007AFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
          <Stack.Screen name="Jobs" component={JobsScreen} options={{ title: 'My Jobs' }} />
          <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
          <Stack.Screen name="Messaging" component={MessagingScreen} options={{ title: 'Messages' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
          <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
} 
// App.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './android/app/src/screens/LoginScreen';
import RegisterScreen from './android/app/src/screens/RegisterScreen';
import ChatScreen from './android/app/src/screens/ChatScreen';

import { auth, onAuthStateChanged, loginUser } from './android/app/src/config/firebase';
import { StorageService } from './android/app/src/services/StorageService';
import { RootStackParamList } from './android/app/src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');
  const [initialParams, setInitialParams] = useState<any>(undefined);

  useEffect(() => {
    checkAutoLogin();
  }, []);

  const checkAutoLogin = async () => {
    try {
      // Cek apakah ada saved credentials untuk auto-login
      const credentials = await StorageService.getAuthCredentials();
      const userData = await StorageService.getUserData();

      if (credentials && userData) {
        // Coba login dengan saved credentials
        try {
          await loginUser(credentials.email, credentials.password);
          setInitialRoute('Chat');
          setInitialParams({
            userName: userData.displayName,
            userEmail: userData.email,
          });
        } catch (error) {
          // Jika login gagal (token expired, password changed, dll)
          // Hapus saved credentials dan arahkan ke login
          console.log('Auto-login failed, redirecting to login');
          await StorageService.clearAuthCredentials();
          setInitialRoute('Login');
        }
      } else {
        // Tidak ada saved credentials, cek Firebase auth state
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            // User sudah login via Firebase
            setInitialRoute('Chat');
            setInitialParams({
              userName: user.displayName || user.email?.split('@')[0] || 'User',
              userEmail: user.email || '',
            });
          } else {
            setInitialRoute('Login');
          }
          unsubscribe();
        });
      }
    } catch (error) {
      console.error('Auto-login check error:', error);
      setInitialRoute('Login');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading screen saat checking auto-login
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuat...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          initialParams={initialParams}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
});
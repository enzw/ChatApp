// src/services/StorageService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MessageType, UserData } from '../types';

const KEYS = {
  USER_DATA: '@ChatApp:userData',
  MESSAGES: '@ChatApp:messages',
  AUTH_TOKEN: '@ChatApp:authToken',
};

export const StorageService = {
  // ===== USER DATA (Auto-Login) =====
  saveUserData: async (userData: UserData): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  },

  getUserData: async (): Promise<UserData | null> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  clearUserData: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.USER_DATA);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  },

  // ===== AUTH CREDENTIALS (Auto-Login) =====
  saveAuthCredentials: async (email: string, password: string): Promise<void> => {
    try {
      const credentials = { email, password };
      await AsyncStorage.setItem(KEYS.AUTH_TOKEN, JSON.stringify(credentials));
    } catch (error) {
      console.error('Error saving auth credentials:', error);
    }
  },

  getAuthCredentials: async (): Promise<{ email: string; password: string } | null> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting auth credentials:', error);
      return null;
    }
  },

  clearAuthCredentials: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error clearing auth credentials:', error);
    }
  },

  // ===== MESSAGES (Offline Mode) =====
  saveMessages: async (messages: MessageType[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  },

  getMessages: async (): Promise<MessageType[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  },

  clearMessages: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.MESSAGES);
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  },

  // ===== CLEAR ALL =====
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        KEYS.USER_DATA,
        KEYS.MESSAGES,
        KEYS.AUTH_TOKEN,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  },
};
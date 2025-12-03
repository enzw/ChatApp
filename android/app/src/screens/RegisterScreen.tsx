// src/screens/RegisterScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { registerUser } from '../config/firebase';
import { StorageService } from '../services/StorageService';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validasi input
    if (!displayName.trim()) {
      Alert.alert('Error', 'Nama harus diisi');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Email harus diisi');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Password harus diisi');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await registerUser(
        email.trim(),
        password,
        displayName.trim()
      );
      const user = userCredential.user;

      // Simpan credentials untuk auto-login
      await StorageService.saveAuthCredentials(email.trim(), password);
      
      // Simpan user data
      await StorageService.saveUserData({
        uid: user.uid,
        email: user.email || '',
        displayName: displayName.trim(),
      });

      Alert.alert('Sukses', 'Registrasi berhasil!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.replace('Chat', {
              userName: displayName.trim(),
              userEmail: user.email || '',
            });
          },
        },
      ]);
    } catch (error: any) {
      let message = 'Registrasi gagal';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email sudah terdaftar';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Format email tidak valid';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password terlalu lemah';
      }
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          <Text style={styles.title}>📝 Daftar Akun</Text>
          <Text style={styles.subtitle}>Buat akun baru untuk memulai</Text>

          <TextInput
            style={styles.input}
            placeholder="Nama Lengkap"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min. 6 karakter)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Konfirmasi Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Daftar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Sudah punya akun? <Text style={styles.linkBold}>Masuk</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkBold: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
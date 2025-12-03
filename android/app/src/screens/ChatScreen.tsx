// src/screens/ChatScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import {
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  messagesCollection,
  uploadImage,
  logoutUser,
} from '../config/firebase';
import { StorageService } from '../services/StorageService';
import { RootStackParamList, MessageType } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { userName, userEmail } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Monitor koneksi internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  // Load messages dari local storage saat offline
  useEffect(() => {
    const loadOfflineMessages = async () => {
      const savedMessages = await StorageService.getMessages();
      if (savedMessages.length > 0 && !isOnline) {
        setMessages(savedMessages);
      }
    };
    loadOfflineMessages();
  }, [isOnline]);

  // Subscribe ke Firestore untuk real-time updates
  useEffect(() => {
    if (!isOnline) return;

    const q = query(messagesCollection, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: MessageType[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          text: data.text || '',
          user: data.user || '',
          userEmail: data.userEmail || '',
          createdAt: data.createdAt,
          imageUrl: data.imageUrl,
          isImage: data.isImage || false,
        });
      });
      setMessages(list);
      // Simpan ke local storage untuk offline mode
      StorageService.saveMessages(list);
    }, (error) => {
      console.error('Firestore error:', error);
    });

    return () => unsub();
  }, [isOnline]);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    if (!isOnline) {
      Alert.alert('Offline', 'Tidak dapat mengirim pesan. Periksa koneksi internet.');
      return;
    }

    setSending(true);
    try {
      await addDoc(messagesCollection, {
        text: message.trim(),
        user: userName,
        userEmail: userEmail,
        createdAt: serverTimestamp(),
        isImage: false,
      });
      setMessage('');
    } catch (error) {
      console.error('Send error:', error);
      Alert.alert('Error', 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = () => {
    Alert.alert('Upload Gambar', 'Pilih sumber gambar', [
      { text: 'Kamera', onPress: () => pickImage('camera') },
      { text: 'Galeri', onPress: () => pickImage('gallery') },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    if (!isOnline) {
      Alert.alert('Offline', 'Tidak dapat upload gambar. Periksa koneksi.');
      return;
    }

    const options = { mediaType: 'photo' as const, quality: 0.7 as const };
    const result = source === 'camera'
      ? await launchCamera(options)
      : await launchImageLibrary(options);

    if (result.didCancel || !result.assets?.[0]?.uri) return;

    const imageUri = result.assets[0].uri;
    const fileName = `${Date.now()}_${userName.replace(/\s/g, '_')}.jpg`;

    setUploading(true);
    try {
      const downloadURL = await uploadImage(imageUri, fileName);
      await addDoc(messagesCollection, {
        text: '',
        user: userName,
        userEmail: userEmail,
        createdAt: serverTimestamp(),
        imageUrl: downloadURL,
        isImage: true,
      });
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logoutUser();
            await StorageService.clearAll();
            navigation.replace('Login');
          } catch (error) {
            Alert.alert('Error', 'Gagal logout');
          }
        },
      },
    ]);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: MessageType }) => {
    const isMyMessage = item.userEmail === userEmail;

    return (
      <View style={[styles.msgBox, isMyMessage ? styles.myMsg : styles.otherMsg]}>
        {!isMyMessage && <Text style={styles.sender}>{item.user}</Text>}
        {item.isImage && item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.chatImage} resizeMode="cover" />
        ) : (
          <Text style={styles.msgText}>{item.text}</Text>
        )}
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Chat Room</Text>
          <Text style={styles.headerSubtitle}>
            {isOnline ? `👤 ${userName}` : '⚠️ Offline Mode'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Offline Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            📡 Mode Offline - Menampilkan pesan tersimpan
          </Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Belum ada pesan. Mulai chat!</Text>
        }
      />

      {/* Upload Indicator */}
      {uploading && (
        <View style={styles.uploadingBanner}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadingText}>Mengupload gambar...</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          onPress={handleImagePick}
          style={styles.imageBtn}
          disabled={!isOnline || uploading}
        >
          <Text style={styles.imageBtnText}>📷</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Ketik pesan..."
          value={message}
          onChangeText={setMessage}
          editable={isOnline && !sending}
          multiline
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={[styles.sendBtn, (!isOnline || sending) && styles.sendBtnDisabled]}
          disabled={!isOnline || sending || !message.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>Kirim</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#007AFF',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#e0e0e0', fontSize: 12, marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  offlineBanner: {
    backgroundColor: '#FF9500',
    padding: 8,
    alignItems: 'center',
  },
  offlineText: { color: '#fff', fontSize: 12 },
  listContent: { padding: 10, paddingBottom: 20 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50 },
  msgBox: { padding: 12, marginVertical: 4, borderRadius: 12, maxWidth: '80%' },
  myMsg: { backgroundColor: '#007AFF', alignSelf: 'flex-end' },
  otherMsg: { backgroundColor: '#e5e5ea', alignSelf: 'flex-start' },
  sender: { fontWeight: 'bold', fontSize: 11, color: '#666', marginBottom: 4 },
  msgText: { fontSize: 15, color: '#000' },
  time: { fontSize: 10, color: '#888', marginTop: 4, textAlign: 'right' },
  chatImage: { width: 200, height: 200, borderRadius: 8 },
  uploadingBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#e8f4fd',
  },
  uploadingText: { marginLeft: 8, color: '#007AFF' },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  imageBtn: { padding: 10, marginRight: 5 },
  imageBtnText: { fontSize: 24 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  sendBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendBtnText: { color: '#fff', fontWeight: 'bold' },
});
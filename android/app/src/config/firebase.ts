// src/config/firebase.ts

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  CollectionReference,
  DocumentData,
  getDocs,
  Timestamp,
} from "firebase/firestore";

import {
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// ===============================
//        TYPES & INTERFACES
// ===============================
export interface Message {
  id?: string;
  text: string;
  userId: string;
  displayName: string;
  createdAt: Timestamp | null;
  imageUrl?: string;
}

export type { User };

// ===============================
//        FIREBASE CONFIG
// ===============================
// GANTI dengan konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyAaGe3SrpmB_IaDifjs_FmmKRew0PthZYs",
  authDomain: "chatapp-2500e.firebaseapp.com",
  projectId: "chatapp-2500e",
  storageBucket: "chatapp-2500e.appspot.com",
  messagingSenderId: "539464492034",
  appId: "1:539464492034:web:fa082b901be751f182b31b",
};

const app = initializeApp(firebaseConfig);

// Initialize Auth dengan AsyncStorage untuk persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);

export const messagesCollection = collection(
  db,
  "messages"
) as CollectionReference<DocumentData>;

// ===============================
//        CLOUDINARY CONFIG
// ===============================
// Cloud Name dari Cloudinary Dashboard
const CLOUDINARY_CLOUD_NAME = "dwxqzajym"; // ✅ Sudah diisi!
const CLOUDINARY_UPLOAD_PRESET = "chat_uploads"; // <- Pastikan preset ini sudah dibuat di Cloudinary

// ===============================
//        AUTH FUNCTIONS
// ===============================
export const loginUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const registerUser = async (
  email: string,
  password: string,
  displayName: string
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  await updateProfile(userCredential.user, { displayName });
  return userCredential;
};

export const logoutUser = async () => {
  return await signOut(auth);
};

// ===============================
//  IMAGE UPLOAD DENGAN CLOUDINARY
// ===============================
export const uploadImage = async (
  uri: string,
  fileName: string
): Promise<string> => {
  const formData = new FormData();

  formData.append("file", {
    uri: uri,
    type: "image/jpeg",
    name: fileName,
  } as any);

  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "chat_images");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Cloudinary error:", errorData);
    throw new Error("Upload failed");
  }

  const data = await response.json();
  return data.secure_url;
};

// ===============================
//      MESSAGE FUNCTIONS
// ===============================

/**
 * Kirim pesan text ke Firestore
 */
export const sendMessage = async (
  userId: string,
  displayName: string,
  text: string
) => {
  try {
    await addDoc(messagesCollection, {
      text,
      userId,
      displayName,
      createdAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error("Send message error:", error.message);
    throw error;
  }
};

/**
 * Kirim pesan dengan gambar ke Firestore
 */
export const sendMessageWithImage = async (
  userId: string,
  displayName: string,
  text: string,
  imageUrl: string
) => {
  try {
    await addDoc(messagesCollection, {
      text,
      userId,
      displayName,
      imageUrl,
      createdAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error("Send message with image error:", error.message);
    throw error;
  }
};

/**
 * Subscribe ke messages collection dengan listener real-time
 */
export const subscribeToMessages = (
  callback: (messages: Message[]) => void
) => {
  const q = query(messagesCollection, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      messages.push({ ...doc.data(), id: doc.id } as Message);
    });
    callback(messages);
  });
};

// ===============================
//           EXPORTS
// ===============================
export {
  auth,
  db,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  onAuthStateChanged,
};
// src/types/index.ts

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Chat: { userName: string; userEmail: string };
};

export type MessageType = {
  id: string;
  text: string;
  user: string;
  userEmail: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  imageUrl?: string;
  isImage?: boolean;
};

export type UserData = {
  uid: string;
  email: string;
  displayName: string;
};
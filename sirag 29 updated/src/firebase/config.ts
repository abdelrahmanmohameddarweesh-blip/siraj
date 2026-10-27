// Firebase configuration for Batal Moslem project
export const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyB6IDKIRy9ghnUQtlTO3kJKlrzW79-Ak0c",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "batal-moslem.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "batal-moslem",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "batal-moslem.firebasestorage.app",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "39970984319",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    "1:39970984319:web:7fe3c89e912c2d7d434a4a",
  measurementId: "G-0NW6XMNHX8",
};

// src/services/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorageRN from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚠️ Thay giá trị bên dưới bằng thông tin thật từ Firebase console
const firebaseConfig = {
    apiKey: "AIzaSyDrOBsW3ej7grPdQOySWet3hzv5kMsfT8g",
    authDomain: "envi-app-fe11b.firebaseapp.com",
    projectId: "envi-app-fe11b",
    storageBucket: "envi-app-fe11b.appspot.com",
    messagingSenderId: "909703253627",
    appId: "1:909703253627:web:24aa93dd898d1927591cde",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorageRN),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
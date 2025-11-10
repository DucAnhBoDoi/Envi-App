// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth as firebaseAuth } from "../services/firebaseConfig";

const auth = firebaseAuth;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setGuestMode(false);
        await AsyncStorage.setItem("user", JSON.stringify(firebaseUser));
        await AsyncStorage.removeItem("guestUser");
      } else {
        const localUser = await AsyncStorage.getItem("guestUser");
        if (localUser) {
          setUser(JSON.parse(localUser));
          setGuestMode(true);
        } else {
          setUser(null);
          setGuestMode(false);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      return { success: true };
    } catch (error) {
      return { success: false, errorCode: error.code };
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, errorCode: error.code };
    }
  };

  const signInAsGuest = async (guestName = "Khách") => {
    try {
      const guestUser = {
        uid: "guest_" + Date.now(),
        email: null,
        displayName: guestName,
        isGuest: true,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem("guestUser", JSON.stringify(guestUser));
      setUser(guestUser);
      setGuestMode(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: "https://envi-app-fe11b.firebaseapp.com",
        handleCodeInApp: false,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ĐĂNG XUẤT HOÀN HẢO - XÓA SẠCH GUEST + KHÔNG LỖI RESET
  const logout = async () => {
    try {
      if (guestMode) {
        // XÓA SẠCH HOÀN TOÀN DỮ LIỆU GUEST
        await AsyncStorage.multiRemove([
          "guestUser",
          "guestProfile",
          "guestReportHistory",
          "guestChatHistory",
          "guestAqiThreshold",
          "guest_notifications",
          "guest_notifSettings",
          "guest_learningQuizHistory",
          "guest_learningCompletedTips",
        ]);
        console.log("ĐÃ XÓA SẠCH DỮ LIỆU KHÁCH");
      } else {
        await signOut(auth);
        await AsyncStorage.removeItem("user");
      }

      setUser(null);
      setGuestMode(false);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        guestMode,
        signUpWithEmail,
        signInWithEmail,
        signInAsGuest,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
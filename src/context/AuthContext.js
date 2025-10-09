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
  getAuth 
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
        // Người dùng đã đăng nhập với email/password hoặc OAuth
        setUser(firebaseUser);
        setGuestMode(false);
        await AsyncStorage.setItem("user", JSON.stringify(firebaseUser));
        await AsyncStorage.removeItem("guestUser");
      } else {
        // Kiểm tra chế độ khách
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

  // Đăng ký với email/mật khẩu
  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      setUser(userCredential.user);
      setGuestMode(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Đăng nhập với email/mật khẩu
  const signInWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setGuestMode(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Chế độ khách (dữ liệu lưu cục bộ)
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

  // Đặt lại mật khẩu
  const resetPassword = async (email) => {
    try {
      console.log("📧 Sending password reset email to:", email);
      await sendPasswordResetEmail(auth, email, {
        url: "https://envi-app-fe11b.firebaseapp.com",
        handleCodeInApp: false,
      });
      console.log("✅ Password reset email sent");
      return { 
        success: true, 
        message: "Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra thư rác nếu không thấy." 
      };
    } catch (error) {
      console.error("❌ Reset password error:", error);
      return { success: false, error: error.message };
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      if (!guestMode) {
        await signOut(auth);
        await AsyncStorage.removeItem("user");
      } else {
        await AsyncStorage.removeItem("guestUser");
      }
      setUser(null);
      setGuestMode(false);
      return { success: true };
    } catch (error) {
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
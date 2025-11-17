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
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
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

  // Đăng nhập bằng Google (Firebase đã xác thực sẵn)
  const signInWithGoogle = async (user) => {
    try {
      // user từ firebase đã đăng nhập rồi
      setUser(user);
      setGuestMode(false);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      await AsyncStorage.removeItem("guestUser");
      console.log("Lưu thông tin Google user vào context:", user.displayName);
      return { success: true };
    } catch (error) {
      console.log("Lỗi khi lưu Google user:", error);
      return { success: false, error: error.message };
    }
  };


  // Đăng nhập với email/mật khẩu
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

  const deleteAccount = async (password = null) => {
    try {
      if (guestMode) {
        // XÓA DỮ LIỆU KHÁCH
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
          "guestPermissions",
        ]);

        setUser(null);
        setGuestMode(false);
        return { success: true, message: "Đã xóa tài khoản khách" };
      }

      // XÓA TÀI KHOẢN FIREBASE
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: "Không tìm thấy người dùng" };
      }

      // Nếu là tài khoản email/password, yêu cầu xác thực lại
      if (currentUser.providerData[0]?.providerId === "password") {
        if (!password) {
          return {
            success: false,
            error: "Cần nhập mật khẩu để xác thực",
            requirePassword: true
          };
        }

        // Xác thực lại
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          password
        );
        await reauthenticateWithCredential(currentUser, credential);
      }

      // Xóa user khỏi Firebase Auth
      await deleteUser(currentUser);

      // Xóa dữ liệu local
      await AsyncStorage.multiRemove([
        "user",
        `reportHistory_${currentUser.uid}`,
        `chatHistory_${currentUser.uid}`,
        `aqiThreshold_${currentUser.uid}`,
        `permissions_${currentUser.uid}`,
      ]);

      setUser(null);
      setGuestMode(false);

      return { success: true, message: "Tài khoản đã được xóa" };
    } catch (error) {
      console.error("Lỗi xóa tài khoản:", error);

      // Xử lý các lỗi cụ thể
      if (error.code === "auth/requires-recent-login") {
        return {
          success: false,
          error: "Vui lòng đăng nhập lại trước khi xóa tài khoản",
          requireReauth: true
        };
      }

      return {
        success: false,
        error: error.message || "Không thể xóa tài khoản"
      };
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
        signInWithGoogle,
        signInAsGuest,
        signInWithGoogle,
        resetPassword,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
// src/context/UserContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user, guestMode } = useContext(AuthContext);
  
  const [userProfile, setUserProfile] = useState({
    displayName: "",
    photoURL: "",
    email: "",
    phone: "",
    address: "",
    defaultRegion: "Hồ Chí Minh", // Khu vực mặc định
    bio: "",
  });
  
  const [reportHistory, setReportHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load profile khi user thay đổi
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadReportHistory();
      loadChatHistory();
    } else {
      clearProfile();
    }
  }, [user]);

  // 🔹 Load thông tin profile
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      if (guestMode) {
        // Khách: Load từ AsyncStorage
        const guestProfile = await AsyncStorage.getItem("guestProfile");
        if (guestProfile) {
          setUserProfile(JSON.parse(guestProfile));
        } else {
          setUserProfile({
            displayName: user?.displayName || "Khách",
            photoURL: "",
            email: "",
            phone: "",
            address: "",
            defaultRegion: "Hồ Chí Minh",
            bio: "Tài khoản khách - Dữ liệu chỉ lưu trên thiết bị này",
          });
        }
      } else {
        // User đăng nhập: Load từ Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          // Tạo profile mới từ thông tin Firebase Auth
          const newProfile = {
            displayName: user.displayName || "Người dùng",
            photoURL: user.photoURL || "",
            email: user.email || "",
            phone: "",
            address: "",
            defaultRegion: "Hồ Chí Minh",
            bio: "",
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
          setUserProfile(newProfile);
        }
      }
    } catch (error) {
      console.error("❌ Lỗi load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Cập nhật profile
  const updateUserProfile = async (updates) => {
    try {
      const newProfile = { ...userProfile, ...updates };
      
      if (guestMode) {
        // Khách: Lưu vào AsyncStorage
        await AsyncStorage.setItem("guestProfile", JSON.stringify(newProfile));
      } else {
        // User: Lưu vào Firestore
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, newProfile, { merge: true });
      }
      
      setUserProfile(newProfile);
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi cập nhật profile:", error);
      return { success: false, error: error.message };
    }
  };

  // 🔹 Load lịch sử báo cáo
  const loadReportHistory = async () => {
    try {
      const key = guestMode ? "guestReportHistory" : `reportHistory_${user.uid}`;
      const history = await AsyncStorage.getItem(key);
      setReportHistory(history ? JSON.parse(history) : []);
    } catch (error) {
      console.error("❌ Lỗi load report history:", error);
    }
  };

  // 🔹 Thêm báo cáo vào lịch sử
  const addReportToHistory = async (report) => {
    try {
      const newReport = {
        id: Date.now().toString(),
        ...report,
        timestamp: new Date().toISOString(),
      };
      
      const newHistory = [newReport, ...reportHistory].slice(0, 50); // Giữ tối đa 50 báo cáo
      setReportHistory(newHistory);
      
      const key = guestMode ? "guestReportHistory" : `reportHistory_${user.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(newHistory));
      
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi thêm report:", error);
      return { success: false, error: error.message };
    }
  };

  // 🔹 Load lịch sử chat với chatbot
  const loadChatHistory = async () => {
    try {
      const key = guestMode ? "guestChatHistory" : `chatHistory_${user.uid}`;
      const history = await AsyncStorage.getItem(key);
      setChatHistory(history ? JSON.parse(history) : []);
    } catch (error) {
      console.error("❌ Lỗi load chat history:", error);
    }
  };

  // 🔹 Thêm tin nhắn chat vào lịch sử
  const addChatToHistory = async (message) => {
    try {
      const newMessage = {
        id: Date.now().toString(),
        ...message,
        timestamp: new Date().toISOString(),
      };
      
      const newHistory = [newMessage, ...chatHistory].slice(0, 100); // Giữ tối đa 100 tin nhắn
      setChatHistory(newHistory);
      
      const key = guestMode ? "guestChatHistory" : `chatHistory_${user.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(newHistory));
      
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi thêm chat:", error);
      return { success: false, error: error.message };
    }
  };

  // 🔹 Xóa lịch sử
  const clearReportHistory = async () => {
    try {
      const key = guestMode ? "guestReportHistory" : `reportHistory_${user.uid}`;
      await AsyncStorage.removeItem(key);
      setReportHistory([]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const clearChatHistory = async () => {
    try {
      const key = guestMode ? "guestChatHistory" : `chatHistory_${user.uid}`;
      await AsyncStorage.removeItem(key);
      setChatHistory([]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 🔹 Clear tất cả khi logout
  const clearProfile = () => {
    setUserProfile({
      displayName: "",
      photoURL: "",
      email: "",
      phone: "",
      address: "",
      defaultRegion: "Hồ Chí Minh",
      bio: "",
    });
    setReportHistory([]);
    setChatHistory([]);
  };

  return (
    <UserContext.Provider
      value={{
        userProfile,
        reportHistory,
        chatHistory,
        loading,
        updateUserProfile,
        addReportToHistory,
        addChatToHistory,
        clearReportHistory,
        clearChatHistory,
        loadUserProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
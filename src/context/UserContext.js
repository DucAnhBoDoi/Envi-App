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
    defaultRegion: "Hồ Chí Minh",
    bio: "",
  });
  
  const [reportHistory, setReportHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 AQI threshold (1-5)
  const [aqiThreshold, setAqiThresholdState] = useState(3);

  // Load profile khi user thay đổi
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadReportHistory();
      loadChatHistory();
      loadAqiThreshold();
    } else {
      clearProfile();
    }
  }, [user]);

  // 🔹 Load ngưỡng AQI từ storage
  const loadAqiThreshold = async () => {
    try {
      const key = guestMode ? "guestAqiThreshold" : `aqiThreshold_${user.uid}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setAqiThresholdState(parseInt(saved));
      }
    } catch (error) {
      console.error("❌ Lỗi load AQI threshold:", error);
    }
  };

  // 🔹 Wrapper để lưu ngưỡng AQI khi thay đổi
  const setAqiThreshold = async (value) => {
    try {
      setAqiThresholdState(value);
      const key = guestMode ? "guestAqiThreshold" : `aqiThreshold_${user.uid}`;
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error("❌ Lỗi lưu AQI threshold:", error);
    }
  };

  // 🔹 Load thông tin profile
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      if (guestMode) {
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
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
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
        await AsyncStorage.setItem("guestProfile", JSON.stringify(newProfile));
      } else {
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

  const addReportToHistory = async (report) => {
    try {
      const newReport = {
        id: Date.now().toString(),
        ...report,
        timestamp: new Date().toISOString(),
      };
      const newHistory = [newReport, ...reportHistory].slice(0, 50);
      setReportHistory(newHistory);
      const key = guestMode ? "guestReportHistory" : `reportHistory_${user.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(newHistory));
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi thêm report:", error);
      return { success: false, error: error.message };
    }
  };

  // 🔹 Load lịch sử chat
  const loadChatHistory = async () => {
    try {
      const key = guestMode ? "guestChatHistory" : `chatHistory_${user.uid}`;
      const history = await AsyncStorage.getItem(key);
      setChatHistory(history ? JSON.parse(history) : []);
    } catch (error) {
      console.error("❌ Lỗi load chat history:", error);
    }
  };

  const addChatToHistory = async (message) => {
    try {
      const newMessage = {
        id: Date.now().toString(),
        ...message,
        timestamp: new Date().toISOString(),
      };
      const newHistory = [newMessage, ...chatHistory].slice(0, 100);
      setChatHistory(newHistory);
      const key = guestMode ? "guestChatHistory" : `chatHistory_${user.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(newHistory));
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi thêm chat:", error);
      return { success: false, error: error.message };
    }
  };

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
    setAqiThresholdState(3); // reset threshold
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
        // 🔹 AQI
        aqiThreshold,
        setAqiThreshold,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
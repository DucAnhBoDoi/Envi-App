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

  // 🔥 FIX: Load lịch sử chat - đọc trực tiếp từ AsyncStorage
  const loadChatHistory = async () => {
    try {
      if (!user) {
        setChatHistory([]);
        return;
      }

      const key = guestMode ? "guestChatHistory" : `chatHistory_${user.uid}`;
      const history = await AsyncStorage.getItem(key);
      
      console.log("📖 Load chat history from:", key);
      console.log("📖 Data loaded:", history ? "Có dữ liệu" : "Trống");
      
      if (history) {
        const parsed = JSON.parse(history);
        console.log("📖 Số tin nhắn:", parsed.length);
        
        // Sắp xếp theo thời gian mới nhất trên đầu
        const sorted = parsed.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setChatHistory(sorted);
      } else {
        setChatHistory([]);
      }
    } catch (error) {
      console.error("❌ Lỗi load chat history:", error);
      setChatHistory([]);
    }
  };

  // 🔥 FIX: Thêm tin nhắn vào lịch sử chat
  const addChatToHistory = async (message) => {
    try {
      if (!user) {
        console.warn("⚠️ Không có user, không lưu chat");
        return { success: false, error: "No user" };
      }

      const newMessage = {
        id: message.id || Date.now().toString(),
        sender: message.sender, // "user" hoặc "bot"
        message: message.message,
        timestamp: message.timestamp || new Date().toISOString(),
      };

      const key = guestMode ? "guestChatHistory" : `chatHistory_${user.uid}`;
      
      // 🔥 Đọc lại từ storage trước khi thêm (tránh mất dữ liệu)
      const existingData = await AsyncStorage.getItem(key);
      const existingHistory = existingData ? JSON.parse(existingData) : [];
      
      // 🔥 Thêm tin nhắn mới vào đầu
      const newHistory = [newMessage, ...existingHistory].slice(0, 200); // Giới hạn 200 tin nhắn
      
      console.log("💾 Lưu tin nhắn:", {
        sender: newMessage.sender,
        messagePreview: newMessage.message.substring(0, 30),
        totalMessages: newHistory.length,
        key: key
      });
      
      // 🔥 Lưu vào AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify(newHistory));
      
      // 🔥 Cập nhật state
      setChatHistory(newHistory);
      
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi thêm chat:", error);
      return { success: false, error: error.message };
    }
  };

  // 🔹 Xóa lịch sử báo cáo
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

  // 🔹 Xóa lịch sử chat
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

  // 🔹 Cập nhật trạng thái của một báo cáo
  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const updatedHistory = reportHistory.map((r) =>
        r.id === reportId ? { ...r, status: newStatus } : r
      );
      setReportHistory(updatedHistory);

      const key = guestMode ? "guestReportHistory" : `reportHistory_${user.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi cập nhật trạng thái báo cáo:", error);
      return { success: false, error: error.message };
    }
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
        loadChatHistory,
        updateReportStatus,
        // 🔹 AQI
        aqiThreshold,
        setAqiThreshold,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
// src/context/UserContext.js - MERGED VERSION WITH ALL FEATURES

import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthContext";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db } from "../services/firebaseConfig";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user, guestMode } = useContext(AuthContext);

  // ==================== CLOUDINARY CONFIG ====================
  // 🔥 FREE 25GB/month - Không cần API key
  const CLOUDINARY_CLOUD_NAME = "dlydwc9t3"; // ⚠️ THAY BẰNG CLOUD NAME CỦA BẠN
  const CLOUDINARY_UPLOAD_PRESET = "green_hanoi"; // Tạo unsigned preset

  // ==================== STATE ====================
  const [userProfile, setUserProfile] = useState({
    displayName: "",
    photoURL: "",
    email: "",
    phone: "",
    address: "",
    defaultRegion: "Hồ Chí Minh",
    bio: "",
    uid: undefined,
    points: 0,
    campaignsJoined: 0,
    wasteClassified: 0,
  });

  const [reportHistory, setReportHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aqiThreshold, setAqiThresholdState] = useState(3);

  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);

  // ✅ TỔNG BÁO CÁO CỦA TẤT CẢ USER
  const [allReports, setAllReports] = useState([]);

  // ✅ AI PHÂN LOẠI RÁC
  const [wasteClassificationHistory, setWasteClassificationHistory] = useState([]);

  // ==================== UPLOAD CLOUDINARY ====================
  const uploadToCloudinary = async (uri, resourceType = "image") => {
    if (!uri) throw new Error("URI không hợp lệ");
    if (typeof uri === "string" && uri.includes("cloudinary.com")) {
      return uri;
    }

    try {
      console.log("📤 Upload lên Cloudinary:", { uri: uri.substring(0, 50), resourceType });

      const formData = new FormData();

      let fileName = "upload_" + Date.now();
      let fileType = "image/jpeg";

      if (resourceType === "video") {
        fileName += ".mp4";
        fileType = "video/mp4";
      } else {
        fileName += ".jpg";
      }

      formData.append("file", {
        uri: uri,
        type: fileType,
        name: fileName,
      });

      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

      const folder = resourceType === "video" ? "videos" : "images";
      formData.append("folder", `green_hanoi/${folder}`);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudinary error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Upload thành công:", data.secure_url.substring(0, 50));

      return data.secure_url;

    } catch (error) {
      console.error("❌ Upload Cloudinary thất bại:", error);
      throw new Error(`Upload thất bại: ${error.message}`);
    }
  };

  // ==================== AQI THRESHOLD ====================
  const loadAqiThreshold = async () => {
    try {
      const key = guestMode ? "guestAqiThreshold" : `aqiThreshold_${user?.uid}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) setAqiThresholdState(parseInt(saved, 10));
    } catch (e) {
      console.error("Lỗi load AQI threshold:", e);
    }
  };

  const setAqiThreshold = async (value) => {
    try {
      setAqiThresholdState(value);
      const key = guestMode ? "guestAqiThreshold" : `aqiThreshold_${user?.uid}`;
      await AsyncStorage.setItem(key, value.toString());
    } catch (e) {
      console.error("Lỗi lưu AQI threshold:", e);
    }
  };

  // ==================== USER PROFILE ====================
  const loadUserProfile = async () => {
    if (!user && !guestMode) return;
    try {
      setLoading(true);
      if (guestMode) {
        const saved = await AsyncStorage.getItem("guestProfile");
        if (saved) setUserProfile(JSON.parse(saved));
        else {
          const guest = {
            displayName: "Khách",
            photoURL: "",
            email: "",
            phone: "",
            address: "",
            defaultRegion: "Hồ Chí Minh",
            bio: "Tài khoản khách - Chỉ lưu trên thiết bị",
            uid: "guest",
            points: 0,
            campaignsJoined: 0,
            wasteClassified: 0,
          };
          await AsyncStorage.setItem("guestProfile", JSON.stringify(guest));
          setUserProfile(guest);
        }
      } else {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile({
            ...userProfile,
            ...data,
            uid: user.uid,
            points: data.points ?? userProfile.points ?? 0,
            campaignsJoined: data.campaignsJoined ?? userProfile.campaignsJoined ?? 0,
            wasteClassified: data.wasteClassified ?? userProfile.wasteClassified ?? 0,
          });
        } else {
          const newProfile = {
            displayName: user.displayName || "Người dùng mới",
            photoURL: user.photoURL || "",
            email: user.email || "",
            phone: "",
            address: "",
            defaultRegion: "Hồ Chí Minh",
            bio: "",
            createdAt: new Date().toISOString(),
            uid: user.uid,
            points: 0,
            campaignsJoined: 0,
            wasteClassified: 0,
          };
          await setDoc(docRef, newProfile);
          setUserProfile(newProfile);
        }
      }
    } catch (e) {
      console.error("Lỗi load profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const newProfile = { ...userProfile, ...updates };
      if (guestMode) {
        await AsyncStorage.setItem("guestProfile", JSON.stringify(newProfile));
      } else {
        await setDoc(doc(db, "users", user.uid), newProfile, { merge: true });
      }
      setUserProfile(newProfile);
      return { success: true };
    } catch (e) {
      console.error("Lỗi cập nhật profile:", e);
      return { success: false, error: e.message };
    }
  };

  // ==================== ĐIỂM & HOẠT ĐỘNG ====================
  const addPoints = async (points) => {
    try {
      const newPoints = (userProfile.points || 0) + points;
      await updateUserProfile({ points: newPoints });
      return { success: true, newPoints };
    } catch (e) {
      console.error("Lỗi thêm điểm:", e);
      return { success: false };
    }
  };

  const incrementCampaignsJoined = async () => {
    try {
      if (guestMode) {
        const newCount = (userProfile.campaignsJoined || 0) + 1;
        await updateUserProfile({ campaignsJoined: newCount });
        await addPoints(10);
        return { success: true, count: newCount };
      }

      const ref = doc(db, "users", user.uid);

      await updateDoc(ref, {
        campaignsJoined: increment(1),
        points: increment(10),
      });

      const refreshed = {
        ...userProfile,
        campaignsJoined: userProfile.campaignsJoined + 1,
        points: (userProfile.points || 0) + 10,
      };
      setUserProfile(refreshed);

      return { success: true, count: refreshed.campaignsJoined };

    } catch (err) {
      console.error("Lỗi tăng chiến dịch:", err);
      return { success: false };
    }
  };

  // ==================== AI PHÂN LOẠI RÁC ====================
  const loadWasteClassificationHistory = async () => {
    try {
      const key = guestMode ? "guestWasteHistory" : `wasteHistory_${user?.uid}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setWasteClassificationHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Lỗi load waste history:", e);
    }
  };

  const addWasteClassification = async (wasteType, imageUri = null) => {
    try {
      const entry = {
        id: Date.now().toString(),
        type: wasteType,
        imageUri,
        timestamp: new Date().toISOString(),
      };

      const key = guestMode ? "guestWasteHistory" : `wasteHistory_${user?.uid}`;
      const existing = await AsyncStorage.getItem(key);
      const history = existing ? JSON.parse(existing) : [];

      const updated = [entry, ...history].slice(0, 100);
      await AsyncStorage.setItem(key, JSON.stringify(updated));
      setWasteClassificationHistory(updated);

      const newCount = (userProfile.wasteClassified || 0) + 1;
      await updateUserProfile({ wasteClassified: newCount });
      await addPoints(5);

      return { success: true, count: newCount };
    } catch (e) {
      console.error("Lỗi lưu waste classification:", e);
      return { success: false, error: e.message };
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
      uid: undefined,
      points: 0,
      campaignsJoined: 0,
      wasteClassified: 0,
    });
    setReportHistory([]);
    setChatHistory([]);
    setWasteClassificationHistory([]);
    setAqiThresholdState(3);
  };

  // ==================== BÁO CÁO ====================
  const loadReportHistory = async () => {
    try {
      const key = guestMode ? "guestReportHistory" : `reportHistory_${user.uid}`;
      const history = await AsyncStorage.getItem(key);
      setReportHistory(history ? JSON.parse(history) : []);
    } catch (error) {
      console.error("Lỗi load report history:", error);
    }
  };

  // ✅ LOAD TẤT CẢ BÁO CÁO TỪ FIRESTORE
  const loadAllReports = useCallback(async () => {
    if (guestMode) {
      try {
        const key = "guestReportHistory";
        const history = await AsyncStorage.getItem(key);
        setAllReports(history ? JSON.parse(history) : []);
      } catch (e) {
        console.error("Lỗi load guest reports:", e);
        setAllReports([]);
      }
      return;
    }

    try {
      console.log("📄 Đang load tất cả báo cáo từ Firestore...");
      const snap = await getDocs(collection(db, "reports"));
      const reports = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
      console.log(`✅ Load thành công ${reports.length} báo cáo từ Firestore`);
      setAllReports(reports);
    } catch (e) {
      console.error("❌ Lỗi load tất cả báo cáo:", e);
      setAllReports([]);
    }
  }, [guestMode]);

  const addReportToHistory = async (report) => {
    try {
      const newItem = {
        id: Date.now().toString(),
        ...report,
        timestamp: new Date().toISOString()
      };
      const updated = [newItem, ...reportHistory].slice(0, 50);
      setReportHistory(updated);

      const key = guestMode ? "guestReportHistory" : `reportHistory_${user?.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(updated));

      // ✅ LƯU VÀO FIRESTORE
      if (!guestMode && user?.uid) {
        try {
          console.log("💾 Đang lưu báo cáo vào Firestore...", {
            category: report.category,
            userUid: user.uid,
          });

          const docRef = await addDoc(collection(db, "reports"), {
            ...newItem,
            userUid: user.uid,
            userName: userProfile.displayName || user.displayName || "Người dùng",
            userPhoto: userProfile.photoURL || user.photoURL || "",
            timestamp: serverTimestamp(),
          });

          console.log("✅ Lưu báo cáo thành công với ID:", docRef.id);

          setTimeout(() => loadAllReports(), 500);

        } catch (firestoreError) {
          console.error("❌ LỖI KHI LƯU VÀO FIRESTORE:", firestoreError);
        }
      } else if (guestMode) {
        setAllReports(updated);
      }

      await addPoints(15);
      return { success: true };
    } catch (e) {
      console.error("❌ Lỗi thêm report:", e);
      return { success: false, error: e.message };
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const updatedHistory = reportHistory.map((r) =>
        r.id === reportId ? { ...r, status: newStatus } : r
      );
      setReportHistory(updatedHistory);
      const key = guestMode ? "guestReportHistory" : `reportHistory_${user?.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
      return { success: true };
    } catch (e) {
      console.error("Lỗi cập nhật trạng thái báo cáo:", e);
      return { success: false, error: e.message };
    }
  };

  const clearReportHistory = async () => {
    try {
      const key = guestMode ? "guestReportHistory" : `reportHistory_${user?.uid}`;
      await AsyncStorage.removeItem(key);
      setReportHistory([]);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  };

  // ✅ MIGRATE DỮ LIỆU CŨ LÊN FIRESTORE
  const migrateReportsToFirestore = async () => {
    if (guestMode || !user?.uid) {
      console.log("⭐️ Bỏ qua migrate: guest mode hoặc chưa đăng nhập");
      return { success: false, message: "Không thể migrate" };
    }

    try {
      console.log("📄 Bắt đầu migrate báo cáo lên Firestore...");

      const key = `reportHistory_${user.uid}`;
      const localReports = await AsyncStorage.getItem(key);

      if (!localReports) {
        console.log("ℹ️ Không có báo cáo local để migrate");
        return { success: true, message: "Không có dữ liệu cần migrate" };
      }

      const reports = JSON.parse(localReports);
      console.log(`📦 Tìm thấy ${reports.length} báo cáo local`);

      const existingReports = await getDocs(collection(db, "reports"));
      const existingIds = existingReports.docs.map(d => d.data().id);

      let migratedCount = 0;
      const batch = writeBatch(db);

      for (const report of reports) {
        if (!existingIds.includes(report.id)) {
          const docRef = doc(collection(db, "reports"));
          batch.set(docRef, {
            ...report,
            userUid: user.uid,
            userName: userProfile.displayName || user.displayName || "Người dùng",
            userPhoto: userProfile.photoURL || user.photoURL || "",
            timestamp: serverTimestamp(),
            migratedAt: new Date().toISOString(),
          });
          migratedCount++;
        }
      }

      if (migratedCount > 0) {
        await batch.commit();
        console.log(`✅ Migrate thành công ${migratedCount} báo cáo lên Firestore`);

        await loadAllReports();

        return { success: true, message: `Đã migrate ${migratedCount} báo cáo` };
      } else {
        console.log("ℹ️ Tất cả báo cáo đã được đồng bộ");
        return { success: true, message: "Dữ liệu đã được đồng bộ" };
      }

    } catch (error) {
      console.error("❌ Lỗi khi migrate:", error);
      return { success: false, error: error.message };
    }
  };

  // ==================== CHAT ====================
  const loadChatHistory = async () => {
    try {
      if (!user) {
        setChatHistory([]);
        return;
      }
      const key = guestMode ? "guestChatHistory" : `chatHistory_${user.uid}`;
      const history = await AsyncStorage.getItem(key);
      if (history) {
        const parsed = JSON.parse(history);
        const sorted = parsed.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setChatHistory(sorted);
      } else {
        setChatHistory([]);
      }
    } catch (error) {
      console.error("Lỗi load chat history:", error);
      setChatHistory([]);
    }
  };

  const addChatToHistory = async (message) => {
    try {
      if (!user) return { success: false, error: "No user" };
      const newMessage = {
        id: message.id || Date.now().toString(),
        sender: message.sender,
        message: message.message,
        timestamp: message.timestamp || new Date().toISOString(),
      };
      const key = guestMode ? "guestChatHistory" : `chatHistory_${user.uid}`;
      const existingData = await AsyncStorage.getItem(key);
      const existingHistory = existingData ? JSON.parse(existingData) : [];
      const newHistory = [newMessage, ...existingHistory].slice(0, 200);
      await AsyncStorage.setItem(key, JSON.stringify(newHistory));
      setChatHistory(newHistory);
      return { success: true };
    } catch (error) {
      console.error("Lỗi thêm chat:", error);
      return { success: false, error: error.message };
    }
  };

  const clearChatHistory = async () => {
    try {
      const key = guestMode ? "guestChatHistory" : `chatHistory_${user?.uid}`;
      await AsyncStorage.removeItem(key);
      setChatHistory([]);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  };

  // ==================== CỘNG ĐỒNG ====================
  const loadCommunity = useCallback(async () => {
    if (guestMode) {
      setCommunityPosts([]);
      setCommunityGroups([]);
      return;
    }
    try {
      setLoading(true);
      const [postsSnap, groupsSnap] = await Promise.all([
        getDocs(query(collection(db, "communityPosts"), orderBy("timestamp", "desc"))),
        getDocs(query(collection(db, "communityGroups"), orderBy("name", "asc"))),
      ]);
      const posts = postsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
      const groups = groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCommunityPosts(posts);
      setCommunityGroups(groups);
    } catch (e) {
      console.error("Lỗi load community:", e);
    } finally {
      setLoading(false);
    }
  }, [guestMode]);

  const loadUserGroups = useCallback(async () => {
    if (guestMode || !user?.uid) {
      setUserGroups([]);
      return;
    }
    try {
      const snap = await getDocs(collection(db, "communityGroups"));
      const joined = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((g) => (g.memberUids || []).includes(user.uid));
      setUserGroups(joined);
    } catch (e) {
      console.error("Lỗi load user groups:", e);
    }
  }, [guestMode, user?.uid]);

  const addCommunityPost = async ({ content, image = null, video = null, type = "text" }) => {
    try {
      if (guestMode) return { success: false, error: "Khách không thể đăng bài" };

      let uploadedImage = null;
      let uploadedVideo = null;

      if (image) {
        uploadedImage = await uploadToCloudinary(image, "image");
        if (!uploadedImage?.includes("cloudinary.com")) throw new Error("URL ảnh không hợp lệ");
      }

      if (video) {
        uploadedVideo = await uploadToCloudinary(video, "video");
        if (!uploadedVideo?.includes("cloudinary.com")) throw new Error("URL video không hợp lệ");
      }

      const postData = {
        content,
        type,
        image: uploadedImage || null,
        video: uploadedVideo || null,
        author: {
          displayName: userProfile.displayName || user.displayName,
          uid: user.uid,
          photoURL: userProfile.photoURL || user.photoURL || "",
        },
        likes: [],
        comments: [],
        shares: 0,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "communityPosts"), postData);
      await loadCommunity();
      await addPoints(8);
      return { success: true };
    } catch (e) {
      console.error("Lỗi đăng bài:", e);
      return { success: false, error: e.message };
    }
  };

  const addCommentToPost = async (postId, text, image = null) => {
    if (guestMode) return { success: false, error: "Khách không thể bình luận" };
    try {
      let uploadedImage = null;
      if (image) {
        uploadedImage = await uploadToCloudinary(image, "image");
        if (!uploadedImage?.includes("cloudinary.com")) throw new Error("URL ảnh comment không hợp lệ");
      }

      const comment = {
        id: Date.now().toString(),
        uid: user.uid,
        name: userProfile.displayName || "Người dùng",
        photoURL: userProfile.photoURL || "",
        text,
        image: uploadedImage || null,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(doc(db, "communityPosts", postId), {
        comments: arrayUnion(comment)
      });
      await loadCommunity();
      await addPoints(3);
      return { success: true };
    } catch (e) {
      console.error("Lỗi thêm bình luận:", e);
      return { success: false, error: e.message };
    }
  };

  const toggleLikeOnPost = async (postId) => {
    if (guestMode) return { success: false, error: "Khách không thể like" };
    try {
      const uid = user.uid;
      const postRef = doc(db, "communityPosts", postId);
      const post = communityPosts.find((p) => p.id === postId);
      const liked = post?.likes?.includes(uid);
      await updateDoc(postRef, {
        likes: liked ? arrayRemove(uid) : arrayUnion(uid)
      });
      await loadCommunity();
      if (!liked) await addPoints(1);
      return { success: true, action: liked ? "unliked" : "liked" };
    } catch (e) {
      console.error("Lỗi toggle like:", e);
      return { success: false, error: e.message };
    }
  };

  const sharePost = async (postId) => {
    try {
      await updateDoc(doc(db, "communityPosts", postId), { shares: increment(1) });
      await loadCommunity();
      await addPoints(5);
      return { success: true };
    } catch (e) {
      console.error("Lỗi share post:", e);
      return { success: false, error: e.message };
    }
  };

  const deleteComment = async (postId, commentId) => {
    try {
      const post = communityPosts.find((p) => p.id === postId);
      if (!post) return { success: false, error: "Bài viết không tồn tại" };
      const updatedComments = (post.comments || []).filter((c) => c.id !== commentId);
      await updateDoc(doc(db, "communityPosts", postId), { comments: updatedComments });
      await loadCommunity();
      return { success: true };
    } catch (e) {
      console.error("Lỗi xóa comment:", e);
      return { success: false, error: e.message };
    }
  };

  const createGroup = async ({ name, icon = "🏙️", color = "#4CAF50", region = "Hồ Chí Minh", district = "", ward = "", description = "" }) => {
    if (guestMode) return { success: false, error: "Khách không thể tạo nhóm" };
    try {
      const uid = user.uid;
      const creatorName = userProfile?.displayName || "Người dùng";
      const creatorPhotoURL = userProfile?.photoURL || "";
      const groupObj = {
        name, icon, color, region, district, ward, description,
        members: 1,
        memberUids: [uid],
        creator: { uid, name: creatorName, photoURL: creatorPhotoURL },
        createdAt: serverTimestamp(),
        posts: [],
      };
      const docRef = await addDoc(collection(db, "communityGroups"), groupObj);
      await loadCommunity();
      await loadUserGroups();
      await addPoints(20);
      return { success: true, id: docRef.id };
    } catch (e) {
      console.error("Lỗi tạo group:", e);
      return { success: false, error: e.message };
    }
  };

  const joinGroup = async (groupId) => {
    if (guestMode) return { success: false, error: "Khách không thể tham gia nhóm" };
    try {
      const refDoc = doc(db, "communityGroups", groupId);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) return { success: false, error: "Nhóm không tồn tại" };
      const data = snap.data();
      const isMember = (data.memberUids || []).includes(user.uid);
      const batch = writeBatch(db);
      batch.update(refDoc, {
        memberUids: isMember ? arrayRemove(user.uid) : arrayUnion(user.uid),
        members: isMember ? increment(-1) : increment(1),
      });
      await batch.commit();
      await loadCommunity();
      await loadUserGroups();
      if (!isMember) await addPoints(10);
      return { success: true, action: isMember ? "left" : "joined" };
    } catch (e) {
      console.error("Lỗi join/leave group:", e);
      return { success: false, error: e.message };
    }
  };

  const deleteGroup = async (groupId) => {
    if (guestMode) return { success: false, error: "Khách không thể xóa nhóm" };
    try {
      const refDoc = doc(db, "communityGroups", groupId);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) return { success: false, error: "Nhóm không tồn tại." };
      if (snap.data().creator?.uid !== user.uid)
        return { success: false, error: "Chỉ người tạo nhóm mới có thể xóa." };
      await deleteDoc(refDoc);
      await loadCommunity();
      await loadUserGroups();
      return { success: true };
    } catch (e) {
      console.error("Lỗi xóa group:", e);
      return { success: false, error: e.message };
    }
  };

  const deleteCommunityPost = async (postId) => {
    try {
      await deleteDoc(doc(db, "communityPosts", postId));
      setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
      return { success: true };
    } catch (e) {
      console.error("Lỗi xóa bài viết:", e);
      return { success: false, error: e.message };
    }
  };

  const updateCommunityPost = async (postId, updates) => {
    try {
      await updateDoc(doc(db, "communityPosts", postId), updates);
      await loadCommunity();
      return { success: true };
    } catch (e) {
      console.error("Lỗi cập nhật bài viết:", e);
      return { success: false, error: e.message };
    }
  };

  const clearAllLocalData = async () => {
    try {
      const keys = [
        "guestProfile",
        "guestReportHistory",
        "guestChatHistory",
        "guestAqiThreshold",
        "guest_notifications",
        "guest_notifSettings",
        "guestWasteHistory",
        "guestPermissions",
      ];
      await AsyncStorage.multiRemove(keys);
    } catch (e) {
      console.error("Lỗi xóa dữ liệu local:", e);
    }
  };

  // ==================== ✅ DELETE ALL USER DATA (FOR DELETE ACCOUNT) ====================
  const deleteAllUserData = async (uid) => {
    if (!uid) return { success: false, error: "Không có UID" };

    try {
      const batch = writeBatch(db);

      // 1. Xóa user profile
      const userDocRef = doc(db, "users", uid);
      batch.delete(userDocRef);

      // 2. Xóa tất cả bài viết của user
      const postsQuery = query(
        collection(db, "communityPosts"),
        where("author.uid", "==", uid)
      );
      const postsSnap = await getDocs(postsQuery);
      postsSnap.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      // 3. Xóa user khỏi tất cả groups
      const groupsQuery = query(
        collection(db, "communityGroups"),
        where("memberUids", "array-contains", uid)
      );
      const groupsSnap = await getDocs(groupsQuery);
      groupsSnap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          memberUids: arrayRemove(uid),
          members: increment(-1),
        });
      });

      // 4. Xóa các groups do user tạo
      const createdGroupsQuery = query(
        collection(db, "communityGroups"),
        where("creator.uid", "==", uid)
      );
      const createdGroupsSnap = await getDocs(createdGroupsQuery);
      createdGroupsSnap.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      // 5. Xóa comments của user
      const allPostsSnap = await getDocs(collection(db, "communityPosts"));
      allPostsSnap.docs.forEach((docSnap) => {
        const post = docSnap.data();
        const comments = post.comments || [];
        const filteredComments = comments.filter(c => c.uid !== uid);

        if (filteredComments.length !== comments.length) {
          batch.update(docSnap.ref, { comments: filteredComments });
        }
      });

      // 6. Xóa likes của user
      allPostsSnap.docs.forEach((docSnap) => {
        const post = docSnap.data();
        if (post.likes?.includes(uid)) {
          batch.update(docSnap.ref, { likes: arrayRemove(uid) });
        }
      });

      // 7. Xóa tất cả reports của user
      const reportsQuery = query(
        collection(db, "reports"),
        where("userUid", "==", uid)
      );
      const reportsSnap = await getDocs(reportsQuery);
      reportsSnap.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      // Thực thi batch
      await batch.commit();

      console.log("✅ Đã xóa toàn bộ dữ liệu Firestore của user:", uid);
      return { success: true };

    } catch (error) {
      console.error("❌ Lỗi xóa dữ liệu Firestore:", error);
      return { success: false, error: error.message };
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (user || guestMode) {
      loadUserProfile();
      loadReportHistory();
      loadChatHistory();
      loadAqiThreshold();
      loadCommunity();
      loadUserGroups();
      loadWasteClassificationHistory();
      loadAllReports();

      // ✅ Tự động migrate dữ liệu cũ lên Firestore
      if (!guestMode && user?.uid) {
        setTimeout(() => {
          migrateReportsToFirestore();
        }, 2000);
      }
    } else {
      clearProfile();
      setCommunityPosts([]);
      setCommunityGroups([]);
      setUserGroups([]);
      setAllReports([]);
    }
  }, [user, guestMode]);

  // ==================== CONTEXT VALUE ====================
  const contextValue = {
    // Profile & Loading
    userProfile,
    loading,
    updateUserProfile,
    loadUserProfile,
    clearProfile,

    // Điểm & Hoạt động
    addPoints,
    incrementCampaignsJoined,

    // AQI
    aqiThreshold,
    setAqiThreshold,

    // Báo cáo
    reportHistory,
    allReports,
    addReportToHistory,
    updateReportStatus,
    clearReportHistory,
    loadAllReports,
    migrateReportsToFirestore,

    // Chat
    chatHistory,
    addChatToHistory,
    loadChatHistory,
    clearChatHistory,

    // AI Phân loại rác
    wasteClassificationHistory,
    addWasteClassification,

    // Cộng đồng
    communityPosts,
    communityGroups,
    userGroups,
    loadCommunity,
    loadUserGroups,
    addCommunityPost,
    addCommentToPost,
    toggleLikeOnPost,
    sharePost,
    deleteComment,
    createGroup,
    joinGroup,
    deleteGroup,
    deleteCommunityPost,
    updateCommunityPost,

    // Utility
    uploadToCloudinary,
    clearAllLocalData,
    deleteAllUserData,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
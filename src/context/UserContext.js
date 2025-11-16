// src/context/UserContext.js - SỬ DỤNG CLOUDINARY THAY VÌ FIREBASE STORAGE

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
  // 🔥 Đăng ký tại: https://cloudinary.com/users/register/free
  // 🔥 Sau khi đăng ký, lấy cloud_name từ Dashboard
  const CLOUDINARY_CLOUD_NAME = "dlydwc9t3"; // ⚠️ THAY BẰNG CLOUD NAME CỦA BẠN
  const CLOUDINARY_UPLOAD_PRESET = "green_hanoi"; // Tạo unsigned preset (hướng dẫn bên dưới)
  
  // States
  const [userProfile, setUserProfile] = useState({
    displayName: "",
    photoURL: "",
    email: "",
    phone: "",
    address: "",
    defaultRegion: "Hồ Chí Minh",
    bio: "",
    uid: undefined,
  });

  const [reportHistory, setReportHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aqiThreshold, setAqiThresholdState] = useState(3);

  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);

  /**
   * uploadToCloudinary - UPLOAD MIỄN PHÍ
   * Không cần API key, hoàn toàn free trong giới hạn 25GB/tháng
   */
  const uploadToCloudinary = async (uri, resourceType = "image") => {
    if (!uri) throw new Error("URI không hợp lệ");

    // Kiểm tra nếu đã là URL Cloudinary
    if (typeof uri === "string" && uri.includes("cloudinary.com")) {
      return uri;
    }

    try {
      console.log("📤 Upload lên Cloudinary:", { uri: uri.substring(0, 50), resourceType });

      // Tạo FormData
      const formData = new FormData();
      
      // Xử lý file name và type
      let fileName = "upload_" + Date.now();
      let fileType = "image/jpeg";
      
      if (resourceType === "video") {
        fileName += ".mp4";
        fileType = "video/mp4";
      } else {
        fileName += ".jpg";
      }

      // Thêm file vào FormData
      formData.append("file", {
        uri: uri,
        type: fileType,
        name: fileName,
      });
      
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);
      
      // Thêm folder để organize
      const folder = resourceType === "video" ? "videos" : "images";
      formData.append("folder", `green_hanoi/${folder}`);

      // Upload
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
      
      return data.secure_url; // URL công khai

    } catch (error) {
      console.error("❌ Upload Cloudinary thất bại:", error);
      throw new Error(`Upload thất bại: ${error.message}`);
    }
  };

  // ==================== AQI threshold ====================
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
          };
          await AsyncStorage.setItem("guestProfile", JSON.stringify(guest));
          setUserProfile(guest);
        }
      } else {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserProfile({ ...docSnap.data(), uid: user.uid });
        else {
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
    });
    setReportHistory([]);
    setChatHistory([]);
    setAqiThresholdState(3);
  };

  // ==================== REPORT / CHAT HISTORY ====================
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
      const newItem = { id: Date.now().toString(), ...report, timestamp: new Date().toISOString() };
      const updated = [newItem, ...reportHistory].slice(0, 50);
      setReportHistory(updated);
      const key = guestMode ? "guestReportHistory" : `reportHistory_${user?.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(updated));
      return { success: true };
    } catch (e) {
      console.error("Lỗi thêm report:", e);
      return { success: false, error: e.message };
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const updatedHistory = reportHistory.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r));
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
      console.error("❌ Lỗi load chat history:", error);
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
      console.error("❌ Lỗi thêm chat:", error);
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

  // ==================== COMMUNITY ====================
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
      const joined = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((g) => (g.memberUids || []).includes(user.uid));
      setUserGroups(joined);
    } catch (e) {
      console.error("Lỗi load user groups:", e);
    }
  }, [guestMode, user?.uid]);

  /**
   * ✅ addCommunityPost - SỬ DỤNG CLOUDINARY
   */
  const addCommunityPost = async ({ content, image = null, video = null, type = "text" }) => {
    try {
      if (guestMode) return { success: false, error: "Khách không thể đăng bài" };

      let uploadedImage = null;
      let uploadedVideo = null;

      // Upload image
      if (image) {
        try {
          uploadedImage = await uploadToCloudinary(image, "image");
          if (!uploadedImage || !uploadedImage.includes("cloudinary.com")) {
            throw new Error("URL ảnh không hợp lệ");
          }
        } catch (err) {
          console.error("❌ Lỗi upload ảnh:", err);
          return { success: false, error: `Không thể upload ảnh: ${err.message}` };
        }
      }

      // Upload video
      if (video) {
        try {
          uploadedVideo = await uploadToCloudinary(video, "video");
          if (!uploadedVideo || !uploadedVideo.includes("cloudinary.com")) {
            throw new Error("URL video không hợp lệ");
          }
        } catch (err) {
          console.error("❌ Lỗi upload video:", err);
          return { success: false, error: `Không thể upload video: ${err.message}` };
        }
      }

      // Lưu vào Firestore
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

      console.log("💾 Lưu post vào Firestore:", { 
        hasImage: !!uploadedImage, 
        hasVideo: !!uploadedVideo,
      });

      await addDoc(collection(db, "communityPosts"), postData);
      await loadCommunity();
      return { success: true };
    } catch (e) {
      console.error("Lỗi đăng bài:", e);
      return { success: false, error: e.message };
    }
  };

  /**
   * ✅ addCommentToPost - SỬ DỤNG CLOUDINARY
   */
  const addCommentToPost = async (postId, text, image = null) => {
    if (guestMode) return { success: false, error: "Khách không thể bình luận" };
    try {
      let uploadedImage = null;
      if (image) {
        try {
          uploadedImage = await uploadToCloudinary(image, "image");
          if (!uploadedImage || !uploadedImage.includes("cloudinary.com")) {
            throw new Error("URL ảnh comment không hợp lệ");
          }
        } catch (err) {
          console.error("❌ Lỗi upload ảnh comment:", err);
          return { success: false, error: `Không thể upload ảnh: ${err.message}` };
        }
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

      await updateDoc(doc(db, "communityPosts", postId), { comments: arrayUnion(comment) });
      await loadCommunity();
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
      await updateDoc(postRef, { likes: liked ? arrayRemove(uid) : arrayUnion(uid) });
      await loadCommunity();
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
      if (snap.data().creator?.uid !== user.uid) return { success: false, error: "Chỉ người tạo nhóm mới có thể xóa." };
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
      const keys = ["guestProfile", "guestReportHistory", "guestChatHistory", "guestAqiThreshold", "guest_notifications", "guest_notifSettings"];
      await AsyncStorage.multiRemove(keys);
    } catch (e) {
      console.error("Lỗi xóa dữ liệu local:", e);
    }
  };

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

      // 5. Xóa comments của user (cập nhật các posts có comment của user)
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

      // Thực thi batch
      await batch.commit();

      console.log("✅ Đã xóa toàn bộ dữ liệu Firestore của user:", uid);
      return { success: true };

    } catch (error) {
      console.error("❌ Lỗi xóa dữ liệu Firestore:", error);
      return { success: false, error: error.message };
    }
  };

  // Effects
  useEffect(() => {
    if (user || guestMode) {
      loadUserProfile();
      loadReportHistory();
      loadChatHistory();
      loadAqiThreshold();
      loadCommunity();
      loadUserGroups();
    } else {
      clearProfile();
      setCommunityPosts([]);
      setCommunityGroups([]);
      setUserGroups([]);
    }
  }, [user, guestMode]);

  return (
    <UserContext.Provider
      value={{
        userProfile,
        reportHistory,
        chatHistory,
        loading,
        aqiThreshold,
        setAqiThreshold,
        updateUserProfile,
        addReportToHistory,
        addChatToHistory,
        loadChatHistory,
        clearChatHistory,
        clearReportHistory,
        clearAllLocalData,
        loadUserProfile,
        updateReportStatus,
        communityPosts,
        communityGroups,
        userGroups,
        loadCommunity,
        loadUserGroups,
        addCommunityPost,
        updateCommunityPost,
        deleteCommunityPost,
        toggleLikeOnPost,
        addCommentToPost,
        deleteComment,
        sharePost,
        createGroup,
        joinGroup,
        deleteGroup,
        uploadToCloudinary,
        deleteAllUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
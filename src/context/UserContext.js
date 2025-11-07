// src/context/UserContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
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
  serverTimestamp,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
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
    uid: undefined,
  });

  const [reportHistory, setReportHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aqiThreshold, setAqiThresholdState] = useState(3);

  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);

  useEffect(() => {
    if (user) {
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
  }, [user]);

  // AQI threshold
  const loadAqiThreshold = async () => {
    try {
      const key = guestMode ? "guestAqiThreshold" : `aqiThreshold_${user.uid}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) setAqiThresholdState(parseInt(saved));
    } catch (error) {
      console.error("❌ Lỗi load AQI threshold:", error);
    }
  };

  const setAqiThreshold = async (value) => {
    try {
      setAqiThresholdState(value);
      const key = guestMode ? "guestAqiThreshold" : `aqiThreshold_${user.uid}`;
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error("❌ Lỗi lưu AQI threshold:", error);
    }
  };

  // Profile
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      if (guestMode) {
        const guestProfile = await AsyncStorage.getItem("guestProfile");
        if (guestProfile) setUserProfile(JSON.parse(guestProfile));
        else {
          setUserProfile({
            displayName: user?.displayName || "Khách",
            photoURL: "",
            email: "",
            phone: "",
            address: "",
            defaultRegion: "Hồ Chí Minh",
            bio: "Tài khoản khách - Dữ liệu chỉ lưu trên thiết bị này",
            uid: "guest",
          });
        }
      } else {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile({ ...data, uid: user.uid });
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
            uid: user.uid,
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

  // Report / Chat history
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
      uid: undefined,
    });
    setReportHistory([]);
    setChatHistory([]);
    setAqiThresholdState(3);
  };

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

  // ===== COMMUNITY FUNCTIONS =====

  // Load all posts and groups
  const loadCommunity = async () => {
    try {
      setLoading(true);

      // Load posts
      const postsCol = collection(db, "communityPosts");
      const postsQ = query(postsCol, orderBy("timestamp", "desc"));
      const postsSnap = await getDocs(postsQ);
      const posts = postsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });

      // Load groups
      const groupsCol = collection(db, "communityGroups");
      const groupsQ = query(groupsCol, orderBy("name", "asc"));
      const groupsSnap = await getDocs(groupsQ);
      const groups = groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      setCommunityPosts(posts);
      setCommunityGroups(groups);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi load community:", error);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Load user's joined groups
  const loadUserGroups = async () => {
    try {
      const uid = guestMode ? "guest" : user?.uid;
      if (!uid) return;

      const groupsCol = collection(db, "communityGroups");
      const groupsSnap = await getDocs(groupsCol);
      const joined = groupsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((g) => (g.memberUids || []).includes(uid));

      setUserGroups(joined);
    } catch (error) {
      console.error("❌ Lỗi load user groups:", error);
    }
  };

  // Add post with image/video
  const addCommunityPost = async ({ content, image = null, video = null, type = "text" }) => {
    try {
      const author = guestMode
        ? {
            displayName: userProfile.displayName || "Khách",
            uid: userProfile.uid || "guest",
            photoURL: userProfile.photoURL || "",
          }
        : {
            displayName: userProfile.displayName || user.displayName || "Người dùng",
            uid: userProfile.uid || user.uid,
            photoURL: userProfile.photoURL || user.photoURL || "",
          };

      const postData = {
        content,
        type,
        image: image || null,
        video: video || null,
        author,
        likes: [],
        comments: [],
        shares: 0,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "communityPosts"), postData);

      await loadCommunity();
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("❌ Lỗi thêm community post:", error);
      return { success: false, error: error.message };
    }
  };

  // Toggle like
  const toggleLikeOnPost = async (postId) => {
    try {
      const uid = guestMode ? "guest" : user.uid;
      const postDoc = doc(db, "communityPosts", postId);
      
      const localPost = communityPosts.find((p) => p.id === postId);
      const likes = localPost?.likes || [];
      const already = likes.includes(uid);

      if (already) {
        await updateDoc(postDoc, { likes: arrayRemove(uid) });
      } else {
        await updateDoc(postDoc, { likes: arrayUnion(uid) });
      }

      await loadCommunity();
      return { success: true, action: already ? "unliked" : "liked" };
    } catch (error) {
      console.error("❌ Lỗi toggle like:", error);
      return { success: false, error: error.message };
    }
  };

  // Add comment with optional image
  const addCommentToPost = async (postId, text, image = null) => {
    try {
      const uid = guestMode ? "guest" : user.uid;
      const name = userProfile?.displayName || (guestMode ? "Khách" : user.email?.split("@")[0] || "Người dùng");
      const photoURL = userProfile?.photoURL || "";
      
      const comment = {
        id: Date.now().toString(),
        uid,
        name,
        photoURL,
        text,
        image: image || null,
        timestamp: new Date().toISOString(),
      };

      const postDoc = doc(db, "communityPosts", postId);
      await updateDoc(postDoc, { comments: arrayUnion(comment) });

      await loadCommunity();
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi thêm comment:", error);
      return { success: false, error: error.message };
    }
  };

  // Share post
  const sharePost = async (postId) => {
    try {
      const postDoc = doc(db, "communityPosts", postId);
      await updateDoc(postDoc, { 
        shares: increment(1) 
      });

      await loadCommunity();
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi share post:", error);
      return { success: false, error: error.message };
    }
  };

  // Delete comment
  const deleteComment = async (postId, commentId) => {
    try {
      const post = communityPosts.find((p) => p.id === postId);
      if (!post) return { success: false, error: "Bài viết không tồn tại" };

      const updatedComments = (post.comments || []).filter((c) => c.id !== commentId);
      
      const postDoc = doc(db, "communityPosts", postId);
      await updateDoc(postDoc, { comments: updatedComments });

      await loadCommunity();
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi xóa comment:", error);
      return { success: false, error: error.message };
    }
  };

  // Create group (có đầy đủ region, district, ward)
  const createGroup = async ({ 
    name, 
    icon = "🏙️", 
    color = "#4CAF50",
    region = "Hồ Chí Minh",
    district = "",
    ward = "",
    description = ""
  }) => {
    try {
      const uid = guestMode ? "guest" : user.uid;
      const creatorName = userProfile?.displayName || "Người dùng";
      const creatorPhotoURL = userProfile?.photoURL || "";

      const groupObj = {
        name,
        icon,
        color,
        region,
        district,
        ward,
        description,
        members: 1,
        memberUids: [uid],
        creator: {
          uid,
          name: creatorName,
          photoURL: creatorPhotoURL,
        },
        createdAt: serverTimestamp(),
        posts: [],
      };
      
      const docRef = await addDoc(collection(db, "communityGroups"), groupObj);
      await loadCommunity();
      await loadUserGroups();
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("❌ Lỗi tạo group:", error);
      return { success: false, error: error.message };
    }
  };

  // Join/Leave group
  const joinGroup = async (groupId) => {
    try {
      const uid = guestMode ? "guest" : user.uid;
      const groupDoc = doc(db, "communityGroups", groupId);

      const gSnap = await getDoc(groupDoc);
      if (!gSnap.exists()) return { success: false, error: "Nhóm không tồn tại." };

      const g = gSnap.data();
      const memberUids = g.memberUids || [];
      const already = memberUids.includes(uid);

      if (already) {
        await updateDoc(groupDoc, {
          memberUids: arrayRemove(uid),
          members: Math.max((g.members || 1) - 1, 0),
        });
        await loadCommunity();
        await loadUserGroups();
        return { success: true, action: "left" };
      } else {
        await updateDoc(groupDoc, {
          memberUids: arrayUnion(uid),
          members: (g.members || 0) + 1,
        });
        await loadCommunity();
        await loadUserGroups();
        return { success: true, action: "joined" };
      }
    } catch (error) {
      console.error("❌ Lỗi join/leave group:", error);
      return { success: false, error: error.message };
    }
  };

  // Delete group (chỉ người tạo mới được xóa)
  const deleteGroup = async (groupId) => {
    try {
      const uid = guestMode ? "guest" : user.uid;
      const groupDoc = doc(db, "communityGroups", groupId);

      const gSnap = await getDoc(groupDoc);
      if (!gSnap.exists()) return { success: false, error: "Nhóm không tồn tại." };

      const g = gSnap.data();
      
      // Kiểm tra quyền
      if (g.creator?.uid !== uid) {
        return { success: false, error: "Chỉ người tạo nhóm mới có thể xóa." };
      }

      await deleteDoc(groupDoc);
      await loadCommunity();
      await loadUserGroups();
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi xóa group:", error);
      return { success: false, error: error.message };
    }
  };

  // Delete post
  const deleteCommunityPost = async (postId) => {
    try {
      const postDoc = doc(db, "communityPosts", postId);
      await deleteDoc(postDoc);

      setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi xóa bài viết:", error);
      return { success: false, error: error.message };
    }
  };

  // Update post
  const updateCommunityPost = async (postId, updates) => {
    try {
      const postDoc = doc(db, "communityPosts", postId);
      await updateDoc(postDoc, updates);

      await loadCommunity();
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi cập nhật bài viết:", error);
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
        updateReportStatus,
        aqiThreshold,
        setAqiThreshold,

        // Community features
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
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
// src/screens/CommunityScreen.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Share,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../context/UserContext";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import SafeAreaScrollView from "../components/SafeAreaScrollView";


export default function CommunityScreen({ navigation }) {
  const {
    communityPosts = [],
    communityGroups = [],
    userGroups = [],
    loadCommunity,
    loadUserGroups,
    addCommunityPost,
    toggleLikeOnPost,
    addCommentToPost,
    deleteComment,
    sharePost,
    createGroup,
    joinGroup,
    deleteGroup,
    deleteCommunityPost,
    userProfile,
    loading,
  } = useContext(UserContext);

  // ✅ Thêm state để quản lý communityPosts local
  const [localPosts, setLocalPosts] = useState([]);

  // ✅ Sync communityPosts từ context vào local state
  useEffect(() => {
    setLocalPosts(communityPosts);
  }, [communityPosts]);

  const [activeTab, setActiveTab] = useState("posts");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [postVideo, setPostVideo] = useState(null);
  const [postType, setPostType] = useState("text");

  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupRegion, setGroupRegion] = useState("Hồ Chí Minh");
  const [groupDistrict, setGroupDistrict] = useState("");
  const [groupWard, setGroupWard] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupIcon, setGroupIcon] = useState("🏙️");
  const [groupColor, setGroupColor] = useState("#4CAF50");

  const [commentText, setCommentText] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);

  // Comment modal states
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentComment, setCurrentComment] = useState("");
  const [commentImage, setCommentImage] = useState(null);

  useEffect(() => {
    loadCommunity && loadCommunity();
    loadUserGroups && loadUserGroups();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunity();
    await loadUserGroups();
    setRefreshing(false);
  };

  // Pick image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPostImage(result.assets[0].uri);
        setPostVideo(null);
        setPostType("image");
      }
    } catch (error) {
      console.error("❌ Lỗi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  // Pick video
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setPostVideo(result.assets[0].uri);
        setPostImage(null);
        setPostType("video");
      }
    } catch (error) {
      console.error("❌ Lỗi chọn video:", error);
      Alert.alert("Lỗi", "Không thể chọn video");
    }
  };

  // Submit post
  const handleSubmitPost = async () => {
    if (!postContent.trim() && !postImage && !postVideo) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung hoặc chọn hình ảnh/video.");
      return;
    }

    const res = await addCommunityPost({
      content: postContent.trim(),
      image: postImage,
      video: postVideo,
      type: postType,
    });

    if (res?.success) {
      setPostContent("");
      setPostImage(null);
      setPostVideo(null);
      setPostType("text");
      setShowCreatePost(false);
      await loadCommunity();
      Alert.alert("Thành công", "Đã đăng bài viết!");
    } else {
      Alert.alert("Lỗi", res?.error || "Không thể đăng bài.");
    }
  };

  // Toggle like
  const handleToggleLike = async (postId) => {
    const res = await toggleLikeOnPost(postId);
    if (res?.success) {
      await loadCommunity();
    }
  };

  // Add comment with image - VERSION ĐƠN GIẢN, KHÔNG RELOAD
  // Add comment with image - FIX: Giữ comment khi có ảnh
  const handleAddComment = async (postId) => {
    const text = currentComment.trim();
    if (!text && !commentImage) return;

    // Clear input trước
    const commentToSend = text;
    const imageToSend = commentImage;
    setCurrentComment("");
    setCommentImage(null);

    // ✅ Tạo comment với ID tạm để hiển thị ngay
    const tempId = `temp_${Date.now()}`;
    const newComment = {
      id: tempId,
      uid: userProfile?.uid || "guest",
      name: userProfile?.displayName || "Bạn",
      photoURL: userProfile?.photoURL || "",
      text: commentToSend,
      image: imageToSend, // Local URI trước, Cloudinary URL sau
      timestamp: new Date().toISOString(),
      uploading: !!imageToSend, // Đánh dấu đang upload ảnh
    };

    // ✅ Thêm comment vào UI ngay lập tức
    const updatedComments = [...(selectedPost?.comments || []), newComment];
    const updatedPost = { ...selectedPost, comments: updatedComments };

    setSelectedPost(updatedPost);
    setLocalPosts(prevPosts =>
      prevPosts.map(p => p.id === postId ? updatedPost : p)
    );

    // ✅ Upload lên server ở background
    try {
      const res = await addCommentToPost(postId, commentToSend, imageToSend);

      if (res?.success) {
        console.log("✅ Comment đã được lưu trên server");

        // ✅ Nếu có ảnh, cập nhật comment với Cloudinary URL KHÔNG XÓA
        if (imageToSend && res.comment) {
          // Thay thế comment tạm bằng comment thật từ server
          setSelectedPost(prev => ({
            ...prev,
            comments: (prev?.comments || []).map(c =>
              c.id === tempId ? { ...res.comment, uploading: false } : c
            )
          }));

          setLocalPosts(prevPosts =>
            prevPosts.map(p => p.id === postId ? ({
              ...p,
              comments: (p.comments || []).map(c =>
                c.id === tempId ? { ...res.comment, uploading: false } : c
              )
            }) : p)
          );
        } else {
          // Không có ảnh, chỉ đánh dấu đã upload
          setSelectedPost(prev => ({
            ...prev,
            comments: (prev?.comments || []).map(c =>
              c.id === tempId ? { ...c, uploading: false, id: res.comment?.id || c.id } : c
            )
          }));

          setLocalPosts(prevPosts =>
            prevPosts.map(p => p.id === postId ? ({
              ...p,
              comments: (p.comments || []).map(c =>
                c.id === tempId ? { ...c, uploading: false, id: res.comment?.id || c.id } : c
              )
            }) : p)
          );
        }

      } else {
        // ❌ Nếu lỗi, xóa comment tạm
        Alert.alert("Lỗi", res?.error || "Không thể gửi bình luận");

        const rollbackComments = (selectedPost?.comments || []).filter(
          c => c.id !== tempId
        );
        const rollbackPost = { ...selectedPost, comments: rollbackComments };

        setSelectedPost(rollbackPost);
        setLocalPosts(prevPosts =>
          prevPosts.map(p => p.id === postId ? rollbackPost : p)
        );

        // Khôi phục input
        setCurrentComment(commentToSend);
        setCommentImage(imageToSend);
      }
    } catch (error) {
      console.error("❌ Lỗi khi gửi comment:", error);
      Alert.alert("Lỗi", "Không thể gửi bình luận");

      // Rollback
      const rollbackComments = (selectedPost?.comments || []).filter(
        c => c.id !== tempId
      );
      const rollbackPost = { ...selectedPost, comments: rollbackComments };

      setSelectedPost(rollbackPost);
      setLocalPosts(prevPosts =>
        prevPosts.map(p => p.id === postId ? rollbackPost : p)
      );

      setCurrentComment(commentToSend);
      setCommentImage(imageToSend);
    }
  };

  // Pick image for comment
  const pickCommentImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCommentImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("❌ Lỗi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  // Open comment modal
  const openCommentModal = (post) => {
    setSelectedPost(post);
    setCurrentComment("");
    setCommentImage(null);
    setShowCommentModal(true);
  };

  // Delete comment - XÓA NGAY LẬP TỨC
  const handleDeleteComment = async (postId, commentId) => {
    Alert.alert("Xác nhận", "Xóa bình luận này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          // ✅ Lưu comment để rollback nếu cần
          const commentToDelete = (selectedPost?.comments || []).find(c => c.id === commentId);

          // ✅ Xóa ngay trên UI
          const updatedComments = (selectedPost?.comments || []).filter(
            c => c.id !== commentId
          );
          const updatedPost = { ...selectedPost, comments: updatedComments };

          setSelectedPost(updatedPost);
          setLocalPosts(prevPosts =>
            prevPosts.map(p => p.id === postId ? updatedPost : p)
          );

          // ✅ Xóa trên server ở background
          try {
            const res = await deleteComment(postId, commentId);

            if (res?.success) {
              console.log("✅ Đã xóa comment trên server");
              // Không cần reload, UI đã update rồi
            } else {
              // ❌ Nếu lỗi, khôi phục lại comment
              Alert.alert("Lỗi", "Không thể xóa bình luận");

              if (commentToDelete) {
                const rollbackComments = [...updatedComments, commentToDelete];
                const rollbackPost = { ...selectedPost, comments: rollbackComments };

                setSelectedPost(rollbackPost);
                setLocalPosts(prevPosts =>
                  prevPosts.map(p => p.id === postId ? rollbackPost : p)
                );
              }
            }
          } catch (error) {
            console.error("❌ Lỗi xóa comment:", error);
            Alert.alert("Lỗi", "Không thể xóa bình luận");

            // Rollback
            if (commentToDelete) {
              const rollbackComments = [...updatedComments, commentToDelete];
              const rollbackPost = { ...selectedPost, comments: rollbackComments };

              setSelectedPost(rollbackPost);
              setLocalPosts(prevPosts =>
                prevPosts.map(p => p.id === postId ? rollbackPost : p)
              );
            }
          }
        },
      },
    ]);
  };

  // Share post
  const handleSharePost = async (post) => {
    try {
      const message = `${post.content}\n\n- Chia sẻ từ Green App`;

      const result = await Share.share(
        {
          message: message,
          title: "Chia sẻ bài viết",
        },
        {
          dialogTitle: "Chia sẻ qua",
        }
      );

      if (result.action === Share.sharedAction) {
        await sharePost(post.id);
        Alert.alert("Thành công", "Đã chia sẻ bài viết!");
        await loadCommunity();
      }
    } catch (error) {
      console.error("❌ Lỗi chia sẻ:", error);
      Alert.alert("Lỗi", "Không thể chia sẻ bài viết");
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa bài viết này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const res = await deleteCommunityPost(postId);
          if (res?.success) {
            Alert.alert("Đã xóa", "Bài viết đã được xóa.");
            await loadCommunity();
          } else {
            Alert.alert("Lỗi", res?.error || "Không thể xóa bài viết.");
          }
        },
      },
    ]);
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Lỗi", "Tên nhóm không được để trống.");
      return;
    }

    const res = await createGroup({
      name: groupName.trim(),
      icon: groupIcon,
      color: groupColor,
      region: groupRegion,
      district: groupDistrict,
      ward: groupWard,
      description: groupDescription,
    });

    if (res?.success) {
      setGroupName("");
      setGroupRegion("Hồ Chí Minh");
      setGroupDistrict("");
      setGroupWard("");
      setGroupDescription("");
      setGroupIcon("🏙️");
      setGroupColor("#4CAF50");
      setCreatingGroup(false);
      await loadCommunity();
      await loadUserGroups();
      Alert.alert("Thành công", "Đã tạo nhóm mới!");
    } else {
      Alert.alert("Lỗi", res?.error || "Không thể tạo nhóm.");
    }
  };

  // Join/leave group
  const handleJoinGroup = async (group) => {
    const res = await joinGroup(group.id);
    if (res?.success) {
      const action = res.action === "joined" ? "tham gia" : "rời khỏi";
      Alert.alert("Thành công", `Bạn đã ${action} nhóm "${group.name}"`);
      await loadCommunity();
      await loadUserGroups();
    } else {
      Alert.alert("Lỗi", res?.error || "Không thể thực hiện.");
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId) => {
    Alert.alert(
      "Xác nhận xóa nhóm",
      "Bạn có chắc chắn muốn xóa nhóm này? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const res = await deleteGroup(groupId);
            if (res?.success) {
              Alert.alert("Đã xóa", "Nhóm đã được xóa.");
              setShowGroupDetail(false);
              await loadCommunity();
              await loadUserGroups();
            } else {
              Alert.alert("Lỗi", res?.error || "Không thể xóa nhóm.");
            }
          },
        },
      ]
    );
  };

  // View group detail
  const handleViewGroup = (group) => {
    setSelectedGroup(group);
    setShowGroupDetail(true);
  };

  // ✅ FIX: Hàm lấy avatar hiện tại của user
  const getCurrentUserAvatar = () => {
    // Ưu tiên avatar từ userProfile (đã update qua Cloudinary)
    if (userProfile?.photoURL && userProfile.photoURL.includes("cloudinary.com")) {
      return userProfile.photoURL;
    }
    // Fallback về photoURL khác nếu có
    return userProfile?.photoURL || "";
  };

  const renderPosts = () => (
    <SafeAreaScrollView
      style={styles.content}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <TouchableOpacity
        style={styles.createPostButton}
        onPress={() => setShowCreatePost(true)}
      >
        <Ionicons name="add-circle" size={24} color="#2e7d32" />
        <Text style={styles.createPostText}>Chia sẻ mẹo sống xanh...</Text>
      </TouchableOpacity>

      {localPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>
            Chưa có bài viết nào — bạn hãy là người đầu tiên!
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowCreatePost(true)}
          >
            <Text style={styles.primaryButtonText}>Tạo bài viết</Text>
          </TouchableOpacity>
        </View>
      ) : (
        localPosts.map((post) => {
          const userId = userProfile?.uid || "guest";
          const liked = (post.likes || []).includes(userId);
          const isMyPost = post.author?.uid === userId;
          const showAllComments = expandedComments[post.id];
          const comments = post.comments || [];
          const displayComments = showAllComments ? comments : comments.slice(-2);

          // ✅ FIX: Nếu là bài viết của mình, dùng avatar hiện tại từ userProfile
          const avatarUrl = isMyPost ? getCurrentUserAvatar() : (post.author?.photoURL || "");

          return (
            <View key={post.id} style={styles.postCard}>
              {/* Header */}
              <View style={styles.postHeader}>
                <View style={styles.avatarContainer}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {post.author?.displayName?.[0]?.toUpperCase() || "👤"}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.postInfo}>
                  <Text style={styles.userName}>
                    {isMyPost ? (userProfile?.displayName || post.author?.displayName || "Bạn") : (post.author?.displayName || "Người dùng")}
                  </Text>
                  <Text style={styles.postTime}>
                    {post.timestamp
                      ? new Date(post.timestamp).toLocaleString("vi-VN")
                      : "Vừa xong"}
                  </Text>
                </View>

                {isMyPost && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePost(post.id)}
                  >
                    <Ionicons name="trash-outline" size={22} color="#e53935" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Content */}
              <Text style={styles.postContent}>{post.content}</Text>

              {/* Image */}
              {post.type === "image" && post.image && (
                <Image
                  source={{ uri: post.image }}
                  style={styles.postMediaImage}
                  resizeMode="cover"
                />
              )}

              {/* Video */}
              {post.type === "video" && post.video && (
                <Video
                  source={{ uri: post.video }}
                  style={styles.postMediaVideo}
                  useNativeControls
                  resizeMode="contain"
                  isLooping
                />
              )}

              {/* Stats */}
              <View style={styles.postStats}>
                <Text style={styles.statText}>
                  {(post.likes || []).length} lượt thích • {comments.length}{" "}
                  bình luận • {post.shares || 0} chia sẻ
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleToggleLike(post.id)}
                >
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={22}
                    color={liked ? "#FF6B6B" : "#666"}
                  />
                  <Text style={[styles.actionText, liked && styles.likedText]}>
                    Thích
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openCommentModal(post)}
                >
                  <Ionicons name="chatbubble-outline" size={22} color="#666" />
                  <Text style={styles.actionText}>Bình luận</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSharePost(post)}
                >
                  <Ionicons name="share-social-outline" size={22} color="#666" />
                  <Text style={styles.actionText}>Chia sẻ</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </SafeAreaScrollView>
  );

  const renderGroups = () => (
    <SafeAreaScrollView
      style={styles.content}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* My groups */}
      {userGroups.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Nhóm của tôi</Text>
          {userGroups.map((group) => {
            const isCreator = group.creator?.uid === (userProfile?.uid || "guest");
            return (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => handleViewGroup(group)}
              >
                <View
                  style={[
                    styles.groupIcon,
                    { backgroundColor: group.color || "#ddd" },
                  ]}
                >
                  <Text style={styles.groupEmoji}>{group.icon || "🏙️"}</Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupMembers}>
                    {group.members || 0} thành viên
                  </Text>
                  {isCreator && (
                    <Text style={styles.creatorBadge}>👑 Người tạo</Text>
                  )}
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* All groups */}
      <Text style={styles.sectionTitle}>Tất cả nhóm</Text>

      {communityGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có nhóm nào</Text>
        </View>
      ) : (
        communityGroups.map((group) => {
          const uid = userProfile?.uid || "guest";
          const joined = (group.memberUids || []).includes(uid);
          const isCreator = group.creator?.uid === uid;

          return (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() => handleViewGroup(group)}
            >
              <View
                style={[
                  styles.groupIcon,
                  { backgroundColor: group.color || "#ddd" },
                ]}
              >
                <Text style={styles.groupEmoji}>{group.icon || "🏙️"}</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupLocation}>
                  {[group.ward, group.district, group.region]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
                <Text style={styles.groupMembers}>
                  {group.members || 0} thành viên
                </Text>
                {isCreator && (
                  <Text style={styles.creatorBadge}>👑 Người tạo</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleJoinGroup(group)}>
                <Ionicons
                  name={joined ? "checkmark-circle" : "add-circle-outline"}
                  size={28}
                  color={joined ? "#4CAF50" : "#2e7d32"}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })
      )}

      <TouchableOpacity
        style={styles.createGroupButton}
        onPress={() => setCreatingGroup(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#2e7d32" />
        <Text style={styles.createGroupText}>Tạo nhóm mới</Text>
      </TouchableOpacity>
    </SafeAreaScrollView>
  );

  if (loading && localPosts.length === 0 && communityGroups.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Đang tải cộng đồng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* === HEADER ĐỒNG BỘ 100% === */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cộng đồng</Text>
        <View style={{ width: 40 }} />
      </View>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "posts" && styles.activeTab]}
          onPress={() => setActiveTab("posts")}
        >
          <Ionicons
            name="newspaper"
            size={22}
            color={activeTab === "posts" ? "#2e7d32" : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "posts" && styles.activeTabText,
            ]}
          >
            Bài viết
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "groups" && styles.activeTab]}
          onPress={() => setActiveTab("groups")}
        >
          <Ionicons
            name="people"
            size={22}
            color={activeTab === "groups" ? "#2e7d32" : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "groups" && styles.activeTabText,
            ]}
          >
            Nhóm
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "posts" ? renderPosts() : renderGroups()}

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreatePost(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo bài viết mới</Text>
              <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Chia sẻ mẹo sống xanh của bạn..."
              multiline
              numberOfLines={6}
              value={postContent}
              onChangeText={setPostContent}
            />

            {postImage && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: postImage }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => {
                    setPostImage(null);
                    setPostType("text");
                  }}
                >
                  <Ionicons name="close-circle" size={30} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {postVideo && (
              <View style={styles.previewContainer}>
                <Video
                  source={{ uri: postVideo }}
                  style={styles.previewVideo}
                  useNativeControls
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => {
                    setPostVideo(null);
                    setPostType("text");
                  }}
                >
                  <Ionicons name="close-circle" size={30} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
                <Ionicons name="image" size={28} color="#4CAF50" />
                <Text style={styles.iconButtonText}>Ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={pickVideo}>
                <Ionicons name="videocam" size={28} color="#2196F3" />
                <Text style={styles.iconButtonText}>Video</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitPost}
            >
              <Text style={styles.submitButtonText}>Đăng bài</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        visible={creatingGroup}
        animationType="slide"
        transparent
        onRequestClose={() => setCreatingGroup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCompact}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo nhóm mới</Text>
              <TouchableOpacity onPress={() => setCreatingGroup(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
              <TextInput
                style={styles.inputCompact}
                placeholder="Tên nhóm *"
                value={groupName}
                onChangeText={setGroupName}
              />

              <View style={styles.row}>
                <TextInput
                  style={[styles.inputCompact, styles.inputHalf]}
                  placeholder="Tỉnh/Thành phố"
                  value={groupRegion}
                  onChangeText={setGroupRegion}
                />
                <TextInput
                  style={[styles.inputCompact, styles.inputHalf]}
                  placeholder="Quận/Huyện"
                  value={groupDistrict}
                  onChangeText={setGroupDistrict}
                />
              </View>

              <TextInput
                style={styles.inputCompact}
                placeholder="Phường/Xã"
                value={groupWard}
                onChangeText={setGroupWard}
              />

              <TextInput
                style={[styles.inputCompact, { minHeight: 70 }]}
                placeholder="Mô tả nhóm"
                multiline
                numberOfLines={3}
                value={groupDescription}
                onChangeText={setGroupDescription}
              />

              <Text style={styles.labelCompact}>Biểu tượng:</Text>
              <View style={styles.iconSelectorCompact}>
                {["🏙️", "🌳", "♻️", "🌍", "🌱", "🚲", "☀️", "💧"].map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOptionCompact,
                      groupIcon === icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setGroupIcon(icon)}
                  >
                    <Text style={styles.iconOptionTextCompact}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.labelCompact}>Màu sắc:</Text>
              <View style={styles.colorSelectorCompact}>
                {["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336"].map(
                  (color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOptionCompact,
                        { backgroundColor: color },
                        groupColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setGroupColor(color)}
                    />
                  )
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateGroup}
            >
              <Text style={styles.submitButtonText}>Tạo nhóm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Group Detail Modal */}
      <Modal
        visible={showGroupDetail}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGroupDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết nhóm</Text>
              <TouchableOpacity onPress={() => setShowGroupDetail(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedGroup && (
              <>
                <View style={styles.groupDetailHeader}>
                  <View
                    style={[
                      styles.groupIcon,
                      { backgroundColor: selectedGroup.color || "#ddd" },
                    ]}
                  >
                    <Text style={styles.groupEmoji}>
                      {selectedGroup.icon || "🏙️"}
                    </Text>
                  </View>
                  <View style={styles.groupDetailInfo}>
                    <Text style={styles.groupDetailName}>
                      {selectedGroup.name}
                    </Text>
                    <Text style={styles.groupLocation}>
                      {[
                        selectedGroup.ward,
                        selectedGroup.district,
                        selectedGroup.region,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                    <Text style={styles.groupMembers}>
                      {selectedGroup.members || 0} thành viên
                    </Text>
                  </View>
                </View>

                {selectedGroup.description && (
                  <Text style={styles.groupDescription}>
                    {selectedGroup.description}
                  </Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: (selectedGroup.memberUids || []).includes(
                        userProfile?.uid || "guest"
                      )
                        ? "#e53935"
                        : "#2e7d32",
                    },
                  ]}
                  onPress={() => {
                    handleJoinGroup(selectedGroup);
                    setShowGroupDetail(false);
                  }}
                >
                  <Text style={styles.submitButtonText}>
                    {(selectedGroup.memberUids || []).includes(
                      userProfile?.uid || "guest"
                    )
                      ? "Rời nhóm"
                      : "Tham gia nhóm"}
                  </Text>
                </TouchableOpacity>

                {selectedGroup.creator?.uid === (userProfile?.uid || "guest") && (
                  <TouchableOpacity
                    style={[styles.submitButton, styles.deleteGroupButton]}
                    onPress={() => handleDeleteGroup(selectedGroup.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Xóa nhóm</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCommentModal(false);
          setCurrentComment("");
          setCommentImage(null);
          Keyboard.dismiss();
        }}
      >
        <View style={styles.commentModalOverlay}>
          <KeyboardAvoidingView
            style={styles.commentModalContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            {/* Header */}
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>
                {selectedPost?.comments?.length || 0} bình luận
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCommentModal(false);
                  setCurrentComment("");
                  setCommentImage(null);
                  Keyboard.dismiss();
                }}
                style={styles.closeModalBtn}
              >
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView
              style={styles.commentsList}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {selectedPost && (
                <>
                  {(selectedPost.comments || []).length === 0 ? (
                    <View style={styles.emptyComments}>
                      <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
                      <Text style={styles.emptyCommentsText}>
                        Chưa có bình luận nào.{"\n"}Hãy là người đầu tiên bình luận!
                      </Text>
                    </View>
                  ) : (
                    (selectedPost.comments || []).map((c, idx) => {
                      const userId = userProfile?.uid || "guest";
                      const isMyComment = c.uid === userId;
                      return (
                        <View key={c.id || idx} style={styles.commentRowModal}>
                          <View style={styles.commentAvatarContainer}>
                            {(() => {
                              const isMyComment = c.uid === (userProfile?.uid || "guest");
                              const avatarUrl = isMyComment
                                ? (userProfile?.photoURL || c.photoURL)
                                : c.photoURL;

                              return avatarUrl ? (
                                <Image
                                  source={{ uri: avatarUrl }}
                                  style={styles.commentAvatar}
                                />
                              ) : (
                                <View style={styles.commentAvatarPlaceholder}>
                                  <Text style={styles.commentAvatarText}>
                                    {c.name?.[0]?.toUpperCase() || "User"}
                                  </Text>
                                </View>
                              );
                            })()}
                          </View>

                          <View style={styles.commentBubbleContainer}>
                            <View style={styles.commentBubble}>
                              <Text style={styles.commentAuthor}>{c.name}</Text>
                              {c.text && <Text style={styles.commentText}>{c.text}</Text>}
                              {c.image && (
                                <Image
                                  source={{ uri: c.image }}
                                  style={styles.commentImagePreview}
                                  resizeMode="cover"
                                />
                              )}
                            </View>
                            <Text style={styles.commentTimeModal}>
                              {new Date(c.timestamp).toLocaleString("vi-VN")}
                            </Text>
                          </View>

                          {c.uid === (userProfile?.uid || "guest") && (
                            <TouchableOpacity
                              style={styles.deleteCommentBtn}
                              onPress={() => handleDeleteComment(selectedPost.id, c.id)}
                            >
                              <Ionicons name="trash-outline" size={18} color="#e53935" />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  )}
                </>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.commentInputContainer}>
              {commentImage && (
                <View style={styles.commentImagePreviewContainer}>
                  <Image
                    source={{ uri: commentImage }}
                    style={styles.commentImagePreviewThumb}
                  />
                  <TouchableOpacity
                    style={styles.removeCommentImage}
                    onPress={() => setCommentImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.commentInputWrapper}>
                <TouchableOpacity
                  style={styles.imagePickerBtn}
                  onPress={pickCommentImage}
                >
                  <Ionicons name="image" size={24} color="#666" />
                </TouchableOpacity>
                <TextInput
                  style={styles.commentInputModal}
                  placeholder="Thêm bình luận..."
                  value={currentComment}
                  onChangeText={setCurrentComment}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButtonModal,
                    (!currentComment.trim() && !commentImage) && styles.sendButtonDisabled,
                  ]}
                  onPress={() => {
                    if (selectedPost && (currentComment.trim() || commentImage)) {
                      handleAddComment(selectedPost.id);
                    }
                  }}
                  disabled={!currentComment.trim() && !commentImage}
                >
                  <Ionicons
                    name="send"
                    size={22}
                    color={(currentComment.trim() || commentImage) ? "#2e7d32" : "#ccc"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// Styles (giữ nguyên từ file gốc)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginLeft: 12,
  },
  tabs: { flexDirection: "row", backgroundColor: "#fff", elevation: 2 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 6 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#2e7d32" },
  tabText: { fontSize: 15, color: "#999", fontWeight: "500" },
  activeTabText: { color: "#2e7d32", fontWeight: "700" },
  content: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  loadingText: { marginTop: 12, fontSize: 15, color: "#666" },

  createPostButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 16, padding: 16, borderRadius: 12, elevation: 1, gap: 12 },
  createPostText: { fontSize: 16, color: "#666" },

  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, color: "#999", marginTop: 16, textAlign: "center", paddingHorizontal: 40 },

  postCard: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16, elevation: 2 },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatarContainer: { marginRight: 12 },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#2e7d32", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  postInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "600", color: "#333" },
  postTime: { fontSize: 13, color: "#999", marginTop: 2 },
  deleteButton: { padding: 4 },

  postContent: { fontSize: 15, color: "#333", lineHeight: 22, marginBottom: 12 },
  postMediaImage: { width: "100%", height: 250, borderRadius: 8, marginBottom: 12 },
  postMediaVideo: { width: "100%", height: 250, borderRadius: 8, marginBottom: 12 },

  postStats: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#eee" },
  statText: { fontSize: 13, color: "#666" },

  postActions: { flexDirection: "row", paddingTop: 8, borderTopWidth: 1, borderTopColor: "#eee" },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  actionText: { fontSize: 14, color: "#666", fontWeight: "500" },
  likedText: { color: "#FF6B6B" },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2e7d32", marginHorizontal: 16, marginTop: 16, marginBottom: 12 },

  groupCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 1 },
  groupIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginRight: 12 },
  groupEmoji: { fontSize: 28 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: "600", color: "#333" },
  groupLocation: { fontSize: 13, color: "#666", marginTop: 2 },
  groupMembers: { fontSize: 13, color: "#999", marginTop: 4 },
  creatorBadge: { fontSize: 12, color: "#2e7d32", marginTop: 4, fontWeight: "600" },

  createGroupButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, elevation: 1, gap: 8 },
  createGroupText: { fontSize: 16, color: "#2e7d32", fontWeight: "600" },

  primaryButton: { marginTop: 20, backgroundColor: "#2e7d32", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", width: "90%", maxHeight: "80%", borderRadius: 16, padding: 20 },
  modalContentCompact: { backgroundColor: "#fff", width: "90%", maxHeight: "75%", borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#333" },

  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, fontSize: 15, textAlignVertical: "top", minHeight: 120, marginBottom: 16 },
  inputCompact: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12 },

  previewContainer: { position: "relative", marginBottom: 16 },
  previewImage: { width: "100%", height: 200, borderRadius: 8 },
  previewVideo: { width: "100%", height: 200, borderRadius: 8 },
  removeMediaButton: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20 },

  modalActions: { flexDirection: "row", gap: 16, marginBottom: 16 },
  iconButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, backgroundColor: "#f5f5f5", borderRadius: 8, gap: 8 },
  iconButtonText: { fontSize: 15, fontWeight: "500", color: "#333" },

  submitButton: { backgroundColor: "#2e7d32", padding: 16, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  scrollArea: { maxHeight: 350 },
  row: { flexDirection: "row", gap: 12 },
  inputHalf: { flex: 1 },
  labelCompact: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 8 },

  iconSelectorCompact: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  iconOptionCompact: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: "#ddd", alignItems: "center", justifyContent: "center" },
  iconOptionSelected: { borderColor: "#2e7d32", borderWidth: 3 },
  iconOptionTextCompact: { fontSize: 24 },

  colorSelectorCompact: { flexDirection: "row", gap: 12, marginBottom: 16 },
  colorOptionCompact: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "#ddd" },
  colorOptionSelected: { borderColor: "#333", borderWidth: 3 },

  groupDetailHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  groupDetailInfo: { flex: 1, marginLeft: 12 },
  groupDetailName: { fontSize: 20, fontWeight: "700", color: "#333" },
  groupDescription: { fontSize: 15, color: "#666", lineHeight: 22, marginBottom: 20, paddingHorizontal: 8 },

  deleteGroupButton: { backgroundColor: "#e53935", marginTop: 12 },

  // Comment Modal Styles
  commentModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  commentModalContainer: { flex: 1, marginTop: "20%", backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  commentModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
  commentModalTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  closeModalBtn: { padding: 4 },

  commentsList: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  emptyComments: { alignItems: "center", paddingVertical: 60 },
  emptyCommentsText: { fontSize: 15, color: "#999", marginTop: 16, textAlign: "center" },

  commentRowModal: { flexDirection: "row", marginBottom: 20, alignItems: "flex-start" },
  commentAvatarContainer: { marginRight: 12 },
  commentAvatar: { width: 40, height: 40, borderRadius: 20 },
  commentAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#2e7d32", alignItems: "center", justifyContent: "center" },
  commentAvatarText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  commentBubbleContainer: { flex: 1 },
  commentBubble: { backgroundColor: "#f0f0f0", borderRadius: 12, padding: 12 },
  commentAuthor: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 4 },
  commentText: { fontSize: 14, color: "#333", lineHeight: 20 },
  commentImagePreview: { width: "100%", height: 150, borderRadius: 8, marginTop: 8 },
  commentTimeModal: { fontSize: 12, color: "#999", marginTop: 4, marginLeft: 4 },

  deleteCommentBtn: { padding: 4, marginLeft: 8 },

  commentInputContainer: { borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff", paddingBottom: Platform.OS === "ios" ? 34 : 16 },
  commentImagePreviewContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12 },
  commentImagePreviewThumb: { width: 60, height: 60, borderRadius: 8 },
  removeCommentImage: { position: "absolute", top: 8, right: 12, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12 },

  commentInputWrapper: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  imagePickerBtn: { padding: 8 },
  commentInputModal: { flex: 1, backgroundColor: "#f5f5f5", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendButtonModal: { padding: 8 },
  sendButtonDisabled: { opacity: 0.4 },
});
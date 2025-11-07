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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../context/UserContext";
import * as ImagePicker from "expo-image-picker";

export default function CommunityScreen() {
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
    addGroupPost,
    deleteCommunityPost,
    deleteGroup,
    searchGroupsByRegion,
    userProfile,
    loading,
  } = useContext(UserContext);

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

  const [searchRegion, setSearchRegion] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [filteredGroups, setFilteredGroups] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);

  useEffect(() => {
    loadCommunity && loadCommunity();
    loadUserGroups && loadUserGroups();
  }, []);

  useEffect(() => {
    setFilteredGroups(communityGroups);
  }, [communityGroups]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunity();
    await loadUserGroups();
    setRefreshing(false);
  };

  // FR-8.1.1: Pick image
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
        setPostType("image");
      }
    } catch (error) {
      console.error("❌ Lỗi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  // FR-8.1.1: Pick video
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setPostVideo(result.assets[0].uri);
        setPostType("video");
      }
    } catch (error) {
      console.error("❌ Lỗi chọn video:", error);
      Alert.alert("Lỗi", "Không thể chọn video");
    }
  };

  // FR-8.1.1: Submit post with image/video
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

  // FR-8.1.2: Toggle like
  const handleToggleLike = async (postId) => {
    const res = await toggleLikeOnPost(postId);
    if (res?.success) {
      await loadCommunity();
    }
  };

  // FR-8.1.2: Add comment
  const handleAddComment = async (postId) => {
    const text = (commentText[postId] || "").trim();
    if (!text) return;

    const res = await addCommentToPost(postId, text);
    if (res?.success) {
      setCommentText((s) => ({ ...s, [postId]: "" }));
      await loadCommunity();
    } else {
      Alert.alert("Lỗi", res?.error || "Không thể thêm bình luận.");
    }
  };

  // FR-8.1.2: Delete comment
  const handleDeleteComment = async (postId, commentId) => {
    Alert.alert("Xác nhận", "Xóa bình luận này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const res = await deleteComment(postId, commentId);
          if (res?.success) {
            await loadCommunity();
          }
        },
      },
    ]);
  };

  // FR-8.1.2: Share post
  const handleSharePost = async (postId) => {
    Alert.alert(
      "Chia sẻ",
      "Chọn cách chia sẻ:",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Chia sẻ",
          onPress: async () => {
            const res = await sharePost(postId);
            if (res?.success) {
              Alert.alert("Thành công", "Đã chia sẻ bài viết!");
              await loadCommunity();
            }
          },
        },
      ]
    );
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

  // FR-8.1.3: Create group
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

  // FR-8.1.3: Join/leave group
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

// HÀM MỚI: XÓA NHÓM
  const handleDeleteGroup = async (groupId) => {
    const res = await deleteGroup(groupId);
    if (res?.success) {
      Alert.alert("Thành công", "Nhóm đã được xóa.");
    } else {
      Alert.alert("Lỗi", res?.error || "Không thể xóa nhóm.");
    }
  };

  // Search groups by region
  const handleSearchGroups = async () => {
    if (!searchRegion) {
      setFilteredGroups(communityGroups);
      return;
    }

    const res = await searchGroupsByRegion(searchRegion, searchDistrict);
    if (res?.success) {
      setFilteredGroups(res.groups);
    } else {
      Alert.alert("Lỗi", "Không thể tìm kiếm nhóm");
    }
  };

  // View group detail
  const handleViewGroup = (group) => {
    setSelectedGroup(group);
    setShowGroupDetail(true);
  };

  const renderPosts = () => (
    <ScrollView
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

      {communityPosts.length === 0 ? (
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
        communityPosts.map((post) => {
          const userId = userProfile?.uid || "guest";
          const liked = (post.likes || []).includes(userId);
          const isMyPost = post.author?.uid === userId;
          const showAllComments = expandedComments[post.id];
          const comments = post.comments || [];
          const displayComments = showAllComments ? comments : comments.slice(-2);

          return (
            <View key={post.id} style={styles.postCard}>
              {/* Header */}
              <View style={styles.postHeader}>
                <View style={styles.avatarContainer}>
                  {post.author?.photoURL ? (
                    <Image
                      source={{ uri: post.author.photoURL }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatar}>
                      {post.author?.displayName?.[0]?.toUpperCase() || "👤"}
                    </Text>
                  )}
                </View>
                <View style={styles.postInfo}>
                  <Text style={styles.userName}>
                    {post.author?.displayName || "Người dùng"}
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

              {/* FR-8.1.1: Image */}
              {post.type === "image" && post.image && (
                <Image source={{ uri: post.image }} style={styles.postMediaImage} />
              )}

              {/* FR-8.1.1: Video placeholder */}
              {post.type === "video" && post.video && (
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="play-circle" size={60} color="#fff" />
                  <Text style={styles.videoText}>Video</Text>
                </View>
              )}

              {/* Stats */}
              <View style={styles.postStats}>
                <Text style={styles.statText}>
                  {(post.likes || []).length} lượt thích • {comments.length}{" "}
                  bình luận • {post.shares || 0} chia sẻ
                </Text>
              </View>

              {/* Actions - FR-8.1.2 */}
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
                  onPress={() =>
                    setExpandedComments((s) => ({ ...s, [post.id]: !s[post.id] }))
                  }
                >
                  <Ionicons name="chatbubble-outline" size={22} color="#666" />
                  <Text style={styles.actionText}>Bình luận</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSharePost(post.id)}
                >
                  <Ionicons name="share-social-outline" size={22} color="#666" />
                  <Text style={styles.actionText}>Chia sẻ</Text>
                </TouchableOpacity>
              </View>

              {/* Comments */}
              <View style={styles.commentsSection}>
                {displayComments.map((c, idx) => {
                  const isMyComment = c.uid === userId;
                  return (
                    <View key={c.id || idx} style={styles.commentRow}>
                      <View style={styles.commentContent}>
                        <Text style={styles.commentAuthor}>{c.name}</Text>
                        <Text style={styles.commentText}>{c.text}</Text>
                        <Text style={styles.commentTime}>
                          {new Date(c.timestamp).toLocaleString("vi-VN")}
                        </Text>
                      </View>
                      {isMyComment && (
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(post.id, c.id)}
                        >
                          <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                {comments.length > 2 && !showAllComments && (
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedComments((s) => ({ ...s, [post.id]: true }))
                    }
                  >
                    <Text style={styles.viewMoreComments}>
                      Xem thêm {comments.length - 2} bình luận...
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.addCommentRow}>
                  <TextInput
                    value={commentText[post.id] || ""}
                    onChangeText={(t) =>
                      setCommentText((s) => ({ ...s, [post.id]: t }))
                    }
                    placeholder="Viết bình luận..."
                    style={styles.commentInput}
                  />
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={() => handleAddComment(post.id)}
                  >
                    <Ionicons name="send" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  const renderGroups = () => (
    <ScrollView
      style={styles.content}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tỉnh/thành phố..."
          value={searchRegion}
          onChangeText={setSearchRegion}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Quận/Huyện (tùy chọn)"
          value={searchDistrict}
          onChangeText={setSearchDistrict}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchGroups}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.searchButtonText}>Tìm kiếm</Text>
        </TouchableOpacity>
      </View>

      {userGroups.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Nhóm của tôi</Text>
          {userGroups.map((group) => (
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
                <Text style={styles.groupEmoji}>{group.icon || "City"}</Text>
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
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </TouchableOpacity>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Tất cả nhóm</Text>

      {filteredGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có nhóm nào</Text>
        </View>
      ) : (
        filteredGroups.map((group) => {
          const uid = userProfile?.uid || "guest";
          const joined = (group.memberUids || []).includes(uid);
          const isCreator = group.creator?.uid === uid; // KIỂM TRA NGƯỜI TẠO

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
                <Text style={styles.groupEmoji}>{group.icon || "City"}</Text>
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
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {/* NÚT XÓA – CHỈ HIỆN VỚI NGƯỜI TẠO */}
                {isCreator && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        "Xóa nhóm",
                        `Bạn có chắc chắn muốn xóa nhóm "${group.name}"?`,
                        [
                          { text: "Hủy", style: "cancel" },
                          {
                            text: "Xóa",
                            style: "destructive",
                            onPress: () => handleDeleteGroup(group.id),
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={22} color="#e53935" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => handleJoinGroup(group)}>
                  <Ionicons
                    name={joined ? "checkmark-circle" : "add-circle-outline"}
                    size={28}
                    color={joined ? "#4CAF50" : "#2e7d32"}
                  />
                </TouchableOpacity>
              </View>
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
    </ScrollView>
  );

  if (loading && communityPosts.length === 0 && communityGroups.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Đang tải cộng đồng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              <Image source={{ uri: postImage }} style={styles.previewImage} />
            )}

            {postVideo && (
              <View style={styles.videoPreview}>
                <Ionicons name="videocam" size={40} color="#fff" />
                <Text style={styles.videoPreviewText}>Video đã chọn</Text>
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
          <ScrollView style={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tạo nhóm mới</Text>
                <TouchableOpacity onPress={() => setCreatingGroup(false)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Tên nhóm *"
                value={groupName}
                onChangeText={setGroupName}
              />

              <TextInput
                style={styles.input}
                placeholder="Tỉnh/Thành phố *"
                value={groupRegion}
                onChangeText={setGroupRegion}
              />

              <TextInput
                style={styles.input}
                placeholder="Quận/Huyện"
                value={groupDistrict}
                onChangeText={setGroupDistrict}
              />

              <TextInput
                style={styles.input}
                placeholder="Phường/Xã"
                value={groupWard}
                onChangeText={setGroupWard}
              />

              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                placeholder="Mô tả nhóm"
                multiline
                value={groupDescription}
                onChangeText={setGroupDescription}
              />

              <Text style={styles.label}>Chọn biểu tượng:</Text>
              <View style={styles.iconSelector}>
                {["🏙️", "🌳", "♻️", "🌍", "🌱", "🚲", "☀️", "💧"].map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      groupIcon === icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setGroupIcon(icon)}
                  >
                    <Text style={styles.iconOptionText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Chọn màu:</Text>
              <View style={styles.colorSelector}>
                {["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336"].map(
                  (color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        groupColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setGroupColor(color)}
                    />
                  )
                )}
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateGroup}
              >
                <Text style={styles.submitButtonText}>Tạo nhóm</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
  },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#2e7d32" },
  tabText: { fontSize: 16, color: "#999", marginLeft: 8, fontWeight: "500" },
  activeTabText: { color: "#2e7d32", fontWeight: "bold" },
  content: { flex: 1 },
  
  // Create post button
  createPostButton: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createPostText: { fontSize: 16, color: "#999", marginLeft: 10 },
  
  // Post card
  postCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12,
    position: "relative",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatar: { 
    fontSize: 24, 
    fontWeight: "bold",
    color: "#666",
  },
  postInfo: { flex: 1 },
  deleteButton: { 
    position: "absolute", 
    right: 0, 
    top: 0, 
    padding: 8,
    borderRadius: 20,
  },
  userName: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333",
    marginBottom: 2,
  },
  postTime: { fontSize: 12, color: "#999" },
  postContent: { 
    fontSize: 15, 
    color: "#333", 
    lineHeight: 22, 
    marginBottom: 12,
  },
  
  // Media
  postMediaImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginBottom: 12,
    resizeMode: "cover",
  },
  videoPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  videoText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "600",
  },
  
  // Stats & Actions
  postStats: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 10,
  },
  statText: { fontSize: 13, color: "#666" },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
  },
  actionButton: { 
    flexDirection: "row", 
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
  },
  actionText: { fontSize: 14, color: "#666", marginLeft: 6, fontWeight: "500" },
  likedText: { color: "#FF6B6B", fontWeight: "600" },
  
  // Comments
  commentsSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  commentRow: { 
    flexDirection: "row", 
    paddingVertical: 8,
    alignItems: "flex-start",
  },
  commentContent: { flex: 1 },
  commentAuthor: { 
    fontWeight: "600", 
    marginBottom: 4, 
    color: "#333",
    fontSize: 14,
  },
  commentText: { 
    color: "#555", 
    lineHeight: 20,
    fontSize: 14,
  },
  commentTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  viewMoreComments: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 8,
  },
  addCommentRow: { 
    flexDirection: "row", 
    marginTop: 12, 
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 14,
  },
  sendButton: { 
    backgroundColor: "#2e7d32", 
    padding: 10, 
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Groups
  searchContainer: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#333", 
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  groupCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  groupEmoji: { fontSize: 28 },
  groupInfo: { flex: 1 },
  groupName: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333",
    marginBottom: 4,
  },
  groupLocation: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  groupMembers: { fontSize: 13, color: "#999" },
  createGroupButton: {
    backgroundColor: "#e8f5e9",
    margin: 15,
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2e7d32",
    marginLeft: 10,
  },
  
  // Group detail
  groupDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  groupDetailInfo: {
    flex: 1,
    marginLeft: 15,
  },
  groupDetailName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalScrollContent: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#333",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 15,
    minHeight: 120,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    resizeMode: "cover",
  },
  videoPreview: {
    width: "100%",
    height: 150,
    backgroundColor: "#000",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  videoPreviewText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 8,
  },
  modalActions: { 
    flexDirection: "row", 
    marginBottom: 20,
    justifyContent: "space-around",
  },
  iconButton: { 
    alignItems: "center",
    padding: 10,
  },
  iconButtonText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#2e7d32",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
  },
  submitButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold",
  },
  
  // Selectors
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    marginTop: 5,
  },
  iconSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconOptionSelected: {
    borderColor: "#2e7d32",
    backgroundColor: "#e8f5e9",
  },
  iconOptionText: {
    fontSize: 24,
  },
  colorSelector: {
    flexDirection: "row",
    marginBottom: 20,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 5,
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#333",
  },
  
  // Empty states
  emptyContainer: { 
    padding: 40, 
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { 
    color: "#666", 
    marginTop: 15,
    marginBottom: 20,
    fontSize: 16,
    textAlign: "center",
  },
  primaryButton: { 
    backgroundColor: "#2e7d32", 
    paddingHorizontal: 24,
    paddingVertical: 12, 
    borderRadius: 8,
    elevation: 2,
  },
  primaryButtonText: { 
    color: "#fff", 
    fontWeight: "600",
    fontSize: 16,
  },
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
});
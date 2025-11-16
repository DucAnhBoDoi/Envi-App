// src/screens/ProfileScreen.js - MERGED VERSION WITH ALL FEATURES
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Switch,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import { PermissionsContext } from "../context/PermissionsContext";
import SafeAreaScrollView from "../components/SafeAreaScrollView";

export default function ProfileScreen({ navigation }) {
  const { user, guestMode, logout, deleteAccount } = useContext(AuthContext);
  const {
    userProfile,
    reportHistory,
    chatHistory,
    clearReportHistory,
    clearChatHistory,
    deleteAllUserData,
    loading,
  } = useContext(UserContext);

  const {
    permissions,
    toggleLocationPermission,
    toggleNotificationPermission,
    toggleDataSharing,
    checkSystemPermissions,
  } = useContext(PermissionsContext);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Refresh permissions khi vào màn hình
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkSystemPermissions();
    });
    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      guestMode
        ? "Bạn đang dùng tài khoản khách!\n\nTẤT CẢ dữ liệu (báo cáo, chat, cài đặt...) sẽ bị XÓA HOÀN TOÀN và không thể khôi phục!\n\nBạn có chắc chắn?"
        : "Bạn có chắc chắn muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleClearHistory = (type) => {
    Alert.alert(
      "Xác nhận xóa",
      type === "report"
        ? "Bạn có chắc muốn xóa lịch sử báo cáo?"
        : "Bạn có chắc muốn xóa lịch sử chat?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const result =
              type === "report"
                ? await clearReportHistory()
                : await clearChatHistory();
            if (result.success) {
              Alert.alert("🍃 Thành công", "Đã xóa lịch sử!");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      if (!guestMode && user?.uid) {
        const firestoreResult = await deleteAllUserData(user.uid);
        if (!firestoreResult.success) {
          Alert.alert("Lỗi", "Không thể xóa dữ liệu trên server");
          setDeleting(false);
          return;
        }
      }

      const authResult = await deleteAccount(
        !guestMode && user?.providerData?.[0]?.providerId === "password"
          ? deletePassword
          : null
      );

      if (authResult.success) {
        setShowDeleteModal(false);
        Alert.alert(
          "Tài khoản đã xóa",
          "Tất cả dữ liệu của bạn đã được xóa vĩnh viễn.",
          [{ text: "OK" }]
        );
      } else {
        if (authResult.requirePassword) {
          Alert.alert("Yêu cầu xác thực", "Vui lòng nhập mật khẩu để xác nhận");
        } else if (authResult.requireReauth) {
          Alert.alert(
            "Cần đăng nhập lại",
            "Vui lòng đăng xuất và đăng nhập lại, sau đó thử xóa tài khoản",
            [
              { text: "Hủy", style: "cancel" },
              { text: "Đăng xuất", onPress: logout },
            ]
          );
        } else {
          Alert.alert("Lỗi", authResult.error || "Không thể xóa tài khoản");
        }
      }
    } catch (error) {
      console.error("Lỗi xóa tài khoản:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi không mong muốn");
    } finally {
      setDeleting(false);
      setDeletePassword("");
    }
  };

  const openDeleteModal = () => {
    Alert.alert(
      "⚠️ CẢNH BÁO NGHIÊM TRỌNG",
      guestMode
        ? "Tất cả dữ liệu khách sẽ bị XÓA VĨNH VIỄN!\n\n• Lịch sử báo cáo\n• Lịch sử chat\n• Cài đặt cá nhân\n\nKHÔNG THỂ KHÔI PHỤC!\n\nBạn có chắc chắn?"
        : "Hành động này sẽ:\n\n• Xóa vĩnh viễn tài khoản Firebase\n• Xóa TẤT CẢ bài viết, comment, nhóm\n• Xóa lịch sử báo cáo và chat\n• KHÔNG THỂ KHÔI PHỤC\n\nBạn có chắc chắn?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Tiếp tục",
          style: "destructive",
          onPress: () => setShowDeleteModal(true),
        },
      ]
    );
  };

  const handleToggleLocation = async () => {
    if (!permissions.location) {
      Alert.alert(
        "📍 Bật quyền vị trí",
        "Ứng dụng cần quyền vị trí để:\n\n🍃 Hiển thị AQI khu vực của bạn\n\n🏡 Xác định vị trí khi báo cáo vi phạm",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Cấp quyền",
            onPress: async () => {
              const result = await toggleLocationPermission();
              if (result.success) {
                Alert.alert("🍃 Thành công", "Đã bật quyền vị trí");
                await checkSystemPermissions();
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Tắt quyền vị trí?",
        "Để tắt quyền vị trí, vui lòng thực hiện trong Cài đặt hệ thống.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Mở Cài đặt",
            onPress: async () => {
              await toggleLocationPermission();
            },
          },
        ]
      );
    }
  };

  const handleToggleNotification = async () => {
    if (!permissions.notifications) {
      Alert.alert(
        "🔔 Bật thông báo",
        "Ứng dụng cần quyền thông báo để:\n\n⚠️ Cảnh báo khi AQI vượt ngưỡng\n\n📢 Thông báo cập nhật báo cáo của bạn",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Cấp quyền",
            onPress: async () => {
              const result = await toggleNotificationPermission();
              if (result.success) {
                Alert.alert("🍃 Thành công", "Đã bật thông báo");
                await checkSystemPermissions();
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "🔔 Tắt thông báo?",
        "Để tắt thông báo, vui lòng thực hiện trong Cài đặt hệ thống.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Mở Cài đặt",
            onPress: async () => {
              await toggleNotificationPermission();
            },
          },
        ]
      );
    }
  };

  const handleToggleDataSharing = async () => {
    const result = await toggleDataSharing();
    if (result.success) {
      Alert.alert(
        result.enabled ? "Chia sẻ dữ liệu đã bật" : "Chia sẻ dữ liệu đã tắt",
        result.enabled
          ? "🌍 App có thể sử dụng dữ liệu của bạn để cải thiện trải nghiệm"
          : "👤 Dữ liệu cá nhân sẽ không được chia sẻ"
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  const userChatCount = chatHistory.filter((item) => item.sender === "user").length;

  return (
    <SafeAreaScrollView style={styles.container}>
      {/* Header với avatar */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {userProfile.photoURL ? (
            <Image source={{ uri: userProfile.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={50} color="#fff" />
            </View>
          )}

          {guestMode ? (
            <View style={[styles.badge, styles.guestBadge]}>
              <Ionicons name="person-circle-outline" size={14} color="#fff" />
              <Text style={styles.badgeText}>Khách</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.userBadge]}>
              <Ionicons name="checkmark-circle" size={14} color="#fff" />
              <Text style={styles.badgeText}>Đã xác thực</Text>
            </View>
          )}
        </View>

        <Text style={styles.userName}>
          {userProfile.displayName || user?.displayName || "Người dùng"}
        </Text>

        {!guestMode && (
          <Text style={styles.userEmail}>{userProfile.email || user?.email}</Text>
        )}

        {userProfile.bio && <Text style={styles.userBio}>{userProfile.bio}</Text>}

        {!guestMode && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Ionicons name="create-outline" size={18} color="#2e7d32" />
            <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        )}

        {guestMode && (
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={20} color="#ff6b6b" />
            <Text style={styles.warningText}>
              Dữ liệu chỉ lưu trên thiết bị này. Đăng ký tài khoản để đồng bộ dữ liệu!
            </Text>
          </View>
        )}
      </View>

      {/* Thông tin chi tiết */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        <InfoRow
          icon="location-outline"
          label="Khu vực mặc định"
          value={userProfile.defaultRegion}
        />
        {userProfile.phone && (
          <InfoRow icon="call-outline" label="Số điện thoại" value={userProfile.phone} />
        )}
        {userProfile.address && (
          <InfoRow icon="home-outline" label="Địa chỉ" value={userProfile.address} />
        )}
      </View>

      {/* ✅ THỐNG KÊ HOẠT ĐỘNG - GIỮ NGUYÊN GAMIFICATION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hoạt động & Thành tích</Text>
        <View style={styles.statsContainer}>
          <StatCard
            icon="trophy"
            count={userProfile.points || 0}
            label="Điểm"
            color="#FF9800"
          />
          <StatCard
            icon="document-text-outline"
            count={reportHistory.length}
            label="Báo cáo"
            color="#2e7d32"
          />
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            icon="people"
            count={userProfile.campaignsJoined || 0}
            label="Chiến dịch"
            color="#1976d2"
          />
          <StatCard
            icon="leaf"
            count={userProfile.wasteClassified || 0}
            label="Phân loại rác"
            color="#43A047"
          />
        </View>
      </View>

      {/* ✅ QUYỀN RIÊNG TƯ & BẢO MẬT */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={24} color="#2e7d32" />
          <Text style={styles.sectionTitle}>Quyền riêng tư & Bảo mật</Text>
        </View>

        <View style={styles.encryptionBanner}>
          <Ionicons name="lock-closed" size={20} color="#2e7d32" />
          <Text style={styles.encryptionText}>
            Dữ liệu của bạn được mã hóa an toàn bằng Firebase
          </Text>
        </View>

        <View style={styles.permissionCard}>
          {/* Quyền vị trí */}
          <View style={styles.permissionRow}>
            <View style={styles.permissionInfo}>
              <Ionicons name="location" size={22} color="#E53935" />
              <View style={styles.permissionText}>
                <Text style={styles.permissionTitle}>Vị trí</Text>
                <Text style={styles.permissionDesc}>
                  {permissions.location
                    ? "Đã bật - Nhấn để vào Cài đặt và tắt"
                    : "Chưa bật - Nhấn để cấp quyền"}
                </Text>
              </View>
            </View>
            <Switch
              value={permissions.location}
              onValueChange={handleToggleLocation}
              trackColor={{ false: "#ccc", true: "#81c784" }}
              thumbColor={permissions.location ? "#2e7d32" : "#f4f3f4"}
            />
          </View>

          {/* Quyền thông báo */}
          <View style={styles.permissionRow}>
            <View style={styles.permissionInfo}>
              <Ionicons name="notifications" size={22} color="#FF9800" />
              <View style={styles.permissionText}>
                <Text style={styles.permissionTitle}>Thông báo</Text>
                <Text style={styles.permissionDesc}>
                  {permissions.notifications
                    ? "Đã bật - Nhấn để vào Cài đặt và tắt"
                    : "Chưa bật - Nhấn để cấp quyền"}
                </Text>
              </View>
            </View>
            <Switch
              value={permissions.notifications}
              onValueChange={handleToggleNotification}
              trackColor={{ false: "#ccc", true: "#ffcc80" }}
              thumbColor={permissions.notifications ? "#FF9800" : "#f4f3f4"}
            />
          </View>

          {/* Chia sẻ dữ liệu */}
          <View style={styles.permissionRow}>
            <View style={styles.permissionInfo}>
              <Ionicons name="share-social" size={22} color="#1976D2" />
              <View style={styles.permissionText}>
                <Text style={styles.permissionTitle}>Chia sẻ dữ liệu</Text>
                <Text style={styles.permissionDesc}>
                  Cho phép sử dụng dữ liệu để cải thiện dịch vụ
                </Text>
              </View>
            </View>
            <Switch
              value={permissions.dataSharing}
              onValueChange={handleToggleDataSharing}
              trackColor={{ false: "#ccc", true: "#64b5f6" }}
              thumbColor={permissions.dataSharing ? "#1976D2" : "#f4f3f4"}
            />
          </View>
        </View>
      </View>

      {/* Lịch sử */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch sử</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate("ReportHistory")}
        >
          <Ionicons name="document-text-outline" size={24} color="#2e7d32" />
          <Text style={styles.historyButtonText}>
            Lịch sử báo cáo ({reportHistory.length})
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate("ChatHistory")}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#1976d2" />
          <Text style={styles.historyButtonText}>
            Lịch sử chat ({userChatCount})
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Cài đặt */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt</Text>
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => handleClearHistory("report")}
        >
          <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
          <Text style={[styles.settingButtonText, { color: "#ff6b6b" }]}>
            Xóa lịch sử báo cáo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => handleClearHistory("chat")}
        >
          <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
          <Text style={[styles.settingButtonText, { color: "#ff6b6b" }]}>
            Xóa lịch sử chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingButton, styles.deleteAccountButton]}
          onPress={openDeleteModal}
        >
          <Ionicons name="close-circle" size={24} color="#d32f2f" />
          <Text style={[styles.settingButtonText, { color: "#d32f2f", fontWeight: "bold" }]}>
            Xóa tài khoản vĩnh viễn
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#fff" />
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />

      {/* MODAL XÓA TÀI KHOẢN */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={60} color="#d32f2f" />
            <Text style={styles.modalTitle}>Xóa tài khoản?</Text>
            <Text style={styles.modalDesc}>
              Hành động này KHÔNG THỂ KHÔI PHỤC. Tất cả dữ liệu sẽ bị xóa vĩnh viễn.
            </Text>

            {!guestMode && user?.providerData?.[0]?.providerId === "password" && (
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu để xác nhận"
                placeholderTextColor="#999"
                secureTextEntry
                value={deletePassword}
                onChangeText={setDeletePassword}
                autoFocus
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                }}
                disabled={deleting}
              >
                <Text style={styles.modalButtonTextCancel}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextDelete}>Xóa vĩnh viễn</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaScrollView>
  );
}

// Component InfoRow
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color="#666" />
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// Component StatCard
const StatCard = ({ icon, count, label, color }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={32} color={color} />
    <Text style={[styles.statCount, { color }]}>{count}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#2e7d32" },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
  },
  avatarContainer: { position: "relative", marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  guestBadge: { backgroundColor: "#999" },
  userBadge: { backgroundColor: "#2e7d32" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  userName: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 5 },
  userEmail: { fontSize: 14, color: "#666", marginBottom: 10 },
  userBio: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 5 },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2e7d32",
  },
  editButtonText: { color: "#2e7d32", fontSize: 14, fontWeight: "600" },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#ff6b6b",
  },
  warningText: { flex: 1, fontSize: 12, color: "#856404" },
  section: {
    backgroundColor: "#fff",
    marginTop: 15,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  encryptionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#2e7d32",
  },
  encryptionText: { flex: 1, fontSize: 13, color: "#2e7d32", fontWeight: "600" },
  permissionCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 15,
    gap: 15,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  permissionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  permissionText: { flex: 1 },
  permissionTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  permissionDesc: { fontSize: 12, color: "#666" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#999", marginBottom: 4 },
  infoValue: { fontSize: 16, color: "#333", fontWeight: "500" },
  statsContainer: { flexDirection: "row", justifyContent: "space-around", gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statCount: { fontSize: 28, fontWeight: "bold", marginTop: 8 },
  statLabel: { fontSize: 14, color: "#666", marginTop: 4 },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyButtonText: { flex: 1, fontSize: 16, color: "#333", fontWeight: "500" },
  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  deleteAccountButton: {
    backgroundColor: "#ffebee",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    borderBottomWidth: 0,
  },
  settingButtonText: { flex: 1, fontSize: 16, fontWeight: "500" },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#d32f2f",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  logoutButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#333", marginTop: 16 },
  modalDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  passwordInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: { backgroundColor: "#f5f5f5" },
  modalButtonDelete: { backgroundColor: "#d32f2f" },
  modalButtonTextCancel: { color: "#333", fontSize: 16, fontWeight: "600" },
  modalButtonTextDelete: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
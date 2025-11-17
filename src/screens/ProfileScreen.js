// src/screens/ProfileScreen.js
import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import SafeAreaScrollView from "../components/SafeAreaScrollView";
import { CommonActions } from '@react-navigation/native';

export default function ProfileScreen({ navigation }) {
  const { user, guestMode, logout } = useContext(AuthContext);
  const {
    userProfile,
    reportHistory,
    chatHistory,
    clearReportHistory,
    clearChatHistory,
    loading,
  } = useContext(UserContext);

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
            // XONG! Không cần làm gì thêm
            // App tự về màn đăng nhập
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
              Alert.alert("Thành công", "Đã xóa lịch sử!");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    );
  }

  // 🔹 Chỉ đếm câu hỏi của user
  const userChatCount = chatHistory.filter(item => item.sender === "user").length;

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

        {userProfile.bio && (
          <Text style={styles.userBio}>{userProfile.bio}</Text>
        )}

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

        <InfoRow icon="location-outline" label="Khu vực mặc định" value={userProfile.defaultRegion} />

        {userProfile.phone && (
          <InfoRow icon="call-outline" label="Số điện thoại" value={userProfile.phone} />
        )}

        {userProfile.address && (
          <InfoRow icon="home-outline" label="Địa chỉ" value={userProfile.address} />
        )}
      </View>

      {/* Thống kê hoạt động */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hoạt động</Text>

        <View style={styles.statsContainer}>
          <StatCard
            icon="document-text-outline"
            count={reportHistory.length}
            label="Báo cáo"
            color="#2e7d32"
          />
          <StatCard
            icon="chatbubbles-outline"
            count={userChatCount} // ✅ chỉ đếm câu hỏi của user
            label="Câu hỏi"
            color="#1976d2"
          />
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
          <Text style={styles.historyButtonText}>Lịch sử báo cáo ({reportHistory.length})</Text>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate("ChatHistory")}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#1976d2" />
          <Text style={styles.historyButtonText}>
            Lịch sử chat ({userChatCount}) {/* ✅ chỉ đếm câu hỏi của user */}
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
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#fff" />
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
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

// Component StatCard (giữ nguyên như code của bạn)
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50, // ✅ Thêm dòng này
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
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 15 },

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

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 10,
  },
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
});
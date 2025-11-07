import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";

// Cấu hình thông báo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationsScreen({ navigation }) {
  const { user, guestMode } = useContext(AuthContext);
  const { userProfile } = useContext(UserContext);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    campaigns: true,
    recycling: true,
    weather: true,
    community: false,
  });
  const [notifications, setNotifications] = useState([]);
  const [nextRecycleDay, setNextRecycleDay] = useState("");

  // === DANH SÁCH CHIẾN DỊCH ===
  const campaigns = [
    {
      id: "1",
      title: "Chiến dịch Làm sạch bãi biển",
      date: "05/11/2025",
      location: "Bãi biển Vũng Tàu",
      icon: "water-outline",
      color: "#03A9F4",
    },
    {
      id: "2",
      title: "Trồng cây xanh cùng thanh niên",
      date: "12/11/2025",
      location: "Công viên Tao Đàn, Q1",
      icon: "leaf-outline",
      color: "#4CAF50",
    },
    {
      id: "3",
      title: "Thu gom rác điện tử",
      date: "20/11/2025",
      location: "Siêu thị Metro An Phú",
      icon: "hardware-chip-outline",
      color: "#9C27B0",
    },
  ];

  // === LỊCH THÔNG BÁO ĐÃ LÊN LỊCH ===
    const SCHEDULED_NOTIFICATIONS = [
      {
        triggerTime: new Date(2025, 10, 14, 8, 15, 0).getTime(), // 08:15 ngày 14/11/2025
        data: {
          type: "recycling",
          icon: "reload-circle-outline",
          color: "#4CAF50",
          title: "Nhắc nhở: Chuẩn bị rác tái chế",
          message: `Ngày mai (15/11/2025) là lịch thu gom rác tái chế tại ${userProfile?.defaultRegion || "khu vực của bạn"}.\n\nHãy phân loại và để trước 7h sáng!`,
          read: false,
        },
      },
    ];

  useEffect(() => {
    initializeData();
    const interval = setInterval(checkAndAddScheduledNotifications, 30 * 1000);
    return () => clearInterval(interval);
  }, [userProfile?.defaultRegion, user?.uid, guestMode]);

  const initializeData = async () => {
    setLoading(true);
    await loadSettings();
    await loadNotifications();
    calculateNextRecycleDay();
    setLoading(false);
  };

  // 1. ĐỔI NGÀY TRONG calculateNextRecycleDay
const calculateNextRecycleDay = () => {
  const recycleDay = new Date(2025, 10, 15); // 15/11/2025
  setNextRecycleDay(recycleDay.toLocaleDateString("vi-VN"));
};

  const sendNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });

    const newNotif = {
      id: Date.now(),
      type: "recycling",
      icon: "notifications",
      color: "#4CAF50",
      title,
      message: body,
      read: false,
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    await saveNotifications(updated);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Thành công", "Đã gửi thông báo!");
  };

  const checkAndAddScheduledNotifications = async () => {
    const now = Date.now();
    const newNotifs = [...notifications];
    let hasNew = false;

    SCHEDULED_NOTIFICATIONS.forEach((sched) => {
      if (now >= sched.triggerTime && !newNotifs.some((n) => n.id === sched.triggerTime)) {
        const newNotif = { id: sched.triggerTime, ...sched.data };
        newNotifs.unshift(newNotif);
        hasNew = true;
      }
    });

    if (hasNew) {
      newNotifs.sort((a, b) => b.id - a.id);
      setNotifications(newNotifs);
      await saveNotifications(newNotifs);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;

    if (diff < minute) return "Vừa xong";
    if (diff < hour) return `${Math.floor(diff / minute)} phút trước`;
    if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
    return `${Math.floor(diff / day)} ngày trước`;
  };

  const loadSettings = async () => {
    try {
      const key = guestMode ? "guestNotifSettings" : `notifSettings_${user?.uid}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) setSettings(JSON.parse(saved));
    } catch (error) {
      console.error("Lỗi load settings:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const key = guestMode ? "guestNotifications" : `notifications_${user?.uid}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        generateStaticNotifications();
      }
    } catch (error) {
      console.error("Lỗi load notifications:", error);
    }
  };

  const generateStaticNotifications = () => {
    const now = Date.now();
    const region = userProfile?.defaultRegion || "khu vực của bạn";

    const staticNotifs = [
      {
        id: now - 4 * 60 * 60 * 1000,
        type: "weather",
        icon: "warning",
        color: "#FFA726",
        title: "Cảnh báo: AQI cao vào chiều nay",
        message: `Dự báo AQI đạt 142. Hạn chế ra ngoài từ 14:00 - 18:00.`,
        read: false,
      },
      {
        id: now - 6 * 60 * 60 * 1000,
        type: "community",
        icon: "people",
        color: "#9C27B0",
        title: "Nhóm 'Xanh Sài Gòn' vừa đăng bài mới",
        message: `Lan Anh: 'Ai muốn dọn rác kênh Nhiêu Lộc cuối tuần này?'`,
        read: true,
      },
    ];

    setNotifications(staticNotifs);
    saveNotifications(staticNotifs);
  };

  const saveSettings = async (newSettings) => {
    try {
      const key = guestMode ? "guestNotifSettings" : `notifSettings_${user?.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Lỗi save settings:", error);
    }
  };

  const saveNotifications = async (newNotifs) => {
    try {
      const key = guestMode ? "guestNotifications" : `notifications_${user?.uid}`;
      await AsyncStorage.setItem(key, JSON.stringify(newNotifs));
    } catch (error) {
      console.error("Lỗi save notifications:", error);
    }
  };

  const toggleSetting = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await saveSettings(newSettings);
    Alert.alert("Đã cập nhật", `Thông báo ${getSettingName(key)} đã được ${newSettings[key] ? "bật" : "tắt"}`);
  };

  const getSettingName = (key) => {
    const names = {
      campaigns: "chiến dịch môi trường",
      recycling: "thu gom rác",
      weather: "cảnh báo thời tiết",
      community: "hoạt động cộng đồng",
    };
    return names[key];
  };

  const markAsRead = async (id) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    await saveNotifications(updated);
  };

  const deleteNotification = async (id) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa thông báo này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const updated = notifications.filter((n) => n.id !== id);
          setNotifications(updated);
          await saveNotifications(updated);
        },
      },
    ]);
  };

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    await saveNotifications(updated);
    Alert.alert("Thành công", "Đã đánh dấu tất cả là đã đọc");
  };

  const clearAll = async () => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa tất cả thông báo?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa tất cả",
        style: "destructive",
        onPress: async () => {
          setNotifications([]);
          await saveNotifications([]);
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (!settings.campaigns && n.type === "campaign") return false;
    if (!settings.recycling && n.type === "recycling") return false;
    if (!settings.weather && n.type === "weather") return false;
    if (!settings.community && n.type === "community") return false;
    return true;
  });

  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* FR-6.2: Lịch thu gom rác tái chế */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="reload-circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Lịch thu gom rác tái chế</Text>
          </View>

          <View style={styles.recycleCard}>
            <View style={styles.recycleHeader}>
              <View style={styles.recycleIconContainer}>
                <Ionicons name="calendar" size={40} color="#4CAF50" />
              </View>
              <View style={styles.recycleInfo}>
                <Text style={styles.recycleLabel}>Ngày thu gom tiếp theo</Text>
                <Text style={styles.recycleDate}>{nextRecycleDay}</Text>
                <Text style={styles.recycleTime}>Trước 7:00 sáng</Text>
              </View>
            </View>

            <View style={styles.recycleTips}>
              <Text style={styles.recycleTipsTitle}>Chuẩn bị:</Text>
              <Text style={styles.recycleTipsText}>
                • Phân loại: Nhựa, giấy, kim loại{"\n"}
                • Rửa sạch các vật dụng{"\n"}
                • Đặt tại điểm thu gom
              </Text>
            </View>

            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() =>
                sendNotification(
                  "Nhắc nhở thu gom rác",
                  `Lịch thu gom rác tái chế sẽ diễn ra vào ngày ${nextRecycleDay}. Hãy chuẩn bị rác tái chế trước 7h sáng nhé!`
                )
              }
            >
              <Ionicons name="alarm-outline" size={20} color="#fff" />
              <Text style={styles.reminderButtonText}>Đặt lời nhắc</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FR-6.1: Chiến dịch môi trường */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="megaphone-outline" size={24} color="#FF9800" />
            <Text style={styles.sectionTitle}>Chiến dịch môi trường</Text>
          </View>

          <Text style={styles.sectionDesc}>
            Các hoạt động sắp diễn ra tại khu vực của bạn
          </Text>

          {campaigns.map((campaign) => (
            <TouchableOpacity
              key={campaign.id}
              style={styles.campaignCard}
              onPress={() =>
                Alert.alert(
                  campaign.title,
                  `Thời gian: ${campaign.date}\nĐịa điểm: ${campaign.location}\n\nBạn có muốn nhận thông báo về chiến dịch này không?`,
                  [
                    { text: "Để sau", style: "cancel" },
                    {
                      text: "Nhận thông báo",
                      onPress: () =>
                        sendNotification(
                          campaign.title,
                          `Diễn ra vào ${campaign.date} tại ${campaign.location}. Cùng tham gia nhé!`
                        ),
                    },
                  ]
                )
              }
            >
              <View
                style={[
                  styles.campaignIcon,
                  { backgroundColor: campaign.color + "15" },
                ]}
              >
                <Ionicons name={campaign.icon} size={28} color={campaign.color} />
              </View>
              <View style={styles.campaignContent}>
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                <View style={styles.campaignDetail}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.campaignDetailText}>{campaign.date}</Text>
                </View>
                <View style={styles.campaignDetail}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.campaignDetailText}>{campaign.location}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.allCampaignsButton}
            onPress={() =>
              sendNotification(
                "Thông báo chiến dịch",
                "Bạn đã đăng ký nhận thông báo về các chiến dịch môi trường!"
              )
            }
          >
            <Ionicons name="notifications-outline" size={20} color="#FF9800" />
            <Text style={styles.allCampaignsButtonText}>
              Nhận thông báo tất cả chiến dịch
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thông báo gần đây</Text>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.markAllReadButton}
                  onPress={markAllAsRead}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-done" size={18} color="#fff" />
                  <Text style={styles.markAllReadText}>Đánh dấu đã đọc</Text>
                </TouchableOpacity>
              )}
              {filteredNotifications.length > 0 && (
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={clearAll}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash" size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
              <Text style={styles.emptySubtext}>
                Các thông báo mới sẽ hiển thị tại đây
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notificationCard, !notif.read && styles.unreadCard]}
                onPress={async () => {
                  await markAsRead(notif.id);
                  navigation.navigate("NotificationDetail", { notification: notif });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: notif.color }]}>
                  <Ionicons name={notif.icon} size={24} color="#fff" />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{notif.title}</Text>
                    {!notif.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationMessage}>{notif.message}</Text>
                  <Text style={styles.notificationTime}>{formatTime(notif.id)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => deleteNotification(notif.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="close-circle" size={24} color="#999" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb-outline" size={24} color="#FFA726" />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Mẹo hay</Text>
            <Text style={styles.tipsText}>
              Bật thông báo để không bỏ lỡ các chiến dịch môi trường và lịch thu gom rác tại khu vực của bạn!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  headerTextContainer: { flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14, color: "#666" },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  sectionDesc: { fontSize: 13, color: "#666", marginBottom: 12 },
  recycleCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  recycleHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  recycleIconContainer: { marginRight: 15 },
  recycleInfo: { flex: 1 },
  recycleLabel: { fontSize: 12, color: "#666", marginBottom: 4 },
  recycleDate: { fontSize: 20, fontWeight: "bold", color: "#4CAF50", marginBottom: 4 },
  recycleTime: { fontSize: 13, color: "#666" },
  recycleTips: {
    backgroundColor: "#fff3e0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FF9800",
  },
  recycleTipsTitle: { fontSize: 13, fontWeight: "bold", color: "#E65100", marginBottom: 6 },
  recycleTipsText: { fontSize: 12, color: "#BF360C", lineHeight: 20 },
  reminderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
  },
  reminderButtonText: { marginLeft: 8, color: "#fff", fontWeight: "600", fontSize: 14 },
  campaignCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  campaignIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  campaignContent: { flex: 1, marginLeft: 12 },
  campaignTitle: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6 },
  campaignDetail: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  campaignDetailText: { fontSize: 12, color: "#666" },
  allCampaignsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff3e0",
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#ffe0b2",
  },
  allCampaignsButtonText: { marginLeft: 8, color: "#E65100", fontWeight: "600", fontSize: 14 },

  // === PHẦN CŨ ===
  headerCard: { backgroundColor: "#fff", margin: 15, marginBottom: 10, padding: 20, borderRadius: 15, flexDirection: "row", elevation: 3 },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 28, fontWeight: "bold", color: "#2e7d32", marginTop: 8 },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  divider: { width: 1, backgroundColor: "#e0e0e0", marginHorizontal: 15 },
  settingsCard: { backgroundColor: "#fff", margin: 15, marginTop: 5, padding: 15, borderRadius: 15, elevation: 3 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  settingInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  settingText: { marginLeft: 15, flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  settingDesc: { fontSize: 13, color: "#666", marginTop: 2 },
  notificationsSection: { margin: 15, marginTop: 5 },
  emptyState: { backgroundColor: "#fff", padding: 40, borderRadius: 15, alignItems: "center" },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#666", marginTop: 15 },
  emptySubtext: { fontSize: 14, color: "#999", marginTop: 5, textAlign: "center" },
  notificationCard: { backgroundColor: "#fff", marginBottom: 10, padding: 15, borderRadius: 12, flexDirection: "row", elevation: 2 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: "#2e7d32" },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  notificationTitle: { fontSize: 16, fontWeight: "bold", color: "#333", flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2e7d32", marginLeft: 8 },
  notificationMessage: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 6 },
  notificationTime: { fontSize: 12, color: "#999" },
  deleteButton: { padding: 5 },
  tipsCard: { backgroundColor: "#fff3e0", margin: 15, marginTop: 5, padding: 20, borderRadius: 15, flexDirection: "row", borderLeftWidth: 4, borderLeftColor: "#FFA726" },
  tipsContent: { flex: 1, marginLeft: 15 },
  tipsTitle: { fontSize: 16, fontWeight: "bold", color: "#F57C00", marginBottom: 5 },
  tipsText: { fontSize: 14, color: "#5D4037", lineHeight: 20 },

  // === NÚT MỚI - ĐẸP HƠN ===
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  markAllReadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  markAllReadText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
  },
  clearAllButton: {
    backgroundColor: "#E53935",
    padding: 9,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});
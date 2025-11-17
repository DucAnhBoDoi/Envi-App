// src/screens/NotificationsScreen.js
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import SafeAreaScrollView from "../components/SafeAreaScrollView";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationsScreen({ navigation }) {
  const { user, guestMode } = useContext(AuthContext);
  const { userProfile, incrementCampaignsJoined } = useContext(UserContext);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [nextRecycleDay, setNextRecycleDay] = useState("");

  const campaigns = [
    { id: "1", title: "Chiến dịch Làm sạch bãi biển", date: "05/11/2025", location: "Bãi biển Vũng Tàu", icon: "water-outline", color: "#03A9F4" },
    { id: "2", title: "Trồng cây xanh cùng thanh niên", date: "12/11/2025", location: "Công viên Tao Đàn, Q1", icon: "leaf-outline", color: "#4CAF50" },
    { id: "3", title: "Thu gom rác điện tử", date: "20/11/2025", location: "Siêu thị Metro An Phú", icon: "hardware-chip-outline", color: "#9C27B0" },
  ];

  const SCHEDULED_NOTIFICATIONS = [
    {
      triggerTime: new Date(2025, 10, 15, 9, 0, 0).getTime(),
      data: {
        type: "campaign",
        icon: "megaphone",
        color: "#FF6B6B",
        title: "Chiến dịch trồng cây xanh 2025",
        message: `Tham gia trồng 1.000 cây tại công viên Lê Văn Tám, ${userProfile?.defaultRegion || "khu vực của bạn"} vào 07:00 Chủ nhật!`,
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
    await loadNotifications();
    setNextRecycleDay(new Date(2025, 10, 7).toLocaleDateString("vi-VN"));
    setLoading(false);
  };

  const sendNotification = async (title, body, extraData = {}) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });

    const newNotif = {
      id: Date.now().toString(),
      type: extraData.type || "recycling",
      icon: extraData.icon || "notifications",
      color: extraData.color || "#4CAF50",
      title,
      message: body,
      read: false,
    };

    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    await saveNotifications(updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Thành công", "Đã thêm thông báo!");
  };

  const checkAndAddScheduledNotifications = async () => {
    const now = Date.now();
    let hasNew = false;
    const newNotifs = [...notifications];

    for (const sched of SCHEDULED_NOTIFICATIONS) {
      if (now >= sched.triggerTime && !newNotifs.some(n => n.id === sched.triggerTime.toString())) {
        newNotifs.unshift({
          id: sched.triggerTime.toString(),
          ...sched.data,
        });
        hasNew = true;
      }
    }

    if (hasNew) {
      newNotifs.sort((a, b) => Number(b.id) - Number(a.id));
      setNotifications(newNotifs);
      await saveNotifications(newNotifs);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - Number(timestamp);
    const minute = 60 * 1000, hour = minute * 60, day = hour * 24;
    if (diff < minute) return "Vừa xong";
    if (diff < hour) return `${Math.floor(diff / minute)} phút trước`;
    if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
    return `${Math.floor(diff / day)} ngày trước`;
  };

  const getStorageKey = () => guestMode ? "guestNotifications" : `notifications_${user?.uid}`;

  const loadNotifications = async () => {
    try {
      const key = getStorageKey();
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        const fixed = parsed.map(n => ({ ...n, id: n.id.toString() }));
        setNotifications(fixed);
      } else {
        generateStaticNotifications();
      }
    } catch (e) {
      console.error("Load error:", e);
    }
  };

  const generateStaticNotifications = async () => {
    const now = Date.now();
    const staticNotifs = [
      { id: (now - 4*60*60*1000).toString(), type: "weather", icon: "warning", color: "#FFA726", title: "Cảnh báo: AQI cao", message: "Hạn chế ra ngoài từ 14:00 - 18:00.", read: false },
      { id: (now - 6*60*60*1000).toString(), type: "community", icon: "people", color: "#9C27B0", title: "Nhóm Xanh Sài Gòn", message: "Lan Anh: Ai muốn dọn rác kênh Nhiêu Lộc?", read: true },
    ];
    setNotifications(staticNotifs);
    await saveNotifications(staticNotifs);
  };

  const saveNotifications = async (notifs) => {
    try {
      const key = getStorageKey();
      await AsyncStorage.setItem(key, JSON.stringify(notifs));
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const updateNotification = async (id, updates) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, ...updates } : n
    );
    setNotifications(updated);
    await saveNotifications(updated);
  };

  const deleteNotification = async (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    await saveNotifications(updated);
  };

  // ✅ FIX: Khi xem thông báo chiến dịch (chưa đọc) → Tăng chiến dịch + cộng điểm
  const markAsRead = async (id) => {
    const notif = notifications.find(n => n.id === id);
    
    // Nếu là chiến dịch và chưa đọc → Tính là tham gia
    if (notif && !notif.read && notif.type === "campaign") {
      await incrementCampaignsJoined();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Tham gia thành công! 🎉", 
        "Bạn đã xem và tham gia chiến dịch này. Nhận +10 điểm!"
      );
    }
    
    // Đánh dấu đã đọc
    updateNotification(id, { read: true });
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const clearAll = async () => {
    Alert.alert("Xóa tất cả", "Chắc chắn xóa toàn bộ?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa hết", style: "destructive", onPress: async () => {
        setNotifications([]);
        await saveNotifications([]);
      }},
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={{ width: 40 }} />
      </View>

      <SafeAreaScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Lịch thu gom */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="reload-circle-outline" size={28} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Lịch thu gom rác tái chế</Text>
          </View>
          <View style={styles.recycleCard}>
            <View style={styles.recycleHeader}>
              <Ionicons name="calendar" size={48} color="#4CAF50" />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={styles.recycleLabel}>Ngày tiếp theo</Text>
                <Text style={styles.recycleDate}>{nextRecycleDay}</Text>
                <Text style={styles.recycleTime}>Trước 7:00 sáng</Text>
              </View>
              <TouchableOpacity style={styles.reminderBtn} onPress={() =>
                sendNotification("Nhắc nhở thu gom", `Ngày ${nextRecycleDay} là ngày thu gom rác!`)
              }>
                <Ionicons name="alarm" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>Chuẩn bị:</Text>
              <Text style={styles.tipsText}>
                • Phân loại: Nhựa, giấy, kim loại{'\n'}
                • Rửa sạch{'\n'}
                • Đặt trước nhà
              </Text>
            </View>
          </View>
        </View>

        {/* Chiến dịch - Tạo thông báo chiến dịch */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="megaphone-outline" size={28} color="#FF9800" />
            <Text style={styles.sectionTitle}>Chiến dịch môi trường</Text>
          </View>
          {campaigns.map(c => (
            <TouchableOpacity key={c.id} style={styles.campaignCard} onPress={() =>
              Alert.alert(c.title, `${c.date} • ${c.location}\n\nNhận thông báo chiến dịch này?`, [
                { text: "Để sau", style: "cancel" },
                { 
                  text: "Nhận thông báo", 
                  onPress: () => {
                    sendNotification(c.title, `${c.date} tại ${c.location}`, { 
                      type: "campaign", 
                      icon: c.icon, 
                      color: c.color 
                    });
                  }
                },
              ])
            }>
              <View style={[styles.campaignIcon, { backgroundColor: c.color + "20" }]}>
                <Ionicons name={c.icon} size={30} color={c.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.campaignTitle}>{c.title}</Text>
                <Text style={styles.campaignSubtitle}>{c.date} • {c.location}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#aaa" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.allCampaignsButton} onPress={() =>
            sendNotification("Đã bật tất cả chiến dịch", "Bạn sẽ nhận thông báo mọi hoạt động môi trường!", { type: "campaign", icon: "megaphone", color: "#FF9800" })
          }>
            <Ionicons name="notifications" size={22} color="#FF9800" />
            <Text style={styles.allCampaignsButtonText}>Nhận tất cả chiến dịch</Text>
          </TouchableOpacity>
        </View>

        {/* Danh sách thông báo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={28} color="#2196F3" />
            <Text style={styles.sectionTitle}>Thông báo gần đây</Text>
          </View>

          {notifications.length > 0 && (
            <View style={styles.actionsBar}>
              {unreadCount > 0 && (
                <TouchableOpacity style={styles.markReadButton} onPress={markAllAsRead}>
                  <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
                  <Text style={styles.markReadText}>Đánh dấu {unreadCount} đã đọc</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.clearAllButton} onPress={clearAll}>
                <Ionicons name="trash-outline" size={20} color="#E53935" />
                <Text style={styles.clearAllText}>Xóa tất cả</Text>
              </TouchableOpacity>
            </View>
          )}

          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={68} color="#ddd" />
              <Text style={styles.emptyText}>Chưa có thông báo</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {notifications.map(notif => (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.notificationItemContainer, !notif.read && styles.unreadItem]}
                  onPress={() => {
                    if (!notif.read) markAsRead(notif.id);
                    navigation.navigate("NotificationDetail", {
                      notification: notif,
                      onUpdate: updateNotification,
                      onDelete: deleteNotification,
                    });
                  }}
                >
                  {!notif.read && <View style={styles.unreadBorder} />}
                  <View style={styles.notificationCard}>
                    <View style={[styles.iconCircle, { backgroundColor: notif.color }]}>
                      <Ionicons name={notif.icon} size={26} color="#fff" />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{notif.title}</Text>
                        {!notif.read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notif.message}
                      </Text>
                      <Text style={styles.notificationTime}>{formatTime(notif.id)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="close-circle" size={28} color="#ccc" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.tipsCard}>
          <Ionicons name="bulb" size={30} color="#FFA726" />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.tipsTitle}>Mẹo hay</Text>
            <Text style={styles.tipsText}>
              Bật thông báo để không bỏ lỡ lịch thu gom và chiến dịch xanh! Xem thông báo chiến dịch để tham gia và nhận điểm thưởng.
            </Text>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </SafeAreaScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" },
  loadingText: { marginTop: 10, fontSize: 14, color: "#666" },
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
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginLeft: 10,
  },
  recycleCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
  },
  recycleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  recycleLabel: {
    fontSize: 13,
    color: "#666",
  },
  recycleDate: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4CAF50",
    marginTop: 2,
  },
  recycleTime: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  reminderBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  tipsBox: {
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    padding: 14,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 6,
  },
  tipsText: {
    fontSize: 13,
    color: "#2e7d32",
    lineHeight: 20,
  },
  campaignCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  campaignIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  campaignTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  campaignSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  allCampaignsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff8e1",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ffe0b2",
  },
  allCampaignsButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#FF9800",
  },
  actionsBar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  markReadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    padding: 10,
  },
  markReadText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#4CAF50",
  },
  clearAllButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffebee",
    borderRadius: 10,
    padding: 10,
  },
  clearAllText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#E53935",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
  notificationItemContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  unreadItem: {
    backgroundColor: "#f0f8ff",
  },
  unreadBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#2196F3",
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2196F3",
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  deleteBtn: {
    padding: 8,
  },
  tipsCard: {
    flexDirection: "row",
    backgroundColor: "#fff8e1",
    margin: 16,
    marginTop: 15,
    padding: 20,
    borderRadius: 18,
    borderLeftWidth: 6,
    borderLeftColor: "#FFB300",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
});
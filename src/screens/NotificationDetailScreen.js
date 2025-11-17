// src/screens/NotificationDetailScreen.js
import React, { useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";

export default function NotificationDetailScreen({ route, navigation }) {
  const { notification, onUpdate, onDelete } = route.params;
  const { user, guestMode } = useContext(AuthContext);

  useEffect(() => {
    if (!notification.read && onUpdate) {
      onUpdate(notification.id, { read: true });
    }
  }, []);

  const deleteNotification = () => {
    Alert.alert("Xóa thông báo", "Bạn có chắc muốn xóa?", [
      { text: "Hủy" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          if (onDelete) onDelete(notification.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - Number(timestamp);
    const minute = 60 * 1000, hour = minute * 60, day = hour * 24;
    if (diff < minute) return "Vừa xong";
    if (diff < hour) return `${Math.floor(diff / minute)} phút trước`;
    if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
    return `${Math.floor(diff / day)} ngày trước`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* === HEADER GIỐNG NOTIFICATIONS & GAMIFICATION === */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết thông báo</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* === NỘI DUNG === */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          {/* Header thông báo */}
          <View style={styles.notifHeader}>
            <View style={[styles.iconCircle, { backgroundColor: notification.color }]}>
              <Ionicons name={notification.icon} size={36} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.title}>{notification.title}</Text>
              <Text style={styles.time}>{formatTime(notification.id)}</Text>
            </View>
          </View>

          {/* Nội dung */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{notification.message}</Text>
          </View>

          {/* Nút xóa */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.deleteBtn} onPress={deleteNotification}>
              <Ionicons name="trash" size={20} color="#E53935" />
              <Text style={styles.deleteText}>Xóa thông báo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

// === STYLES — ĐỒNG BỘ 100% VỚI NOTIFICATIONS & GAMIFICATION ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  // === HEADER GIỐNG HỆT ===
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

  scrollContainer: {
    flex: 1,
  },

  // Card chính
  contentCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },

  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  time: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },

  messageContainer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginVertical: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 26,
    color: "#444",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  deleteText: {
    marginLeft: 8,
    color: "#E53935",
    fontWeight: "600",
    fontSize: 15,
  },
});
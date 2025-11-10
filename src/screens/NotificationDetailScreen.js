// src/screens/NotificationDetailScreen.js
import React, { useContext, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: notification.color }]}>
          <Ionicons name={notification.icon} size={32} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.time}>{formatTime(notification.id)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>{notification.message}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={deleteNotification}>
          <Ionicons name="trash" size={20} color="#E53935" />
          <Text style={styles.deleteText}>Xóa thông báo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", padding: 20, alignItems: "center" },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginRight: 15 },
  title: { fontSize: 18, fontWeight: "bold", color: "#222" },
  time: { fontSize: 13, color: "#999", marginTop: 4 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  message: { fontSize: 16, lineHeight: 26, color: "#444" },
  actions: { padding: 20, flexDirection: "row", justifyContent: "flex-end" },
  btn: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffebee", padding: 12, borderRadius: 10 },
  deleteText: { marginLeft: 8, color: "#E53935", fontWeight: "600" },
});
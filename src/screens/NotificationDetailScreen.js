// src/screens/NotificationDetailScreen.js
import React, { useContext, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";

export default function NotificationDetailScreen({ route, navigation }) {
  const { notification } = route.params;
  const { user, guestMode } = useContext(AuthContext);

  useEffect(() => {
    if (!notification.read) markAsRead(notification.id);
  }, []);

  const markAsRead = async (id) => {
    const key = guestMode ? "guestNotifications" : `notifications_${user?.uid}`;
    const saved = await AsyncStorage.getItem(key);
    if (!saved) return;
    const notifs = JSON.parse(saved);
    const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  };

  const deleteNotification = () => {
    Alert.alert("Xóa thông báo", "Bạn có chắc muốn xóa?", [
      { text: "Hủy" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const key = guestMode ? "guestNotifications" : `notifications_${user?.uid}`;
          const saved = await AsyncStorage.getItem(key);
          if (!saved) return navigation.goBack();
          const notifs = JSON.parse(saved);
          const updated = notifs.filter((n) => n.id !== notification.id);
          await AsyncStorage.setItem(key, JSON.stringify(updated));
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: notification.color }]}>
          <Ionicons name={notification.icon} size={32} color="#fff" />
        </View>
        <View>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.time}>{notification.time}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>{notification.message}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={deleteNotification}>
          <Ionicons name="trash" size={20} color="#E53935" />
          <Text style={styles.deleteText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", padding: 20, alignItems: "center" },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginRight: 15 },
  title: { fontSize: 18, fontWeight: "bold" },
  time: { fontSize: 13, color: "#999", marginTop: 4 },
  content: { padding: 20 },
  message: { fontSize: 16, lineHeight: 24, color: "#444" },
  actions: { padding: 20, flexDirection: "row", justifyContent: "flex-end" },
  btn: { flexDirection: "row", alignItems: "center" },
  deleteText: { marginLeft: 8, color: "#E53935", fontWeight: "600" },
});
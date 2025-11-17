// src/screens/ChatHistoryScreen.js
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../context/UserContext";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ THÊM

export default function ChatHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets(); // ✅ THÊM hook này
  const { chatHistory, clearChatHistory, loadChatHistory } = useContext(UserContext);
  const [refreshing, setRefreshing] = useState(false);

  // Chỉ lấy câu hỏi của user
  const userQuestions = (chatHistory || []).filter(item => item.sender === "user");

  // Load lại khi vào màn hình
  useFocusEffect(
    React.useCallback(() => {
      loadChatHistory();
    }, [loadChatHistory])
  );

  // Xóa lịch sử
  const handleClearHistory = () => {
    Alert.alert(
      "Xóa lịch sử chat",
      "Bạn có chắc muốn xóa toàn bộ lịch sử chat không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const result = await clearChatHistory();
            if (result?.success) {
              Alert.alert("Thành công", "Đã xóa lịch sử chat");
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatHistory();
    setTimeout(() => setRefreshing(false), 500);
  };

  const renderChatItem = ({ item }) => (
    <View style={styles.chatCard}>
      <View style={styles.chatHeader}>
        <Ionicons name="person-circle" size={20} color="#2e7d32" />
        <Text style={styles.chatSender}>Bạn đã hỏi</Text>
        <Text style={styles.chatTime}>
          {new Date(item.timestamp).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      <Text style={styles.chatText} numberOfLines={20}>
        {item.message}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* HEADER ĐỒNG BỘ 100% */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử trò chuyện</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* NỘI DUNG */}
      {userQuestions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#c8e6c9" />
          <Text style={styles.emptyText}>Chưa có lịch sử câu hỏi</Text>
          <Text style={styles.emptySubtext}>
            Các câu hỏi bạn đã hỏi sẽ được lưu tại đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={userQuestions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2e7d32"]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Đồng bộ toàn app
  },

  // HEADER ĐỒNG BỘ
  header: {
    flexDirection: "row",
    alignItems: "center",
    // paddingTop: 50,
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

  // LIST
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // EMPTY STATE
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  // CHAT CARD
  chatCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#e8f5e9",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#2e7d32",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  chatSender: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2e7d32",
    flex: 1,
  },
  chatTime: {
    fontSize: 10,
    color: "#999",
  },
  chatText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});
// src/screens/ChatHistoryScreen.js
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../context/UserContext";
import { useFocusEffect } from "@react-navigation/native";

export default function ChatHistoryScreen({ navigation }) {
  const { chatHistory, clearChatHistory, loadChatHistory } = useContext(UserContext);
  const [refreshing, setRefreshing] = useState(false);

  // 🔥 Chỉ lấy câu hỏi của user (sender === "user")
  const userQuestions = chatHistory.filter(item => item.sender === "user");

  // 🔥 Refresh khi vào màn hình này
  useFocusEffect(
    React.useCallback(() => {
      loadChatHistory();
    }, [])
  );

  // Xử lý xóa lịch sử
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
            if (result.success) {
              Alert.alert("Thành công", "Đã xóa lịch sử chat");
            }
          },
        },
      ]
    );
  };

  // Refresh danh sách
  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatHistory();
    setTimeout(() => setRefreshing(false), 500);
  };

  const renderChatItem = ({ item }) => (
    <View style={styles.chatCard}>
      <View style={styles.chatHeader}>
        <Ionicons
          name="person-circle"
          size={20}
          color="#2e7d32"
        />
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

  if (userQuestions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={80} color="#c8e6c9" />
        <Text style={styles.emptyText}>Chưa có lịch sử câu hỏi</Text>
        <Text style={styles.emptySubtext}>
          Các câu hỏi bạn đã hỏi sẽ được lưu tại đây
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Danh sách */}
      <FlatList
        data={userQuestions}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  headerCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  listContent: { padding: 16 },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  emptyText: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#666", 
    marginTop: 20 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: "#999", 
    marginTop: 8, 
    textAlign: "center",
    paddingHorizontal: 40,
  },

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
    marginBottom: 8 
  },
  chatSender: { 
    fontSize: 12, 
    fontWeight: "600", 
    color: "#2e7d32", 
    flex: 1 
  },
  chatTime: { 
    fontSize: 10, 
    color: "#999" 
  },
  chatText: { 
    fontSize: 14, 
    color: "#333", 
    lineHeight: 20 
  },
});
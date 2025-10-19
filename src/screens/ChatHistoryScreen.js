// src/screens/ChatHistoryScreen.js
import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../context/UserContext";

export default function ChatHistoryScreen({ navigation }) {
  const { chatHistory } = useContext(UserContext);

  const renderChatItem = ({ item }) => (
    <View
      style={[
        styles.chatCard,
        item.sender === "user" ? styles.userMessage : styles.botMessage,
      ]}
    >
      <View style={styles.chatHeader}>
        <Ionicons
          name={item.sender === "user" ? "person" : "chatbubbles"}
          size={20}
          color={item.sender === "user" ? "#2e7d32" : "#1976d2"}
        />
        <Text style={styles.chatSender}>
          {item.sender === "user" ? "Bạn" : "Chatbot"}
        </Text>
        <Text style={styles.chatTime}>
          {new Date(item.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      <Text style={styles.chatText}>{item.message}</Text>
    </View>
  );

  if (chatHistory.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Chưa có lịch sử chat</Text>
        <Text style={styles.emptySubtext}>
          Các câu hỏi của bạn sẽ được lưu tại đây
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chatHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  listContent: { padding: 15 },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#666", marginTop: 20 },
  emptySubtext: { fontSize: 14, color: "#999", marginTop: 8, textAlign: "center" },

  chatCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    maxWidth: "85%",
  },
  userMessage: {
    backgroundColor: "#e8f5e9",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderBottomLeftRadius: 4,
  },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  chatSender: { fontSize: 12, fontWeight: "600", color: "#333", flex: 1 },
  chatTime: { fontSize: 10, color: "#999" },
  chatText: { fontSize: 14, color: "#333", lineHeight: 20 },
});
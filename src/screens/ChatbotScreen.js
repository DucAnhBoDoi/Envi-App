// src/screens/ChatbotScreen.js
import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../context/UserContext";
import * as Speech from "expo-speech";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OPENROUTER_API_KEY } from "@env";

export default function ChatbotScreen() {
  const { addChatToHistory } = useContext(UserContext);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ttsOn, setTtsOn] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatRef = useRef(null);

  const tabBarHeight = 65 + insets.bottom;

  useEffect(() => {
    setMessages([]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => Speech.stop();
    }, [])
  );

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          if (flatRef.current && messages.length > 0) {
            flatRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    );

    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [messages.length]);

  const callDeepSeekAPI = async (userMessage) => {
    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    const systemPrompt = `Bạn là một trợ lý AI chuyên về môi trường tại Việt Nam.
Trả lời bằng tiếng Việt, thân thiện, ngắn gọn (2–3 câu), dễ hiểu, và thêm emoji phù hợp.`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://yourapp.example.com",
          "X-Title": "EnviChatbot",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Lỗi API (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();
      return reply || "Xin lỗi, mình chưa có câu trả lời cho câu hỏi này 😅.";
    } catch (error) {
      console.error("❌ Lỗi DeepSeek API:", error);
      return "⚠️ Không thể kết nối tới DeepSeek API. Kiểm tra Internet hoặc API key.";
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    const timestamp = Date.now();
    const userMessage = {
      id: `user_${timestamp}_${Math.floor(Math.random() * 1000)}`,
      sender: "user",
      message: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    await addChatToHistory(userMessage);

    setInput("");
    setSending(true);

    try {
      const botReply = await callDeepSeekAPI(text);
      const botMessage = {
        id: `bot_${timestamp}_${Math.floor(Math.random() * 1000)}`,
        sender: "bot",
        message: botReply,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMessage]);
      await addChatToHistory(botMessage);

      if (ttsOn) {
        Speech.stop();
        Speech.speak(botReply, { language: "vi-VN", rate: 0.9 });
      }
    } catch (error) {
      const errMsg = {
        id: `error_${timestamp}_${Math.floor(Math.random() * 1000)}`,
        sender: "bot",
        message: `❌ Lỗi: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
      await addChatToHistory(errMsg);
    } finally {
      setSending(false);
    }
  };

  const handleClearCurrentChat = () => {
    Alert.alert("Xóa cuộc trò chuyện", "Bạn có chắc muốn xóa cuộc trò chuyện hiện tại không?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: () => setMessages([]) },
    ]);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages]);

  const quickQuestions = [
    "Rác nhựa bỏ vào thùng nào?",
    "Cách xử lý pin cũ?",
    "Luật bảo vệ môi trường Việt Nam?",
    "Giảm rác thải nhựa như thế nào?",
  ];

  const renderItem = ({ item }) => (
    <Animated.View
      style={[
        styles.messageWrapper,
        item.sender === "user" ? styles.userMessage : styles.botMessage,
      ]}
    >
      <View style={styles.messageHeader}>
        <Ionicons
          name={item.sender === "user" ? "person-circle" : "chatbubble-ellipses"}
          size={20}
          color={item.sender === "user" ? "#2e7d32" : "#1976d2"}
        />
        <Text style={styles.senderName}>
          {item.sender === "user" ? "Bạn" : "Trợ lý AI"}
        </Text>
      </View>
      <Text style={styles.messageText}>{item.message}</Text>
      <Text style={styles.messageTime}>
        {new Date(item.timestamp).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* 🌿 Header - Đã bỏ marginTop thừa */}
      <View style={styles.header}>
        <Ionicons name="logo-snapchat" size={30} color="#2e7d32" />
        <Text style={styles.headerText}>Trợ lý Môi Trường AI</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleClearCurrentChat}>
          <Ionicons name="trash-outline" size={22} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      {/* 🗨️ Nội dung chat */}
      <View style={styles.chatBody}>
        {messages.length === 0 ? (
          <View style={styles.fixedEmptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#c8e6c9" />
            <Text style={styles.emptyTitle}>Chào bạn! 👋</Text>
            <Text style={styles.emptyText}>
              Tôi là trợ lý AI về môi trường. Hãy hỏi tôi về:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>♻️ Phân loại rác thải</Text>
              <Text style={styles.featureItem}>📜 Luật bảo vệ môi trường</Text>
              <Text style={styles.featureItem}>🌱 Gợi ý hành động xanh</Text>
            </View>

            <Text style={styles.quickTitle}>Câu hỏi gợi ý:</Text>
            <View style={styles.quickQuestions}>
              {quickQuestions.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickBtn}
                  onPress={() => setInput(q)}
                >
                  <Text style={styles.quickText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: tabBarHeight + 70 }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      {/* 💬 Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={[
          styles.inputContainer,
          { marginBottom: keyboardHeight > 0 ? keyboardHeight - 230 : tabBarHeight }
        ]}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[styles.ttsBtn, ttsOn && styles.ttsBtnActive]}
              onPress={() => setTtsOn(s => !s)}
            >
              <Ionicons
                name={ttsOn ? "volume-high" : "volume-mute"}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Hỏi về môi trường..."
              placeholderTextColor="#999"
              value={input}
              onChangeText={setInput}
              multiline
            />

            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={send}
              disabled={sending || !input.trim()}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 3,
  },
  headerText: { fontSize: 18, fontWeight: "bold", color: "#333" },
  refreshBtn: { position: "absolute", right: 20, padding: 6 },

  chatBody: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 12 },

  fixedEmptyContainer: {
    position: "absolute",
    top: "5%",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#2e7d32", marginTop: 16 },
  emptyText: { fontSize: 14, color: "#666", marginTop: 8, textAlign: "center" },
  featureList: { marginTop: 16, alignItems: "flex-start" },
  featureItem: { fontSize: 14, color: "#333", marginVertical: 4 },
  quickTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 24,
    marginBottom: 12,
  },
  quickQuestions: { width: "100%", gap: 8 },
  quickBtn: {
    backgroundColor: "#e8f5e9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a5d6a7",
  },
  quickText: { fontSize: 14, color: "#2e7d32", textAlign: "center" },

  messageWrapper: {
    maxWidth: "85%",
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#e8f5e9",
    borderBottomRightRadius: 4,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  senderName: { fontSize: 12, fontWeight: "600", color: "#666" },
  messageText: { fontSize: 14, color: "#333", lineHeight: 20 },
  messageTime: { fontSize: 10, color: "#999", marginTop: 6, textAlign: "right" },

  inputContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 8,
    minHeight: 64,
  },
  ttsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#9e9e9e",
    justifyContent: "center",
    alignItems: "center",
  },
  ttsBtnActive: { backgroundColor: "#1976d2" },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: "#f0f0f0",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
});
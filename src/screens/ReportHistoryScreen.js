// src/screens/ReportHistoryScreen.js
import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../context/UserContext";

export default function ReportHistoryScreen({ navigation }) {
  const { reportHistory } = useContext(UserContext);

  const renderReportItem = ({ item }) => (
    <TouchableOpacity style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Ionicons name="document-text" size={24} color="#2e7d32" />
        <View style={styles.reportHeaderText}>
          <Text style={styles.reportTitle}>{item.title || "Báo cáo môi trường"}</Text>
          <Text style={styles.reportDate}>
            {new Date(item.timestamp).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>

      {item.location && (
        <View style={styles.reportDetail}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.reportDetailText}>{item.location}</Text>
        </View>
      )}

      {item.description && (
        <Text style={styles.reportDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {item.category && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (reportHistory.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Chưa có báo cáo nào</Text>
        <Text style={styles.emptySubtext}>
          Báo cáo của bạn sẽ được lưu tại đây
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reportHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem}
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

  reportCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  reportHeaderText: { flex: 1 },
  reportTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 4 },
  reportDate: { fontSize: 12, color: "#999" },
  reportDetail: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  reportDetailText: { fontSize: 14, color: "#666" },
  reportDescription: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 10 },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: { fontSize: 12, color: "#2e7d32", fontWeight: "600" },
});
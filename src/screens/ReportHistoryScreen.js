// src/screens/ReportHistoryScreen.js
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ImageViewing from "react-native-image-viewing";
import { UserContext } from "../context/UserContext";

const STATUS_INFO = {
  pending: {
    label: "Đã nhận",
    color: "#FF9800",
    icon: "time-outline",
    bgColor: "#FFF3E0",
  },
  processing: {
    label: "Đang xử lý",
    color: "#2196F3",
    icon: "refresh-outline",
    bgColor: "#E3F2FD",
  },
  completed: {
    label: "Hoàn thành",
    color: "#4CAF50",
    icon: "checkmark-circle-outline",
    bgColor: "#E8F5E9",
  },
};

export default function ReportHistoryScreen() {
  const { reportHistory, updateReportStatus } = useContext(UserContext);
  const [refreshing, setRefreshing] = useState(false);

  // 📸 state cho ImageViewing
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageList, setImageList] = useState([]);

  // 🔁 Tự động cập nhật trạng thái mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => {
      if (!reportHistory || reportHistory.length === 0) return;

      reportHistory.forEach((report) => {
        const currentStatus = report.status || "pending";
        let nextStatus = currentStatus;

        if (currentStatus === "pending") nextStatus = "processing";
        else if (currentStatus === "processing") nextStatus = "completed";
        else if (currentStatus === "completed") return; // không đổi nữa

        updateReportStatus(report.id, nextStatus);
      });
    }, 30000); // 30 giây

    return () => clearInterval(interval);
  }, [reportHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const renderReportItem = ({ item }) => {
    const currentStatus = item.status || "pending";
    const status = STATUS_INFO[currentStatus];

    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() =>
          Alert.alert(
            item.category,
            `Trạng thái: ${status.label}\n\nMô tả: ${item.description}\n\nVị trí: ${item.location}`
          )
        }
      >
        {/* Header */}
        <View style={styles.reportHeader}>
          <View style={styles.reportHeaderLeft}>
            <Ionicons
              name={item.categoryIcon || "document-text"}
              size={24}
              color={item.categoryColor || "#2e7d32"}
            />
            <View style={styles.reportHeaderText}>
              <Text style={styles.reportTitle}>{item.category}</Text>
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

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status.bgColor, borderColor: status.color },
            ]}
          >
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.reportDescription} numberOfLines={3}>
            {item.description}
          </Text>
        )}

        {/* 📸 Hình ảnh */}
        {item.images && item.images.length > 0 && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesContainer}
              contentContainerStyle={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {item.images.map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    setImageList(item.images.map((img) => ({ uri: img })));
                    setCurrentIndex(i);
                    setVisible(true);
                  }}
                >
                  <Image source={{ uri }} style={styles.thumbnail} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ImageViewing
              images={imageList}
              imageIndex={currentIndex}
              visible={visible}
              onRequestClose={() => setVisible(false)}
              swipeToCloseEnabled={true}
              doubleTapToZoomEnabled={true}
              FooterComponent={({ imageIndex }) => (
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Ảnh {imageIndex + 1} / {imageList.length}
                  </Text>
                </View>
              )}
            />
          </>
        )}

        {item.location && (
          <View style={styles.reportDetail}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.reportDetailText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}

        {currentStatus === "processing" && (
          <View style={styles.processingInfo}>
            <Ionicons name="information-circle" size={16} color="#2196F3" />
            <Text style={styles.processingText}>
              Cơ quan chức năng đang xác minh và xử lý...
            </Text>
          </View>
        )}

        {currentStatus === "completed" && (
          <View style={styles.completedInfo}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.completedText}>
              Báo cáo đã được xử lý xong. Cảm ơn bạn!
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!reportHistory || reportHistory.length === 0) {
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2e7d32"]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  listContent: { padding: 15, paddingBottom: 100 },

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
  reportHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reportHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  reportHeaderText: { flex: 1, marginLeft: 12 },
  reportTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  reportDate: { fontSize: 12, color: "#999" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: "600", marginLeft: 4 },

  reportDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  reportDetail: { flexDirection: "row", alignItems: "center", gap: 6 },
  reportDetailText: { fontSize: 13, color: "#666", flex: 1 },

  imagesContainer: { marginBottom: 12 },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 8,
    resizeMode: "cover",
  },

  footer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  footerText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  processingInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  processingText: { fontSize: 12, color: "#1976D2", marginLeft: 8 },
  completedInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  completedText: { fontSize: 12, color: "#388E3C", marginLeft: 8 },
});


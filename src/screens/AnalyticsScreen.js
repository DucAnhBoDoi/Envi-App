// src/screens/AnalyticsScreen.js
import React, { useState, useContext, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { UserContext } from "../context/UserContext";
import SafeAreaScrollView from "../components/SafeAreaScrollView";
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ THÊM

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen({ navigation }) {
  const {
    userProfile = {},
    reportHistory = [],
    communityPosts = [],
    wasteClassificationHistory = [],
    allReports = [],
    loadUserProfile,
    loadAllReports,
    migrateReportsToFirestore,
  } = useContext(UserContext) || {};
  const insets = useSafeAreaInsets(); // ✅ THÊM hook này
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const periods = [
    { id: "week", name: "Tuần" },
    { id: "month", name: "Tháng" },
    { id: "year", name: "Năm" },
  ];

  // TẢI DỮ LIỆU KHI VÀO MÀN HÌNH
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserProfile?.();
      loadAllReports?.();
    });
    return unsubscribe;
  }, [navigation, loadUserProfile, loadAllReports]);

  // PULL TO REFRESH
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile?.();
    await loadAllReports?.();
    setRefreshing(false);
  };

  // TÍNH TOÁN DỮ LIỆU
  const analyticsData = useMemo(() => {
    const now = new Date();
    const userReports = reportHistory || [];

    // 1. CÁ NHÂN
    const reportsSubmitted = userReports.length;
    const wasteHistory = wasteClassificationHistory || [];
    const aiCounts = wasteHistory.reduce((acc, entry) => {
      const type = entry.type || "Khác";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const wasteOrder = ["Nhựa", "Giấy", "Kim loại", "Thủy tinh", "Hữu cơ", "Điện tử"];
    const wasteClassification = wasteOrder.map(name => aiCounts[name] || 0);
    const totalClassified = wasteHistory.length;
    const pointsEarned = Number(userProfile?.points || 0);
    const campaignsJoined = Number(userProfile?.campaignsJoined || 0);

    // 2. BIỂU ĐỒ LINE
    let labels = [];
    let dataPoints = [];
    if (selectedPeriod === "week") {
      labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
      dataPoints = new Array(7).fill(0);
      const today = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (today === 0 ? 6 : today - 1));
      startOfWeek.setHours(0, 0, 0, 0);
      userReports.forEach(report => {
        const reportDate = new Date(report.timestamp);
        if (reportDate >= startOfWeek) {
          const dayIndex = reportDate.getDay();
          const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
          dataPoints[adjustedIndex]++;
        }
      });
    } else if (selectedPeriod === "month") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      labels = Array.from({ length: Math.min(daysInMonth, 30) }, (_, i) => `${i + 1}`);
      dataPoints = new Array(labels.length).fill(0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      userReports.forEach(report => {
        const reportDate = new Date(report.timestamp);
        if (reportDate >= startOfMonth && reportDate.getMonth() === now.getMonth()) {
          const day = reportDate.getDate() - 1;
          if (day < dataPoints.length) dataPoints[day]++;
        }
      });
    } else {
      labels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
      dataPoints = new Array(12).fill(0);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      userReports.forEach(report => {
        const reportDate = new Date(report.timestamp);
        if (reportDate >= startOfYear && reportDate.getFullYear() === now.getFullYear()) {
          dataPoints[reportDate.getMonth()]++;
        }
      });
    }

    // 3. PIE CHART
    const violationCount = userReports.reduce((acc, r) => {
      const type = r.category || "Khác";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const pieColors = {
      "Đổ rác bừa bãi": "#FF6384",
      "Ô nhiễm nước": "#36A2EB",
      "Đốt rác": "#FFCE56",
      "Khói bụi công nghiệp": "#9966FF",
      "Chặt phá cây xanh": "#4BC0C0",
      "Khác": "#FF9F40",
    };

    const shortLabels = {
      "Chặt phá cây xanh": "Chặt cây",
      "Khói bụi công nghiệp": "Khói bụi",
      "Đổ rác bừa bãi": "Đổ rác",
      "Ô nhiễm nước": "Ô nhiễm",
    };

    const pieData = Object.entries(violationCount)
      .map(([name, count]) => ({
        name: shortLabels[name] || name,
        fullName: name,
        population: count,
        color: pieColors[name] || "#999",
        legendFontColor: "#333",
        legendFontSize: 11,
      }))
      .filter(d => d.population > 0);

    // 4. CỘNG ĐỒNG
    const totalReportsAllUsers = allReports.length;
    const totalWasteRecycled = totalReportsAllUsers * 2;

    return {
      personalStats: { reportsSubmitted, totalClassified, pointsEarned, campaignsJoined },
      reportsData: {
        labels,
        datasets: [{
          data: dataPoints.length > 0 ? dataPoints : [0],
          color: () => "#2e7d32",
          strokeWidth: 3
        }]
      },
      wasteClassificationData: { labels: wasteOrder, datasets: [{ data: wasteClassification }] },
      violationTypeData: pieData,
      communityStats: {
        totalReports: totalReportsAllUsers,
        totalPosts: communityPosts?.length || 0,
        totalWasteRecycled,
      },
      chartData: { labels, dataPoints },
      wasteData: wasteOrder.map((name, i) => ({ name, count: wasteClassification[i] })),
    };
  }, [
    userProfile,
    reportHistory,
    communityPosts,
    wasteClassificationHistory,
    allReports,
    selectedPeriod,
  ]);

  // GENERATE HTML CHO PDF
  const generatePDFHTML = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('vi-VN');

    const { personalStats, communityStats, chartData, wasteData, violationTypeData } = analyticsData;
    const periodText = selectedPeriod === "week" ? "tuần" : selectedPeriod === "month" ? "tháng" : "năm";

    const chartRows = chartData.labels.map((label, i) =>
      `<tr><td style="padding:8px;border:1px solid #ddd;">${label}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${chartData.dataPoints[i]}</td></tr>`
    ).join('');

    const wasteRows = wasteData.filter(w => w.count > 0).map(w =>
      `<tr><td style="padding:8px;border:1px solid #ddd;">${w.name}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${w.count}</td></tr>`
    ).join('');

    const violationRows = violationTypeData.map(v =>
      `<tr><td style="padding:8px;border:1px solid #ddd;">${v.fullName}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${v.population}</td></tr>`
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Báo cáo Phân tích</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #2e7d32; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #2e7d32; font-size: 28px; }
          .meta { color: #666; font-size: 14px; }
          .user-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
          .section { margin-bottom: 35px; }
          .section-title { color: #2e7d32; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 15px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .stat-box { background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #2e7d32; }
          .stat-value { font-size: 32px; font-weight: bold; color: #2e7d32; }
          .stat-label { color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #2e7d32; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .highlight { background: #fff9c4; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BÁO CÁO PHÂN TÍCH MÔI TRƯỜNG</h1>
          <div class="meta">
            <p>Ngày xuất: ${dateStr} - ${timeStr}</p>
            <p>Chu kỳ báo cáo: ${periodText}</p>
          </div>
        </div>

        <div class="user-info">
          <h3>Thông tin người dùng</h3>
          <p><strong>Tên:</strong> ${userProfile.displayName || 'Người dùng'}</p>
          <p><strong>Email:</strong> ${userProfile.email || 'Chưa cập nhật'}</p>
          <p><strong>Khu vực:</strong> ${userProfile.defaultRegion || 'Hồ Chí Minh'}</p>
        </div>

        <div class="section">
          <h2 class="section-title">Thống kê cá nhân</h2>
          <div class="stats-grid">
            <div class="stat-box"><div class="stat-value">${personalStats.reportsSubmitted}</div><div class="stat-label">Báo cáo gửi</div></div>
            <div class="stat-box"><div class="stat-value">${personalStats.totalClassified}</div><div class="stat-label">Phân loại rác (AI)</div></div>
            <div class="stat-box"><div class="stat-value">${personalStats.pointsEarned}</div><div class="stat-label">Điểm thưởng</div></div>
            <div class="stat-box"><div class="stat-value">${personalStats.campaignsJoined}</div><div class="stat-label">Chiến dịch tham gia</div></div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Báo cáo theo ${periodText}</h2>
          <table><thead><tr><th>Thời gian</th><th style="text-align:center;">Số báo cáo</th></tr></thead><tbody>${chartRows}</tbody></table>
        </div>

        ${wasteRows ? `<div class="section"><h2 class="section-title">Phân loại rác bằng AI</h2><table><thead><tr><th>Loại rác</th><th style="text-align:center;">Số lần</th></tr></thead><tbody>${wasteRows}</tbody></table></div>` : ''}

        ${violationRows ? `<div class="section"><h2 class="section-title">Loại vi phạm</h2><table><thead><tr><th>Loại vi phạm</th><th style="text-align:center;">Số lần</th></tr></thead><tbody>${violationRows}</tbody></table></div>` : ''}

        <div class="section">
          <h2 class="section-title">Dashboard cộng đồng</h2>
          <div class="highlight">
            <p><strong>Tổng báo cáo:</strong> ${communityStats.totalReports}</p>
            <p><strong>Tổng bài viết:</strong> ${communityStats.totalPosts}</p>
            <p><strong>Rác tái chế:</strong> ${communityStats.totalWasteRecycled} kg</p>
          </div>
        </div>

        <div class="footer">
          <p>Báo cáo được tạo tự động bởi Hệ thống Giám sát Môi trường</p>
          <p>© ${now.getFullYear()} Green App</p>
        </div>
      </body>
      </html>
    `;
  };

  // XUẤT PDF - ĐÃ SỬA HOÀN CHỈNH
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      console.log("Bắt đầu xuất PDF...");

      const html = generatePDFHTML();

      // 1. Tạo file PDF tạm
      const { uri: tempUri } = await Print.printToFileAsync({ html });
      console.log("PDF tạm:", tempUri);

      // 2. Tạo đường dẫn file cuối
      const fileName = `BaoCao_PhanTich_${new Date().toISOString().split('T')[0]}.pdf`;
      const finalUri = `${FileSystem.documentDirectory}${fileName}`;
      console.log("PDF cuối:", finalUri);

      // 3. Copy file (legacy API - ổn định nhất)
      await FileSystem.copyAsync({ from: tempUri, to: finalUri });
      console.log("Đã copy thành công");

      // 4. Xóa file tạm
      await FileSystem.deleteAsync(tempUri, { idempotent: true });

      // 5. Chia sẻ
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(finalUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Chia sẻ báo cáo PDF',
        });
      } else {
        Alert.alert("Thành công", `PDF đã lưu tại:\n${finalUri}`);
      }

    } catch (error) {
      console.error("Lỗi xuất PDF:", error);
      Alert.alert("Lỗi", `Không thể tạo PDF: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phân tích & Báo cáo</Text>
        <TouchableOpacity
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <Ionicons name="hourglass-outline" size={24} color="#999" />
          ) : (
            <Ionicons name="download-outline" size={24} color="#222" />
          )}
        </TouchableOpacity>
      </View>

      <SafeAreaScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Period Filter */}
        <View style={styles.periodContainer}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[styles.periodButton, selectedPeriod === period.id && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text style={[styles.periodText, selectedPeriod === period.id && styles.periodTextActive]}>
                {period.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Personal Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê cá nhân</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="document-text" size={28} color="#2196F3" />
              </View>
              <Text style={styles.statValue}>{analyticsData.personalStats.reportsSubmitted}</Text>
              <Text style={styles.statLabel}>Báo cáo gửi</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="git-branch" size={28} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{analyticsData.personalStats.totalClassified}</Text>
              <Text style={styles.statLabel}>Phân loại rác (AI)</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="trophy" size={28} color="#FF9800" />
              </View>
              <Text style={styles.statValue}>{analyticsData.personalStats.pointsEarned}</Text>
              <Text style={styles.statLabel}>Điểm thưởng</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: "#F3E5F5" }]}>
                <Ionicons name="megaphone" size={28} color="#9C27B0" />
              </View>
              <Text style={styles.statValue}>{analyticsData.personalStats.campaignsJoined}</Text>
              <Text style={styles.statLabel}>Chiến dịch</Text>
            </View>
          </View>
        </View>

        {/* Biểu đồ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Báo cáo theo {selectedPeriod === "week" ? "tuần" : selectedPeriod === "month" ? "tháng" : "năm"}
          </Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={analyticsData.reportsData}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: () => "#2e7d32",
                labelColor: () => "#000",
                propsForDots: { r: "6", strokeWidth: "2", stroke: "#2e7d32" },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </View>

        {analyticsData.personalStats.totalClassified > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phân loại rác bằng AI</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={analyticsData.wasteClassificationData}
                width={screenWidth - 60}
                height={220}
                fromZero
                showValuesOnTopOfBars
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: () => "#2196F3",
                  labelColor: () => "#000",
                }}
                style={styles.chart}
              />
            </View>
          </View>
        )}

        {analyticsData.violationTypeData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loại vi phạm đã báo cáo</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={analyticsData.violationTypeData}
                width={screenWidth - 60}
                height={220}
                chartConfig={{ color: () => "#000" }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dashboard cộng đồng</Text>
          <View style={styles.communityCard}>
            <View style={styles.communityRow}>
              <View style={styles.communityItem}>
                <Ionicons name="flag" size={32} color="#2196F3" />
                <Text style={styles.communityValue}>{analyticsData.communityStats.totalReports}</Text>
                <Text style={styles.communityLabel}>Tổng báo cáo</Text>
              </View>
              <View style={styles.communityItem}>
                <Ionicons name="chatbubbles" size={32} color="#FF9800" />
                <Text style={styles.communityValue}>{analyticsData.communityStats.totalPosts}</Text>
                <Text style={styles.communityLabel}>Tổng bài viết</Text>
              </View>
              <View style={styles.communityItem}>
                <Ionicons name="leaf" size={32} color="#4CAF50" />
                <Text style={styles.communityValue}>{analyticsData.communityStats.totalWasteRecycled} kg</Text>
                <Text style={styles.communityLabel}>Rác tái chế</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.exportPDFButton} onPress={handleExportPDF} disabled={isExporting}>
            <Ionicons name="document-text" size={24} color="#fff" />
            <Text style={styles.exportPDFButtonText}>
              {isExporting ? "Đang xuất..." : "Xuất báo cáo PDF"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </SafeAreaScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#eee", justifyContent: "center", alignItems: "center" },
  exportButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#eee", justifyContent: "center", alignItems: "center" },
  exportButtonDisabled: { opacity: 0.6 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#222", flex: 1, marginLeft: 12 },
  scrollContent: { paddingBottom: 20 },
  periodContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  periodButton: { paddingHorizontal: 25, paddingVertical: 10, borderRadius: 20, backgroundColor: "#f5f5f5", marginHorizontal: 5 },
  periodButtonActive: { backgroundColor: "#2e7d32" },
  periodText: { fontSize: 14, color: "#666", fontWeight: "600" },
  periodTextActive: { color: "#fff" },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 15 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statBox: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statValue: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 5 },
  statLabel: { fontSize: 12, color: "#666", textAlign: "center" },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chart: { marginVertical: 8, borderRadius: 16, paddingRight: 20, marginLeft: 10 },
  communityCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  communityRow: { flexDirection: "row", justifyContent: "space-between" },
  communityItem: { flex: 1, alignItems: "center", marginHorizontal: 5 },
  communityValue: { fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 10, marginBottom: 5 },
  communityLabel: { fontSize: 12, color: "#666", textAlign: "center" },
  exportPDFButton: {
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    padding: 18,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  exportPDFButtonText: { fontSize: 16, fontWeight: "bold", color: "#fff", marginLeft: 10 },
});
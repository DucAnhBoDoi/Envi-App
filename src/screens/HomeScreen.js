// src/screens/HomeScreen.js

import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { UserContext } from "../context/UserContext";
import SafeAreaScrollView from "../components/SafeAreaScrollView";

export default function HomeScreen({ navigation }) {
  const { 
    communityPosts = [], 
    communityGroups = [], 
    userProfile = {},
    reportHistory = [],
  } = useContext(UserContext) || {};

  // ✅ LẤY DỮ LIỆU THỰC TỪ USER
  const reportsSent = reportHistory?.length || 0;
  const members = communityGroups?.reduce((acc, g) => acc + (Number(g?.members) || 0), 0) || 0;
  const userPoints = Number(userProfile?.points || 0);

  // Tạo URL ảnh có timestamp để tránh cache
  const avatarUrl = userProfile?.photoURL
    ? userProfile.photoURL.includes("cloudinary.com")
      ? `${userProfile.photoURL}?v=${Date.now()}`
      : userProfile.photoURL
    : null;

  const features = [
    { id: 1, title: "Thông báo", subtitle: "Chiến dịch & nhắc nhở", icon: "notifications-outline", gradient: ["#667eea", "#764ba2"], screen: "Notifications" },
    { id: 2, title: "Cộng đồng", subtitle: "Chia sẻ & kết nối", icon: "people-outline", gradient: ["#f093fb", "#f5576c"], screen: "Community" },
    { id: 3, title: "Học tập", subtitle: "Kiến thức & quiz", icon: "book-outline", gradient: ["#4facfe", "#00f2fe"], screen: "Learning" },
    { id: 4, title: "Phần thưởng", subtitle: "Điểm & huy hiệu", icon: "trophy-outline", gradient: ["#fa709a", "#fee140"], screen: "Gamification" },
    { id: 5, title: "Bản đồ", subtitle: "Điểm thu gom rác", icon: "map-outline", gradient: ["#30cfd0", "#330867"], screen: "MapScreen" },
    { id: 6, title: "Thống kê", subtitle: "Phân tích & báo cáo", icon: "stats-chart-outline", gradient: ["#a8edea", "#fed6e3"], screen: "Analytics" },
  ];

  // ✅ STATS THỰC TẾ
  const stats = [
    { icon: "document-text-outline", value: reportsSent, label: "Báo cáo của bạn", color: "#4CAF50" },
    { icon: "people-outline", value: members, label: "Thành viên", color: "#2196F3" },
    { icon: "trophy-outline", value: userPoints, label: "Điểm của bạn", color: "#FF9800" },
  ];

  const goToProfile = () => {
    navigation.navigate("MainTabs", { screen: "Tài khoản" });
  };

  return (
    <SafeAreaScrollView>
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#2e7d32", "#43a047", "#66bb6a"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Xin chào!</Text>
            <Text style={styles.title}>Bảo vệ Môi Trường</Text>
            <Text style={styles.subtitle}>
              Cùng nhau xây dựng tương lai xanh
            </Text>
          </View>

          <TouchableOpacity style={styles.profileButton} onPress={goToProfile}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.profileAvatar}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person-circle-outline" size={40} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: stat.color + "20" }]}>
              <Ionicons name={stat.icon} size={28} color={stat.color} />
            </View>
            <Text style={styles.statNumber}>{String(stat.value)}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Feature Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Chức năng</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.featuresContainer}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureCard}
            onPress={() => navigation.navigate(feature.screen)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={feature.gradient}
              style={styles.featureGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={32} color="#fff" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Daily Tip Card */}
      <View style={styles.tipContainer}>
        <View style={styles.tipCard}>
          <View style={styles.tipIconBox}>
            <Ionicons name="bulb" size={28} color="#FFA726" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Mẹo hôm nay</Text>
            <Text style={styles.tipText}>
              Hãy mang túi vải khi đi chợ để giảm thiểu rác thải nhựa! 
              Mỗi hành động nhỏ đều tạo nên sự khác biệt lớn.
            </Text>
          </View>
        </View>
      </View>

      {/* ✅ THÊM: Thông tin tích điểm */}
      <View style={styles.pointsInfoCard}>
        <LinearGradient
          colors={["#FF6B6B", "#FFE66D"]}
          style={styles.pointsGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.pointsHeader}>
            <Ionicons name="flash" size={32} color="#fff" />
            <Text style={styles.pointsTitle}>Cách tích điểm</Text>
          </View>
          <View style={styles.pointsList}>
            <View style={styles.pointsItem}>
              <Text style={styles.pointsBullet}>•</Text>
              <Text style={styles.pointsItemText}>Báo cáo vi phạm: +15 điểm</Text>
            </View>
            <View style={styles.pointsItem}>
              <Text style={styles.pointsBullet}>•</Text>
              <Text style={styles.pointsItemText}>Phân loại rác AI: +5 điểm</Text>
            </View>
            <View style={styles.pointsItem}>
              <Text style={styles.pointsBullet}>•</Text>
              <Text style={styles.pointsItemText}>Tham gia chiến dịch: +10 điểm</Text>
            </View>
            <View style={styles.pointsItem}>
              <Text style={styles.pointsBullet}>•</Text>
              <Text style={styles.pointsItemText}>Đăng bài: +8 điểm, Bình luận: +3 điểm</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.pointsButton}
            onPress={() => navigation.navigate("Gamification")}
          >
            <Text style={styles.pointsButtonText}>Xem phần thưởng</Text>
            <Ionicons name="arrow-forward" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View style={{ height: 20 }} />
    </SafeAreaScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 8,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  seeAll: {
    fontSize: 14,
    color: "#2e7d32",
    fontWeight: "600",
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 12,
  },
  featureCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  featureGradient: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },
  featureSubtitle: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
  },
  tipContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#fff8e1",
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 6,
    borderLeftColor: "#FFA726",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 167, 38, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: "#5D4037",
    lineHeight: 20,
  },
  pointsInfoCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  pointsGradient: {
    padding: 24,
  },
  pointsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  pointsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 12,
  },
  pointsList: {
    marginBottom: 16,
  },
  pointsItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  pointsBullet: {
    fontSize: 18,
    color: "#fff",
    marginRight: 8,
    fontWeight: "bold",
  },
  pointsItemText: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  pointsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  pointsButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginRight: 8,
  },
});
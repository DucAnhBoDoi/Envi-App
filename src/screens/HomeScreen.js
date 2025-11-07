// src/screens/HomeScreen.js
import React, { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../context/UserContext";

export default function HomeScreen({ navigation }) {
  const { communityPosts = [], communityGroups = [], userProfile } = useContext(UserContext);

  const reportsSent = communityPosts.length;
  const members = communityGroups.reduce((acc, g) => acc + (g.members || 0), 0) || 0;
  const userPoints = userProfile?.points || 0;

  const features = [
    { id: 1, title: "Thông báo", subtitle: "Chiến dịch & nhắc nhở", icon: "notifications", color: "#4CAF50", screen: "Notifications" },
    { id: 2, title: "Cộng đồng", subtitle: "Chia sẻ & kết nối", icon: "people", color: "#03A9F4", screen: "Community" },
    { id: 3, title: "Học tập", subtitle: "Kiến thức & quiz", icon: "school", color: "#FFC107", screen: "Learning" },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌍 Bảo vệ Môi Trường</Text>
        <Text style={styles.subtitle}>Cùng nhau xây dựng môi trường xanh sạch đẹp</Text>
      </View>

      {/* Feature Grid */}
      <View style={styles.featuresContainer}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={[styles.featureCard, { backgroundColor: feature.color }]}
            onPress={() => navigation.navigate(feature.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={feature.icon} size={40} color="#fff" />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="leaf" size={24} color="#2e7d32" />
          <Text style={styles.statNumber}>{reportsSent}</Text>
          <Text style={styles.statLabel}>Bài viết</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#2e7d32" />
          <Text style={styles.statNumber}>{members}</Text>
          <Text style={styles.statLabel}>Thành viên</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={24} color="#2e7d32" />
          <Text style={styles.statNumber}>{userPoints}</Text>
          <Text style={styles.statLabel}>Điểm của bạn</Text>
        </View>
      </View>

      {/* Daily Tip */}
      <View style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Ionicons name="bulb" size={24} color="#FFA726" />
          <Text style={styles.tipTitle}>Mẹo hôm nay</Text>
        </View>
        <Text style={styles.tipText}>💚 Hãy mang túi vải khi đi chợ để giảm thiểu rác thải nhựa!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "#2e7d32", padding: 30, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#e8f5e9" },
  featuresContainer: { flexDirection: "row", flexWrap: "wrap", padding: 15, justifyContent: "space-between" },
  featureCard: { width: "48%", aspectRatio: 1, borderRadius: 20, padding: 20, marginBottom: 15, justifyContent: "center", alignItems: "center", elevation: 5 },
  iconContainer: { marginBottom: 10 },
  featureTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginTop: 10 },
  featureSubtitle: { fontSize: 12, color: "#fff", opacity: 0.9, marginTop: 5, textAlign: "center" },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", padding: 15, paddingTop: 5 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 15, padding: 15, marginHorizontal: 5, alignItems: "center", elevation: 3 },
  statNumber: { fontSize: 24, fontWeight: "bold", color: "#2e7d32", marginTop: 8 },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4, textAlign: "center" },
  tipCard: { backgroundColor: "#fff3e0", margin: 15, marginTop: 10, padding: 20, borderRadius: 15, borderLeftWidth: 4, borderLeftColor: "#FFA726" },
  tipHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  tipTitle: { fontSize: 18, fontWeight: "bold", color: "#F57C00", marginLeft: 10 },
  tipText: { fontSize: 15, color: "#5D4037", lineHeight: 22 },
});

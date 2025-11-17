// src/screens/GamificationScreen.js
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { UserContext } from "../context/UserContext";
import SafeAreaScrollView from "../components/SafeAreaScrollView";

export default function GamificationScreen({ navigation }) {
  const { userProfile = {}, updateUserProfile } = useContext(UserContext) || {};
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ LẤY DỮ LIỆU THỰC TỪ USERPROFILE
  const userPoints = Number(userProfile?.points || 0);
  const userReports = Number(userProfile?.reportHistory?.length || 0);
  const userWasteClassified = Number(userProfile?.wasteClassified || 0);
  const userCampaigns = Number(userProfile?.campaignsJoined || 0);
  
  const userLevel = Math.floor(userPoints / 100) + 1;
  const progress = (userPoints % 100);

  // ✅ HUY HIỆU VỚI ĐIỀU KIỆN THỰC
  const badges = [
    { 
      id: 1, 
      name: "Người xanh", 
      icon: "leaf", 
      color: "#4CAF50", 
      requirement: 50, 
      earned: userPoints >= 50, 
      description: "Đạt 50 điểm",
      type: "points"
    },
    { 
      id: 2, 
      name: "Chiến binh môi trường", 
      icon: "shield-checkmark", 
      color: "#2196F3", 
      requirement: 200, 
      earned: userPoints >= 200, 
      description: "Đạt 200 điểm",
      type: "points"
    },
    { 
      id: 3, 
      name: "Thành phố sạch", 
      icon: "trophy", 
      color: "#FF9800", 
      requirement: 500, 
      earned: userPoints >= 500, 
      description: "Đạt 500 điểm",
      type: "points"
    },
    { 
      id: 4, 
      name: "Người báo cáo", 
      icon: "megaphone", 
      color: "#9C27B0", 
      requirement: 10, 
      earned: userReports >= 10, 
      description: "Báo cáo 10 vi phạm",
      type: "reports"
    },
    { 
      id: 5, 
      name: "Thợ phân loại", 
      icon: "git-branch", 
      color: "#00BCD4", 
      requirement: 20, 
      earned: userWasteClassified >= 20, 
      description: "Phân loại 20 lần bằng AI",
      type: "classification"
    },
    { 
      id: 6, 
      name: "Người dẫn đầu", 
      icon: "rocket", 
      color: "#F44336", 
      requirement: 1000, 
      earned: userPoints >= 1000, 
      description: "Đạt 1000 điểm",
      type: "points"
    },
    { 
      id: 7, 
      name: "Nhà hoạt động", 
      icon: "people", 
      color: "#E91E63", 
      requirement: 5, 
      earned: userCampaigns >= 5, 
      description: "Tham gia 5 chiến dịch",
      type: "campaigns"
    },
    { 
      id: 8, 
      name: "Siêu sao xanh", 
      icon: "star", 
      color: "#FFD700", 
      requirement: 2000, 
      earned: userPoints >= 2000, 
      description: "Đạt 2000 điểm",
      type: "points"
    },
  ];

  // ✅ QUÀ TẶNG - CHỈ ĐỔI ĐƯỢC KHI ĐỦ ĐIỂM
  const rewards = [
    { 
      id: 1, 
      name: "Voucher 50K", 
      icon: "gift", 
      points: 100, 
      color: "#E91E63", 
      description: "Phiếu giảm giá 50.000đ", 
      stock: 10 
    },
    { 
      id: 2, 
      name: "Cây xanh", 
      icon: "flower", 
      points: 150, 
      color: "#4CAF50", 
      description: "1 cây xanh giống bản địa", 
      stock: 5 
    },
    { 
      id: 3, 
      name: "Túi vải canvas", 
      icon: "bag-handle", 
      points: 80, 
      color: "#FF9800", 
      description: "Túi vải thân thiện môi trường", 
      stock: 15 
    },
    { 
      id: 4, 
      name: "Bình nước inox", 
      icon: "water", 
      points: 200, 
      color: "#2196F3", 
      description: "Bình giữ nhiệt 500ml", 
      stock: 8 
    },
    { 
      id: 5, 
      name: "Sách môi trường", 
      icon: "book", 
      points: 120, 
      color: "#9C27B0", 
      description: "Sách kiến thức bảo vệ môi trường", 
      stock: 12 
    },
    { 
      id: 6, 
      name: "Vé workshop", 
      icon: "calendar", 
      points: 250, 
      color: "#FF5722", 
      description: "Vé tham dự workshop môi trường", 
      stock: 6 
    },
  ];

  const handleRedeemReward = (reward) => {
    if (userPoints >= reward.points) {
      setSelectedReward(reward);
      setModalVisible(true);
    } else {
      Alert.alert(
        "Không đủ điểm",
        `Bạn cần thêm ${reward.points - userPoints} điểm để đổi quà này.`
      );
    }
  };

  const confirmRedeem = async () => {
    setModalVisible(false);
    
    // ✅ TRỪ ĐIỂM KHI ĐỔI QUÀ
    const newPoints = userPoints - selectedReward.points;
    await updateUserProfile({ points: newPoints });
    
    Alert.alert(
      "Đổi quà thành công! 🎉",
      `Bạn đã đổi ${selectedReward.name}. Còn lại ${newPoints} điểm.`,
      [{ text: "OK" }]
    );
  };

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phần thưởng & Huy hiệu</Text>
        <View style={{ width: 40 }} />
      </View>

      <SafeAreaScrollView showsVerticalScrollIndicator={false}>
        {/* Level Card */}
        <View style={styles.section}>
          <View style={styles.levelCard}>
            <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.levelGradient}>
              <View style={styles.levelHeader}>
                <View>
                  <Text style={styles.levelLabel}>Cấp độ</Text>
                  <Text style={styles.levelNumber}>{userLevel}</Text>
                </View>
                <Ionicons name="trophy" size={50} color="#FFD700" />
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {100 - progress} điểm để lên cấp {userLevel + 1}
                </Text>
              </View>
              <Text style={styles.pointsText}>{userPoints} điểm tích lũy</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Huy hiệu đã mở khóa */}
        {earnedBadges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medal" size={28} color="#FFD700" />
              <Text style={styles.sectionTitle}>Huy hiệu đã đạt ({earnedBadges.length})</Text>
            </View>
            <View style={styles.badgesGrid}>
              {earnedBadges.map((badge) => (
                <View key={badge.id} style={styles.badgeCard}>
                  <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
                    <Ionicons name={badge.icon} size={32} color="#fff" />
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                  <View style={styles.earnedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.earnedText}>Đã mở khóa</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Huy hiệu chưa mở khóa */}
        {lockedBadges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed-outline" size={28} color="#999" />
              <Text style={styles.sectionTitle}>Huy hiệu chưa mở khóa ({lockedBadges.length})</Text>
            </View>
            <View style={styles.badgesGrid}>
              {lockedBadges.map((badge) => (
                <View key={badge.id} style={[styles.badgeCard, styles.badgeLocked]}>
                  <View style={[styles.badgeIcon, { backgroundColor: "#e0e0e0" }]}>
                    <Ionicons name={badge.icon} size={32} color="#999" />
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={18} color="#999" />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Đổi quà */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="gift-outline" size={28} color="#E91E63" />
            <Text style={styles.sectionTitle}>Đổi quà tặng</Text>
          </View>
          <View style={styles.rewardsGrid}>
            {rewards.map((reward) => {
              const canRedeem = userPoints >= reward.points;
              return (
                <TouchableOpacity
                  key={reward.id}
                  style={[styles.rewardCard, !canRedeem && styles.rewardDisabled]}
                  onPress={() => handleRedeemReward(reward)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.rewardIcon, { backgroundColor: reward.color + "20" }]}>
                    <Ionicons name={reward.icon} size={32} color={canRedeem ? reward.color : "#ccc"} />
                  </View>
                  <Text style={[styles.rewardName, !canRedeem && { color: "#999" }]}>
                    {reward.name}
                  </Text>
                  <Text style={styles.rewardDesc}>{reward.description}</Text>
                  <View style={styles.rewardFooter}>
                    <Text style={[styles.pointsTextSmall, !canRedeem && { color: "#999" }]}>
                      {reward.points} điểm
                    </Text>
                    <Text style={styles.stockText}>Còn {reward.stock}</Text>
                  </View>
                  {!canRedeem && (
                    <View style={styles.lockOverlay}>
                      <Ionicons name="lock-closed" size={20} color="#ccc" />
                      <Text style={styles.needMoreText}>
                        Cần {reward.points - userPoints} điểm
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb" size={30} color="#FFA726" />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.tipsTitle}>Mẹo tích điểm nhanh</Text>
            <Text style={styles.tipsText}>
              • Báo cáo vi phạm: +15 điểm{'\n'}
              • Phân loại rác bằng AI: +5 điểm{'\n'}
              • Tham gia chiến dịch: +10 điểm{'\n'}
              • Đăng bài cộng đồng: +8 điểm{'\n'}
              • Bình luận: +3 điểm, Like: +1 điểm
            </Text>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </SafeAreaScrollView>

      {/* Modal xác nhận */}
      <Modal 
        animationType="fade" 
        transparent={true} 
        visible={modalVisible} 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIcon, { backgroundColor: selectedReward?.color + "20" }]}>
              <Ionicons name={selectedReward?.icon} size={50} color={selectedReward?.color} />
            </View>
            <Text style={styles.modalTitle}>Xác nhận đổi quà</Text>
            <Text style={styles.modalDesc}>
              Đổi {selectedReward?.points} điểm lấy{" "}
              <Text style={{ fontWeight: "bold" }}>{selectedReward?.name}</Text>?
            </Text>
            <Text style={styles.modalSubDesc}>
              Sau khi đổi, bạn còn lại {userPoints - (selectedReward?.points || 0)} điểm.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalBtnCancel} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmRedeem}>
                <Text style={styles.modalBtnTextConfirm}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
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
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginLeft: 10,
  },
  levelCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  levelGradient: {
    padding: 20,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  levelNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
    marginTop: 6,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFD700",
    textAlign: "center",
    marginTop: 8,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  badgeCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    position: "relative",
  },
  badgeLocked: {
    opacity: 0.6,
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
  },
  badgeDesc: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  earnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  earnedText: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "600",
    marginLeft: 4,
  },
  rewardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  rewardCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    position: "relative",
  },
  rewardDisabled: {
    opacity: 0.5,
  },
  rewardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  rewardDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  rewardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  pointsTextSmall: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF9800",
  },
  stockText: {
    fontSize: 12,
    color: "#999",
  },
  lockOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 6,
    alignItems: "center",
  },
  needMoreText: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  tipsCard: {
    flexDirection: "row",
    backgroundColor: "#fff8e1",
    margin: 16,
    marginTop: 15,
    padding: 20,
    borderRadius: 18,
    borderLeftWidth: 6,
    borderLeftColor: "#FFB300",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  tipsTitle: {
    fontWeight: "700",
    color: "#E65100",
    marginBottom: 8,
    fontSize: 15,
  },
  tipsText: {
    fontSize: 13,
    color: "#5D4037",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    width: "85%",
    alignItems: "center",
  },
  modalIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubDesc: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 14,
    borderRadius: 12,
  },
  modalBtnTextCancel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  modalBtnConfirm: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
  },
  modalBtnTextConfirm: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});
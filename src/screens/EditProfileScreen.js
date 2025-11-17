// src/screens/EditProfileScreen.js
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ THÊM
import * as ImagePicker from "expo-image-picker";
import { UserContext } from "../context/UserContext";
import { AuthContext } from "../context/AuthContext";
import SafeAreaScrollView from "../components/SafeAreaScrollView";

const REGIONS = [
  "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "An Giang",
  "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre",
  "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng",
  "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang",
  "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa",
  "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An",
  "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
  "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La",
  "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang",
  "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
];

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets(); // ✅ THÊM hook này
  const { userProfile, updateUserProfile, uploadToCloudinary } = useContext(UserContext);
  const { guestMode } = useContext(AuthContext);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [defaultRegion, setDefaultRegion] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    setDisplayName(userProfile?.displayName || "");
    setPhone(userProfile?.phone || "");
    setAddress(userProfile?.address || "");
    setDefaultRegion(userProfile?.defaultRegion || "Hồ Chí Minh");
    setBio(userProfile?.bio || "");
    setPhotoURL(userProfile?.photoURL || "");
  }, [userProfile]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Cần quyền", "Vui lòng cấp quyền truy cập thư viện ảnh");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        const localUri = result.assets[0].uri;
        setPhotoURL(localUri);
        setUploadingAvatar(true);

        try {
          const cloudinaryUrl = await uploadToCloudinary(localUri, "image");
          if (cloudinaryUrl?.includes("cloudinary.com")) {
            setPhotoURL(cloudinaryUrl);
            Alert.alert("Thành công", "Ảnh đại diện đã được upload!");
          } else {
            throw new Error("URL không hợp lệ");
          }
        } catch (error) {
          Alert.alert("Lỗi", "Không thể upload ảnh. Vui lòng thử lại.");
          setPhotoURL(userProfile?.photoURL || "");
        } finally {
          setUploadingAvatar(false);
        }
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên hiển thị");
      return;
    }

    if (photoURL && !photoURL.includes("cloudinary.com") && photoURL.includes("file://")) {
      Alert.alert(
        "Cảnh báo",
        "Ảnh chưa được upload. Bạn có muốn tiếp tục không?",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Tiếp tục", onPress: saveProfile },
        ]
      );
      return;
    }

    await saveProfile();
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const result = await updateUserProfile({
        displayName: displayName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        defaultRegion,
        bio: bio.trim(),
        photoURL,
      });

      setLoading(false);
      if (result?.success) {
        Alert.alert("Thành công", "Hồ sơ đã được cập nhật!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Lỗi", result?.error || "Không thể cập nhật hồ sơ");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi lưu hồ sơ");
    }
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Đang lưu thay đổi...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* ✅ HEADER - Dùng dynamic paddingTop */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* NỘI DUNG */}
      <SafeAreaScrollView contentContainerStyle={styles.scrollContent}>
        {/* Ảnh đại diện */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8} disabled={uploadingAvatar}>
            {photoURL ? (
              <View>
                <Image source={{ uri: photoURL }} style={styles.avatar} />
                {uploadingAvatar && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={60} color="#fff" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </View>
          </TouchableOpacity>

          {uploadingAvatar && (
            <Text style={styles.uploadingText}>Đang upload ảnh...</Text>
          )}

          {photoURL?.includes("cloudinary.com") && (
            <View style={styles.uploadSuccessBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.uploadSuccessText}>Đã lưu trên cloud</Text>
            </View>
          )}
        </View>

        {/* Thông tin cơ bản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <Input label="Tên hiển thị *" value={displayName} onChangeText={setDisplayName} placeholder="Nhập tên của bạn" />
          <Input label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="Nhập số điện thoại" keyboardType="phone-pad" />
          <Input label="Giới thiệu" value={bio} onChangeText={setBio} multiline placeholder="Viết vài dòng về bạn..." />
        </View>

        {/* Địa chỉ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>

          <Text style={styles.label}>Khu vực mặc định *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowRegionPicker(!showRegionPicker)}
          >
            <Text style={styles.pickerButtonText}>{defaultRegion}</Text>
            <Ionicons name={showRegionPicker ? "chevron-up" : "chevron-down"} size={22} color="#444" />
          </TouchableOpacity>

          {showRegionPicker && (
            <ScrollView style={styles.regionList} nestedScrollEnabled>
              {REGIONS.map((region) => (
                <TouchableOpacity
                  key={region}
                  style={[styles.regionItem, defaultRegion === region && styles.regionItemSelected]}
                  onPress={() => {
                    setDefaultRegion(region);
                    setShowRegionPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.regionItemText,
                      defaultRegion === region && styles.regionItemTextSelected,
                    ]}
                  >
                    {region}
                  </Text>
                  {defaultRegion === region && (
                    <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Input
            label="Địa chỉ chi tiết"
            value={address}
            onChangeText={setAddress}
            placeholder="Số nhà, đường, phường/xã..."
            multiline
          />
        </View>

        {/* Nút lưu */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSave}
          style={styles.saveButton}
          disabled={uploadingAvatar}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </SafeAreaScrollView>
    </View>
  );
}

/* INPUT COMPONENT */
const Input = ({ label, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...props}
      style={[styles.input, props.multiline && styles.textArea]}
      placeholderTextColor="#aaa"
    />
  </View>
);

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  // ✅ HEADER - BỎ paddingTop cứng
  header: {
    flexDirection: "row",
    alignItems: "center",
    // ❌ REMOVED: paddingTop: 50,
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

  scrollContent: {
    paddingBottom: 20,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },

  // AVATAR
  avatarSection: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
    borderWidth: 3,
    borderColor: "#2e7d32",
  },
  avatarPlaceholder: {
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2e7d32",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 12,
  },
  uploadSuccessBadge: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  uploadSuccessText: {
    marginLeft: 4,
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
  },

  // SECTION
  section: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#fafafa",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  // REGION PICKER
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fafafa",
    marginBottom: 10,
  },
  pickerButtonText: {
    fontSize: 15,
    color: "#333",
  },
  regionList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  regionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  regionItemSelected: {
    backgroundColor: "#E8F5E9",
  },
  regionItemText: {
    fontSize: 15,
    color: "#333",
  },
  regionItemTextSelected: {
    fontWeight: "600",
    color: "#2e7d32",
  },

  // BUTTONS
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  cancelButton: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { UserContext } from "../context/UserContext";
import { AuthContext } from "../context/AuthContext";

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
  const { userProfile, updateUserProfile } = useContext(UserContext);
  const { guestMode } = useContext(AuthContext);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [defaultRegion, setDefaultRegion] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  useEffect(() => {
    setDisplayName(userProfile.displayName || "");
    setPhone(userProfile.phone || "");
    setAddress(userProfile.address || "");
    setDefaultRegion(userProfile.defaultRegion || "Hồ Chí Minh");
    setBio(userProfile.bio || "");
    setPhotoURL(userProfile.photoURL || "");
  }, [userProfile]);

  // Chọn ảnh
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Cần quyền truy cập", "Vui lòng cấp quyền truy cập thư viện ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoURL(result.assets[0].uri);
    }
  };

  // Lưu thay đổi
  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên hiển thị");
      return;
    }

    setLoading(true);
    const result = await updateUserProfile({
      displayName: displayName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      defaultRegion,
      bio: bio.trim(),
      photoURL,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert("Thành công", "Hồ sơ đã được cập nhật!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert("Lỗi", result.error || "Không thể cập nhật hồ sơ");
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Đang lưu thay đổi...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Ảnh đại diện */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={60} color="#fff" />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
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
          <Ionicons
            name={showRegionPicker ? "chevron-up" : "chevron-down"}
            size={22}
            color="#444"
          />
        </TouchableOpacity>

        {showRegionPicker && (
          <ScrollView style={styles.regionList} nestedScrollEnabled>
            {REGIONS.map((region) => (
              <TouchableOpacity
                key={region}
                style={[
                  styles.regionItem,
                  defaultRegion === region && styles.regionItemSelected,
                ]}
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
      <TouchableOpacity activeOpacity={0.8} onPress={handleSave} style={styles.saveButton}>
        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
        <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
        <Text style={styles.cancelButtonText}>Hủy</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* COMPONENT PHỤ */
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7f5" },

  avatarSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#ccc",
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#a5d6a7",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 10,
    backgroundColor: "#2e7d32",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },

  section: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 16, // ✅ chỉ bo góc, không đổ bóng
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 15,
  },

  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: "#555", fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#333",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },

  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  pickerButtonText: { fontSize: 16, color: "#333" },

  regionList: {
    maxHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  regionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  regionItemSelected: { backgroundColor: "#e8f5e9" },
  regionItemText: { fontSize: 15, color: "#333" },
  regionItemTextSelected: { color: "#2e7d32", fontWeight: "700" },

  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 8 },

  cancelButton: {
    alignItems: "center",
    marginTop: 15,
  },
  cancelButtonText: { color: "#555", fontSize: 16, fontWeight: "500" },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#2e7d32" },
});

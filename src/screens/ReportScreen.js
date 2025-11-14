// src/screens/ReportScreen.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { UserContext } from "../context/UserContext";
import SafeAreaScrollView from "../components/SafeAreaScrollView";


// Danh mục vi phạm
const VIOLATION_CATEGORIES = [
  {
    id: "1",
    name: "Đổ rác bừa bãi",
    icon: "trash-outline",
    color: "#E53935",
  },
  {
    id: "2",
    name: "Ô nhiễm nước",
    icon: "water-outline",
    color: "#1E88E5",
  },
  {
    id: "3",
    name: "Đốt rác",
    icon: "flame-outline",
    color: "#FF6F00",
  },
  {
    id: "4",
    name: "Khói bụi công nghiệp",
    icon: "business-outline",
    color: "#757575",
  },
  {
    id: "5",
    name: "Chặt phá cây xanh",
    icon: "leaf-outline",
    color: "#43A047",
  },
  {
    id: "6",
    name: "Khác",
    icon: "ellipsis-horizontal-outline",
    color: "#5E35B1",
  },
];

export default function ReportScreen({ navigation }) {
  const { addReportToHistory } = useContext(UserContext);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Lấy địa chỉ từ Nominatim (OpenStreetMap)
  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=vi`,
        {
          headers: {
            "User-Agent": "envi-app/1.0 (https://example.com)", // bắt buộc có
            "Accept-Language": "vi",
          },
        }
      );

      // Nếu không phải JSON thì báo lỗi
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data && data.display_name) {
          return data.display_name;
        } else {
          return "Không xác định được địa chỉ";
        }
      } catch (jsonError) {
        console.error("Phản hồi không phải JSON:", text.slice(0, 200));
        return "Không thể lấy địa chỉ (phản hồi không hợp lệ)";
      }
    } catch (error) {
      console.error("Lỗi khi lấy địa chỉ từ Nominatim:", error);
      return "Không thể lấy địa chỉ (lỗi mạng)";
    }
  };


  // Lấy vị trí hiện tại
  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập vị trí",
          "Vui lòng cấp quyền để lấy vị trí hiện tại"
        );
        setLoadingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      setLocation({ latitude, longitude });
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Lấy địa chỉ từ tọa độ
      const fullAddress = await getAddressFromCoords(latitude, longitude);
      setAddress(fullAddress);

    } catch (error) {
      console.error("Lỗi lấy vị trí:", error);
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại");
    } finally {
      setLoadingLocation(false);
    }
  };

  // Chọn vị trí trên bản đồ
  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedMapLocation({ latitude, longitude });

    try {
      const fullAddress = await getAddressFromCoords(latitude, longitude);
      setAddress(fullAddress);
    } catch (error) {
      console.error("Lỗi lấy địa chỉ:", error);
    }
  };

  // Xác nhận vị trí từ bản đồ
  const confirmMapLocation = () => {
    if (selectedMapLocation) {
      setLocation(selectedMapLocation);
      setShowMap(false);
      Alert.alert("Thành công", "Đã cập nhật vị trí từ bản đồ");
    }
  };

  // Chụp ảnh
  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert("Giới hạn", "Chỉ có thể tải lên tối đa 5 ảnh");
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setImages([...images, result.assets[0].uri]);
      }
    }
  };

  // Chọn ảnh từ thư viện
  const pickImages = async () => {
    if (images.length >= 5) {
      Alert.alert("Giới hạn", "Chỉ có thể tải lên tối đa 5 ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      const totalImages = [...images, ...newImages].slice(0, 5);
      setImages(totalImages);
    }
  };

  // Xóa ảnh
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  // Gửi báo cáo
  const submitReport = () => {
    if (!selectedCategory) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn loại vi phạm");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập mô tả vi phạm");
      return;
    }

    if (description.trim().length > 500) {
      Alert.alert("Mô tả quá dài", "Vui lòng nhập mô tả không quá 500 ký tự");
      return;
    }

    if (!location) {
      Alert.alert("Thiếu thông tin", "Vui lòng cập nhật vị trí");
      return;
    }

    if (images.length === 0) {
      Alert.alert(
        "Xác nhận",
        "Bạn chưa tải lên hình ảnh. Có chắc muốn gửi không?",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Gửi", onPress: sendReport },
        ]
      );
    } else {
      sendReport();
    }
  };

  const sendReport = async () => {
    const category = VIOLATION_CATEGORIES.find((c) => c.id === selectedCategory);

    const report = {
      category: category.name,
      categoryColor: category.color,
      categoryIcon: category.icon,
      description: description.trim(),
      images,
      location: address,
      coordinates: location,
      status: "pending", // pending, processing, completed
    };

    const result = await addReportToHistory(report);

    if (result.success) {
      Alert.alert(
        "Thành công",
        "Báo cáo đã được gửi thành công. Chúng tôi sẽ xử lý trong thời gian sớm nhất.",
        [
          {
            text: "Xem lịch sử",
            onPress: () => navigation.navigate("ReportHistory"),
          },
          { text: "OK" },
        ]
      );

      // Reset form
      setSelectedCategory(null);
      setDescription("");
      setImages([]);
      getCurrentLocation();
    } else {
      Alert.alert("❌ Lỗi", "Không thể gửi báo cáo. Vui lòng thử lại.");
    }
  };

return (
  <>
    <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

    {showMap ? (
      /* ==================== BẢN ĐỒ TOÀN MÀN HÌNH ==================== */
      <View style={styles.mapContainer}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          region={mapRegion}
          onPress={handleMapPress}
        >
          {selectedMapLocation && <Marker coordinate={selectedMapLocation} />}
        </MapView>

        <View style={styles.mapButtons}>
          <TouchableOpacity
            style={[styles.mapButton, styles.mapButtonCancel]}
            onPress={() => setShowMap(false)}
          >
            <Text style={styles.mapButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapButton, styles.mapButtonConfirm]}
            onPress={confirmMapLocation}
          >
            <Text style={styles.mapButtonText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : (
      /* ==================== FORM BÁO CÁO – CUỘN ĐẸP ==================== */
      <SafeAreaScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER – CHUẨN 56PX */}
        <View style={styles.header}>
          <Ionicons name="alert-circle" size={32} color="#E53935" />
          <Text style={styles.headerText}>Báo cáo vi phạm môi trường</Text>
        </View>

        {/* 1. LOẠI VI PHẠM */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.required}>* </Text>
            Loại vi phạm
          </Text>
          <View style={styles.categoriesGrid}>
            {VIOLATION_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  { borderColor: category.color },
                  selectedCategory === category.id && {
                    backgroundColor: category.color + "15",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons name={category.icon} size={28} color={category.color} />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && {
                      fontWeight: "bold",
                      color: category.color,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. MÔ TẢ CHI TIẾT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.required}>* </Text>
            Mô tả chi tiết
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Mô tả chi tiết về vi phạm (thời gian, mức độ, hậu quả...)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={[styles.charCount, description.length > 450 && { color: "#E53935" }]}>
            {description.length} / 500 ký tự
          </Text>
        </View>

        {/* 3. TẢI ẢNH */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Hình ảnh minh chứng ({images.length}/5)
          </Text>
          <Text style={styles.sectionDesc}>
            Tải lên ảnh hoặc video để minh chứng vi phạm
          </Text>

          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={[styles.imageButton, images.length >= 5 && styles.imageButtonDisabled]}
              onPress={takePhoto}
              disabled={images.length >= 5}
            >
              <Ionicons name="camera-outline" size={24} color={images.length >= 5 ? "#999" : "#2e7d32"} />
              <Text style={[styles.imageButtonText, images.length >= 5 && styles.imageButtonTextDisabled]}>
                Chụp ảnh
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imageButton, images.length >= 5 && styles.imageButtonDisabled]}
              onPress={pickImages}
              disabled={images.length >= 5}
            >
              <Ionicons name="image-outline" size={24} color={images.length >= 5 ? "#999" : "#2e7d32"} />
              <Text style={[styles.imageButtonText, images.length >= 5 && styles.imageButtonTextDisabled]}>
                Chọn từ thư viện
              </Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesPreview}
            >
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#E53935" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 4. VỊ TRÍ VI PHẠM */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.required}>* </Text>
            Vị trí vi phạm
          </Text>

          {loadingLocation ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2e7d32" />
              <Text style={styles.loadingText}>Đang lấy vị trí...</Text>
            </View>
          ) : (
            <>
              {location && (
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={20} color="#2e7d32" />
                  <Text style={styles.locationText}>
                    {address || "Đang xác định địa chỉ..."}
                  </Text>
                </View>
              )}

              <View style={styles.locationButtons}>
                <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
                  <Ionicons name="navigate" size={20} color="#2e7d32" />
                  <Text style={styles.locationButtonText}>Vị trí hiện tại</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.locationButton} onPress={() => setShowMap(true)}>
                  <Ionicons name="map" size={20} color="#2e7d32" />
                  <Text style={styles.locationButtonText}>Chọn trên bản đồ</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* 5. LƯU Ý */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Lưu ý khi báo cáo</Text>
          <Text style={styles.tipsText}>
            • Cung cấp thông tin chính xác và trung thực{"\n"}
            • Tải lên hình ảnh rõ ràng, không chỉnh sửa{"\n"}
            • Mô tả chi tiết để xử lý nhanh chóng{"\n"}
            • Báo cáo sẽ được xem xét trong 24-48 giờ
          </Text>
        </View>

        {/* KHOẢNG CÁCH ĐẸP GIỮA LƯU Ý VÀ NÚT GỬI */}
        <View style={{ height: 10 }} />

        {/* NÚT GỬI BÁO CÁO – CUỘN THEO, ĐẸP RIÊNG, KHÔNG DÍNH LƯU Ý */}
        <View style={styles.submitWrapper}>
          <TouchableOpacity style={styles.submitButton} onPress={submitReport}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
          </TouchableOpacity>
        </View>

        {/* ĐỆM CUỐI ĐỂ KHÔNG BỊ CHE TAB BAR */}
        <View style={{ height: 10 }} />
      </SafeAreaScrollView>
    )}
  </>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: StatusBar.currentHeight || 40,
  },
  scroll: { flex: 1 },
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginTop: StatusBar.currentHeight || 0,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  required: {
    color: "#E53935",
  },
  sectionDesc: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },

  // Categories
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    width: "31%",
    aspectRatio: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
  },

  // Description
  textArea: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f9f9f9",
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 6,
  },

  // Images
  imageButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  imageButtonDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  imageButtonText: {
    marginLeft: 8,
    color: "#2e7d32",
    fontWeight: "600",
    fontSize: 13,
  },
  imageButtonTextDisabled: {
    color: "#999",
  },
  imagesPreview: {
    marginTop: 12,
  },
  imagePreviewContainer: {
    position: "relative",
    marginRight: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },

  // Location
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  locationButtons: {
    flexDirection: "row",
    gap: 10,
  },
  locationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  locationButtonText: {
    marginLeft: 8,
    color: "#2e7d32",
    fontWeight: "600",
    fontSize: 13,
  },

  // Map
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapButtons: {
    position: "absolute",
    bottom: 30,
    left: 15,
    right: 15,
    flexDirection: "row",
    gap: 10,
  },
  mapButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  mapButtonCancel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  mapButtonConfirm: {
    backgroundColor: "#2e7d32",
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  // Tips
  tipsCard: {
    backgroundColor: "#fff3e0",
    marginHorizontal: 15,
    marginTop: 15,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffe0b2",
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 13,
    color: "#BF360C",
    lineHeight: 22,
  },

  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E53935",
    padding: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitWrapper: {
  marginHorizontal: 15,
  padding: 16,
  borderRadius: 16,
  alignItems: "center",
},
});
// src/screens/WasteGuideScreen.js
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
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { IMAGGA_API_KEY, IMAGGA_API_SECRET } from "@env";
import SafeAreaScrollView from "../components/SafeAreaScrollView";
import { UserContext } from "../context/UserContext";

const WASTE_TYPES = [
  {
    type: "Hữu cơ",
    icon: "leaf-outline",
    color: "#4CAF50",
    description: "Rác thực phẩm, lá cây, rau quả",
    guide: "Rác hữu cơ có thể ủ compost tại nhà hoặc đem đến điểm thu gom để chế biến thành phân bón hữu cơ.",
    tips: [
      "Phân loại riêng rác thực phẩm",
      "Có thể ủ compost tại nhà",
      "Tránh trộn với nhựa, kim loại",
    ],
    recyclable: true,
    hazardous: false,
  },
  {
    type: "Nhựa",
    icon: "water-outline",
    color: "#03A9F4",
    description: "Chai, túi, hộp nhựa",
    guide: "Rửa sạch, gỡ nhãn, phân loại theo ký hiệu tái chế (PET, HDPE, PP...) và đem đến điểm thu gom tái chế.",
    tips: [
      "Rửa sạch trước khi bỏ",
      "Gỡ nhãn và nắp đậy",
      "Phân loại theo số tái chế",
    ],
    recyclable: true,
    hazardous: false,
  },
  {
    type: "Kim loại",
    icon: "construct-outline",
    color: "#FFC107",
    description: "Lon, hộp thiếc, dây điện",
    guide: "Kim loại có giá trị tái chế cao. Thu gom riêng, làm sạch và đem bán phế liệu hoặc tới điểm tái chế.",
    tips: [
      "Thu gom riêng biệt",
      "Có thể bán cho thương lái",
      "Giá trị tái chế cao",
    ],
    recyclable: true,
    hazardous: false,
  },
  {
    type: "Điện tử",
    icon: "hardware-chip-outline",
    color: "#9C27B0",
    description: "Pin, máy tính, điện thoại",
    guide: "Rác điện tử chứa kim loại nặng nguy hại. Đem đến điểm thu gom chuyên dụng hoặc các chương trình thu hồi.",
    tips: [
      "KHÔNG vứt chung rác thải sinh hoạt",
      "Đem đến điểm thu gom chuyên dụng",
      "Xóa dữ liệu cá nhân trước khi vứt",
    ],
    recyclable: true,
    hazardous: true,
  },
  {
    type: "Y tế",
    icon: "medkit-outline",
    color: "#E53935",
    description: "Khẩu trang, băng gạc, kim tiêm",
    guide: "Rác y tế nguy hại cần được xử lý đặc biệt. Đựng trong túi riêng, gắn nhãn và đưa tới cơ sở y tế hoặc điểm thu gom chuyên dụng.",
    tips: [
      "Đựng trong túi kín, gắn nhãn",
      "KHÔNG tái chế",
      "Đem đến cơ sở y tế hoặc điểm thu gom đặc biệt",
    ],
    recyclable: false,
    hazardous: true,
  },
  {
    type: "Giấy",
    icon: "newspaper-outline",
    color: "#795548",
    description: "Báo, sách, bìa carton",
    guide: "Giấy có thể tái chế nhiều lần. Giữ khô ráo, gỡ keo dính, kim ghim và đem đến điểm thu gom.",
    tips: ["Giữ khô ráo", "Gỡ keo dính và kim ghim", "Xếp gọn gàng"],
    recyclable: true,
    hazardous: false,
  },
];

const COMMON_ITEMS = {
  "chai nhựa": { type: "Nhựa", icon: "💧" },
  "túi nilon": { type: "Nhựa", icon: "🛍️" },
  "hộp xốp": { type: "Nhựa", icon: "📦" },
  "lon bia": { type: "Kim loại", icon: "🥫" },
  "dây điện": { type: "Kim loại", icon: "🔌" },
  pin: { type: "Điện tử", icon: "🔋" },
  "điện thoại": { type: "Điện tử", icon: "📱" },
  "máy tính": { type: "Điện tử", icon: "💻" },
  "khẩu trang": { type: "Y tế", icon: "😷" },
  "kim tiêm": { type: "Y tế", icon: "💉" },
  "băng gạc": { type: "Y tế", icon: "🩹" },
  "vỏ trứng": { type: "Hữu cơ", icon: "🥚" },
  "lá cây": { type: "Hữu cơ", icon: "🍂" },
  "thức ăn thừa": { type: "Hữu cơ", icon: "🍽️" },
  báo: { type: "Giấy", icon: "📰" },
  sách: { type: "Giấy", icon: "📚" },
  "hộp carton": { type: "Giấy", icon: "📦" },
};

const WASTE_TYPE_SEARCH = {
  "Y tế": ["hospital", "clinic", "pharmacy"],
  "Điện tử": ["recycling", "electronics"],
  Nhựa: ["recycling", "waste"],
  "Kim loại": ["recycling", "scrap"],
  Giấy: ["recycling", "waste"],
  "Hữu cơ": ["recycling", "compost"],
};

export default function WasteGuideScreen() {
  // ✅ Kết nối UserContext
  const { addWasteClassification } = useContext(UserContext);

  const [selectedType, setSelectedType] = useState(null);
  const [search, setSearch] = useState("");
  const [pickedImage, setPickedImage] = useState(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [location, setLocation] = useState(null);
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (location && selectedType) {
      fetchNearbyLocations();
    }
  }, [location, selectedType]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      } else {
        Alert.alert(
          "Cần quyền truy cập vị trí",
          "Vui lòng cấp quyền truy cập vị trí để tìm điểm thu gom gần nhất"
        );
      }
    } catch (error) {
      console.error("Lỗi lấy vị trí:", error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchNearbyLocations = async () => {
    if (!location || !selectedType) return;

    setLoadingLocations(true);
    setNearbyLocations([]);

    try {
      const { latitude, longitude } = location;
      const searchTerms = WASTE_TYPE_SEARCH[selectedType] || ["recycling"];

      let allResults = [];

      for (const term of searchTerms) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            term
          )}&lat=${latitude}&lon=${longitude}&bounded=1&viewbox=${longitude - 0.05
            },${latitude - 0.05},${longitude + 0.05},${latitude + 0.05}&limit=10`;

          const response = await fetch(url, {
            headers: {
              "User-Agent": "WasteGuideApp/1.0",
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              allResults = [...allResults, ...data];
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`Error searching for ${term}:`, err);
        }
      }

      const uniqueResults = Array.from(
        new Map(allResults.map((item) => [item.place_id, item])).values()
      );

      if (uniqueResults.length > 0) {
        const locations = uniqueResults
          .map((place) => {
            const lat = parseFloat(place.lat);
            const lon = parseFloat(place.lon);
            const distance = calculateDistance(latitude, longitude, lat, lon);

            return {
              id: place.place_id,
              name: place.display_name.split(",")[0] || "Địa điểm thu gom",
              address: place.display_name,
              distance: parseFloat(distance.toFixed(2)),
              lat,
              lon,
              types: [selectedType],
            };
          })
          .filter((loc) => loc.distance <= 10)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5);

        if (locations.length > 0) {
          setNearbyLocations(locations);
        } else {
          useFallbackData();
        }
      } else {
        useFallbackData();
      }
    } catch (error) {
      console.error("Lỗi fetch địa điểm:", error);
      useFallbackData();
    } finally {
      setLoadingLocations(false);
    }
  };

  const useFallbackData = () => {
    if (!location) return;

    const { latitude, longitude } = location;

    const fallbackLocations = [
      {
        id: "fb1",
        name: "Trung tâm Tái chế Quận 1",
        address: "149 Pasteur, Phường 6, Quận 3, TP.HCM",
        lat: 10.7796,
        lon: 106.6926,
        phone: "028 3829 7724",
        types: ["Nhựa", "Kim loại", "Giấy"],
      },
      {
        id: "fb2",
        name: "Thu mua phế liệu Minh Phát",
        address: "234 Cộng Hòa, Phường 13, Tân Bình, TP.HCM",
        lat: 10.8006,
        lon: 106.6397,
        phone: "028 3844 5566",
        types: ["Kim loại", "Nhựa", "Giấy", "Điện tử"],
      },
      {
        id: "fb3",
        name: "Bệnh viện Chợ Rẫy",
        address: "201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP.HCM",
        lat: 10.7549,
        lon: 106.6652,
        phone: "028 3855 4137",
        types: ["Y tế"],
      },
      {
        id: "fb4",
        name: "Trung tâm Y tế Quận 1",
        address: "221A Nguyễn Trãi, Phường Nguyễn Cư Trinh, Q.1, TP.HCM",
        lat: 10.7629,
        lon: 106.6839,
        phone: "028 3920 6070",
        types: ["Y tế"],
      },
      {
        id: "fb5",
        name: "Trạm thu gom rác điện tử EcoTech",
        address: "567 Điện Biên Phủ, Phường 25, Bình Thạnh, TP.HCM",
        lat: 10.7994,
        lon: 106.7124,
        phone: "028 3512 3456",
        types: ["Điện tử"],
      },
      {
        id: "fb6",
        name: "Điểm thu gom rác hữu cơ",
        address: "89 Trần Hưng Đạo, Phường Cầu Kho, Quận 1, TP.HCM",
        lat: 10.7581,
        lon: 106.6896,
        phone: "028 3836 7890",
        types: ["Hữu cơ"],
      },
      {
        id: "fb7",
        name: "Bệnh viện Đại học Y Dược",
        address: "215 Hồng Bàng, Phường 11, Quận 5, TP.HCM",
        lat: 10.7549,
        lon: 106.6617,
        phone: "028 3855 4269",
        types: ["Y tế"],
      },
      {
        id: "fb8",
        name: "Công ty Thu gom rác Green Life",
        address: "123 Lê Văn Sỹ, Phường 13, Quận 3, TP.HCM",
        lat: 10.7871,
        lon: 106.6826,
        phone: "028 3930 1234",
        types: ["Nhựa", "Giấy", "Hữu cơ"],
      },
    ];

    const filtered = fallbackLocations
      .filter((loc) => loc.types.includes(selectedType))
      .map((loc) => ({
        ...loc,
        distance: parseFloat(
          calculateDistance(latitude, longitude, loc.lat, loc.lon).toFixed(2)
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    setNearbyLocations(filtered);

    if (filtered.length === 0) {
      Alert.alert(
        "Thông báo",
        `Hiện tại chưa có dữ liệu trực tuyến về điểm thu gom ${selectedType}. Đang hiển thị dữ liệu tham khảo tại TP.HCM.`
      );
    }
  };

  // ✅ CẬP NHẬT: Lưu vào UserContext khi AI nhận dạng thành công
  const analyzeImageWithImagga = async (imageUri) => {
    try {
      setAiProcessing(true);
      setAiResult(null);

      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "photo.jpg",
      });

      const res = await fetch("https://api.imagga.com/v2/tags", {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + btoa(`${IMAGGA_API_KEY}:${IMAGGA_API_SECRET}`),
        },
        body: formData,
      });

      const data = await res.json();

      if (data.result && data.result.tags.length > 0) {
        const tags = data.result.tags.map((t) => t.tag.en.toLowerCase());
        console.log("AI tags:", tags);

        let recognizedType = "Khác";
        if (tags.some((t) => t.includes("plastic") || t.includes("bottle") || t.includes("bag"))) {
          recognizedType = "Nhựa";
        } else if (tags.some((t) => t.includes("paper") || t.includes("cardboard"))) {
          recognizedType = "Giấy";
        } else if (tags.some((t) => t.includes("metal") || t.includes("tin") || t.includes("aluminum"))) {
          recognizedType = "Kim loại";
        } else if (tags.some((t) => t.includes("food") || t.includes("fruit") || t.includes("vegetable"))) {
          recognizedType = "Hữu cơ";
        } else if (tags.some((t) => t.includes("battery") || t.includes("phone") || t.includes("computer"))) {
          recognizedType = "Điện tử";
        } else if (tags.some((t) => t.includes("mask") || t.includes("syringe"))) {
          recognizedType = "Y tế";
        }

        setAiResult(recognizedType);
        setSelectedType(recognizedType);

        // ✅ LƯU VÀO USERCONTEXT - Thưởng 5 điểm
        if (recognizedType !== "Khác") {
          await addWasteClassification(recognizedType, imageUri);
          Alert.alert(
            "Nhận dạng thành công! 🎉", 
            `Rác được phân loại là: ${recognizedType}\n+5 điểm tích lũy!`
          );
        } else {
          Alert.alert("Nhận dạng thành công", `Rác được phân loại là: ${recognizedType}`);
        }
      } else {
        Alert.alert("Không nhận dạng được", "Hãy thử lại với ảnh rõ nét hơn.");
      }
    } catch (error) {
      console.error("Lỗi Imagga:", error);
      Alert.alert("Lỗi", "Không thể kết nối Imagga API.");
    } finally {
      setAiProcessing(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setPickedImage(uri);
        await analyzeImageWithImagga(uri);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setPickedImage(uri);
      await analyzeImageWithImagga(uri);
    }
  };

  const searchWasteGuide = () => {
    const searchLower = search.toLowerCase().trim();
    for (const [item, data] of Object.entries(COMMON_ITEMS)) {
      if (searchLower.includes(item)) {
        setSelectedType(data.type);
        return data;
      }
    }
    return null;
  };

  const selectedWasteInfo = WASTE_TYPES.find((w) => w.type === selectedType);

  const openMap = (lat, lon, name) => {
    const label = encodeURIComponent(name);
    const url =
      Platform.OS === "ios"
        ? `maps://maps.apple.com/?ll=${lat},${lon}&q=${label}`
        : `geo:${lat},${lon}?q=${lat},${lon}(${label})`;
    Linking.openURL(url);
  };

  const callPhone = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <SafeAreaScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="reload-circle" size={32} color="#2e7d32" />
          <Text style={styles.headerText}>Hướng dẫn xử lý rác thải</Text>
        </View>

        {/* TÌM KIẾM */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tìm kiếm hướng dẫn</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#555" />
            <TextInput
              style={styles.searchInput}
              placeholder="Nhập tên vật phẩm (vd: chai nhựa, pin...)"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={searchWasteGuide}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {search.length > 0 && (
            <View style={styles.searchResults}>
              {Object.entries(COMMON_ITEMS)
                .filter(([item]) => item.toLowerCase().includes(search.toLowerCase()))
                .slice(0, 5)
                .map(([item, data]) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setSearch(item);
                      setSelectedType(data.type);
                    }}
                  >
                    <Text style={styles.searchResultIcon}>{data.icon}</Text>
                    <Text style={styles.searchResultText}>{item}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#999" />
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>

        {/* AI NHẬN DẠNG */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhận dạng bằng AI (+5 điểm)</Text>
          <Text style={styles.sectionDesc}>
            Chụp hoặc tải lên hình ảnh rác để AI tự động phân loại
          </Text>

          <View style={styles.aiButtons}>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={24} color="#2e7d32" />
              <Text style={styles.imageButtonText}>Chụp ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#2e7d32" />
              <Text style={styles.imageButtonText}>Chọn từ thư viện</Text>
            </TouchableOpacity>
          </View>

          {pickedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: pickedImage }} style={styles.previewImage} />
              {aiProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#2e7d32" />
                  <Text style={styles.processingText}>Đang phân tích...</Text>
                </View>
              )}
            </View>
          )}

          {aiResult && !aiProcessing && (
            <View style={styles.aiResultBox}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.aiResultText}>
                AI nhận dạng: <Text style={styles.aiResultBold}>{aiResult}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* PHÂN LOẠI RÁC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phân loại rác thải</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.wasteTypesScroll}
          >
            {WASTE_TYPES.map((waste) => (
              <TouchableOpacity
                key={waste.type}
                style={[
                  styles.wasteCard,
                  { borderColor: waste.color },
                  selectedType === waste.type && {
                    backgroundColor: waste.color + "15",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedType(waste.type)}
              >
                <Ionicons name={waste.icon} size={32} color={waste.color} />
                <Text style={[styles.wasteCardTitle, { color: waste.color }]}>
                  {waste.type}
                </Text>
                <Text style={styles.wasteCardDesc}>{waste.description}</Text>
                {waste.hazardous && (
                  <View style={styles.hazardBadge}>
                    <Ionicons name="warning" size={12} color="#E53935" />
                    <Text style={styles.hazardText}>Nguy hại</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* CHI TIẾT RÁC */}
        {selectedWasteInfo && (
          <>
            <View style={[styles.detailCard, { borderLeftColor: selectedWasteInfo.color }]}>
              <View style={styles.detailHeader}>
                <Ionicons name={selectedWasteInfo.icon} size={40} color={selectedWasteInfo.color} />
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={[styles.detailTitle, { color: selectedWasteInfo.color }]}>
                    {selectedWasteInfo.type}
                  </Text>
                  <Text style={styles.detailDesc}>{selectedWasteInfo.description}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Hướng dẫn xử lý:</Text>
                <Text style={styles.detailText}>{selectedWasteInfo.guide}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Mẹo hữu ích:</Text>
                {selectedWasteInfo.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.badges}>
                {selectedWasteInfo.recyclable && (
                  <View style={[styles.badge, { backgroundColor: "#4CAF50" }]}>
                    <Ionicons name="reload" size={14} color="#fff" />
                    <Text style={styles.badgeText}>Tái chế được</Text>
                  </View>
                )}
                {selectedWasteInfo.hazardous && (
                  <View style={[styles.badge, { backgroundColor: "#E53935" }]}>
                    <Ionicons name="warning" size={14} color="#fff" />
                    <Text style={styles.badgeText}>Nguy hại</Text>
                  </View>
                )}
              </View>
            </View>

            {/* ĐỊA ĐIỂM THU GOM */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Địa điểm thu gom gần nhất</Text>
              {loadingLocations ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2e7d32" />
                  <Text style={styles.loadingText}>Đang tìm địa điểm...</Text>
                </View>
              ) : nearbyLocations.length === 0 ? (
                <View style={styles.noLocationContainer}>
                  <Ionicons name="location-outline" size={48} color="#999" />
                  <Text style={styles.noLocationText}>Không tìm thấy địa điểm</Text>
                  <Text style={styles.noLocationSubText}>
                    Vui lòng liên hệ chính quyền địa phương
                  </Text>
                </View>
              ) : (
                nearbyLocations.map((loc, index) => (
                  <View key={loc.id || index} style={styles.locationCard}>
                    <View style={styles.locationHeader}>
                      <Ionicons name="location" size={24} color="#2e7d32" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.locationName}>{loc.name}</Text>
                        <Text style={styles.locationAddress}>{loc.address}</Text>
                        <Text style={styles.locationDistance}>
                          Cách bạn {loc.distance} km
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.actionButtonFull}
                      onPress={() => openMap(loc.lat, loc.lon, loc.name)}
                    >
                      <Ionicons name="navigate" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Chỉ đường</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* MẸO CUỐI */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Mẹo bảo vệ môi trường</Text>
          <Text style={styles.tipsText}>
            • Giảm thiểu đồ nhựa dùng một lần{"\n"}
            • Mang túi vải khi đi chợ{"\n"}
            • Tái sử dụng trước khi vứt bỏ{"\n"}
            • Phân loại rác tại nguồn = hành động xanh!
          </Text>
        </View>
      </SafeAreaScrollView>
    </>
  );
}

const styles = StyleSheet.create({
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
  sectionDesc: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  searchResults: {
    marginTop: 10,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
  },
  searchResultIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  searchResultText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  aiButtons: {
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
  imageButtonText: {
    marginLeft: 8,
    color: "#2e7d32",
    fontWeight: "600",
    fontSize: 13,
  },
  imagePreviewContainer: {
    position: "relative",
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingText: {
    marginTop: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  aiResultBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  aiResultText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  aiResultBold: {
    fontWeight: "bold",
    color: "#2e7d32",
  },
  wasteTypesScroll: {
    marginHorizontal: -15,
    paddingHorizontal: 15,
  },
  wasteCard: {
    width: 140,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#fff",
    marginRight: 12,
    alignItems: "center",
  },
  wasteCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  wasteCardDesc: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  hazardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
  },
  hazardText: {
    fontSize: 10,
    color: "#E53935",
    marginLeft: 3,
    fontWeight: "600",
  },
  detailCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderLeftWidth: 6,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  detailDesc: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  detailSection: {
    marginTop: 15,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  tipText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#666",
  },
  badges: {
    flexDirection: "row",
    marginTop: 15,
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
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
  noLocationContainer: {
    alignItems: "center",
    padding: 30,
  },
  noLocationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 10,
  },
  noLocationSubText: {
    fontSize: 13,
    color: "#999",
    marginTop: 5,
  },
  locationCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  locationAddress: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
  },
  locationDistance: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "600",
    marginTop: 3,
  },
  actionButtonFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    marginLeft: 6,
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  tipsCard: {
    backgroundColor: "#fff3e0",
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 30,
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
});
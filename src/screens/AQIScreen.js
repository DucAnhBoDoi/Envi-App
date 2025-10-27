import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
} from "react-native";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../context/UserContext";

const OPENWEATHER_API_KEY = "2a110f99ddf042dfdbd222451ed81f20";

// ⚙️ Cấu hình hiển thị thông báo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function AQIScreen() {
  const { aqiThreshold, setAqiThreshold } = useContext(UserContext);
  const [location, setLocation] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotifications();
    notificationListener.current = Notifications.addNotificationReceivedListener((n) =>
      console.log("📩 Notification:", n)
    );
    responseListener.current = Notifications.addNotificationResponseReceivedListener((r) =>
      console.log("👆 Notification tapped:", r)
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (location) fetchAQI(location.latitude, location.longitude);
  }, [location]);

  // 🔔 Đăng ký quyền thông báo
  const registerForPushNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Thông báo", "Hãy bật quyền thông báo để nhận cảnh báo AQI.");
      return;
    }
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("aqi-alerts", {
        name: "Cảnh báo AQI",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
  };

  // 📍 Lấy vị trí + địa chỉ (Quận + Thành phố)
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Cảnh báo", "Cần quyền vị trí để hiển thị AQI.");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const reverseGeo = await Location.reverseGeocodeAsync(loc.coords);

      let formattedAddress = "Không xác định";
      if (reverseGeo && reverseGeo.length > 0) {
        const addr = reverseGeo[0];
        const district =
          addr.district || addr.subregion || addr.city || addr.region || "";
        const city = addr.city || addr.region || "";
        formattedAddress = `${district}, ${city}`;
      }

      setLocation({ ...loc.coords, address: formattedAddress });
    } catch (e) {
      console.error("Lỗi vị trí:", e);
      Alert.alert("Lỗi", "Không thể lấy vị trí thiết bị.");
    } finally {
      setLoading(false);
    }
  };

  // 🎚️ Quy đổi AQI chuẩn
  const convertAqiToScale = (aqi) => {
    const map = { 1: 50, 2: 100, 3: 150, 4: 200, 5: 300 };
    return map[aqi] || 0;
  };

  // 🌫️ Lấy dữ liệu AQI và thời tiết
  const fetchAQI = async (lat, lon) => {
    try {
      setLoading(true);
      const [aqiRes, weatherRes] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
        ),
      ]);

      const aqiDataJson = await aqiRes.json();
      const weatherJson = await weatherRes.json();

      if (aqiDataJson?.list?.length > 0) {
        const rawAqi = aqiDataJson.list[0].main.aqi;
        const aqi = convertAqiToScale(rawAqi);
        const components = aqiDataJson.list[0].components;
        const weather = weatherJson.weather[0];

        setAqiData({
          aqi,
          components,
          tempC: weatherJson.main.temp,
          tempF: weatherJson.main.temp * 1.8 + 32,
          humidity: weatherJson.main.humidity,
          locationName:
            location?.address || `${weatherJson.name}, ${weatherJson.sys.country}`,
          weatherDesc: weather.description,
          weatherIcon: `https://openweathermap.org/img/wn/${weather.icon}@2x.png`,
        });

        // 🚨 Kiểm tra vượt ngưỡng cảnh báo
        if (aqi >= aqiThreshold) {
          Alert.alert("⚠️ AQI cao", `Chất lượng không khí ${getAQIInfo(aqi).level}.`);
          await sendAQINotification(aqi);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 📲 Gửi thông báo nếu AQI cao
  const sendAQINotification = async (aqi) => {
    const now = Date.now();
    if (now - lastNotificationTime < 30 * 60 * 1000) return;
    const info = getAQIInfo(aqi);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ Cảnh báo AQI cao",
        body: `AQI: ${aqi} - ${info.level}. ${info.advice}`,
      },
      trigger: null,
    });
    setLastNotificationTime(now);
  };

  const getAQIInfo = (aqi) => {
    if (aqi <= 50)
      return { level: "Tốt 😊", color: "#2e7d32", emoji: "🌿", advice: "Không khí trong lành." };
    if (aqi <= 100)
      return { level: "Trung bình 🙂", color: "#ffeb3b", emoji: "🌤️", advice: "Chấp nhận được." };
    if (aqi <= 150)
      return { level: "Kém 😷", color: "#ff9800", emoji: "🌥️", advice: "Hạn chế ra ngoài." };
    if (aqi <= 200)
      return { level: "Xấu 😡", color: "#f44336", emoji: "🌫️", advice: "Ở trong nhà, đeo khẩu trang." };
    if (aqi <= 300)
      return { level: "Rất xấu ☠️", color: "#9c27b0", emoji: "💀", advice: "Tránh ra ngoài hoàn toàn." };
    return { level: "Nguy hại 🚨", color: "#6a1b9a", emoji: "☣️", advice: "Cảnh báo khẩn cấp!" };
  };

  if (loading)
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Đang tải dữ liệu AQI...</Text>
      </View>
    );

  const displayedAqi = aqiData?.aqi ?? 0;
  const info = getAQIInfo(displayedAqi);

  return (
    <View style={[styles.container, { paddingTop: StatusBar.currentHeight || 40 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="leaf-outline" size={32} color="#2e7d32" />
          <Text style={styles.headerText}>Chỉ số AQI hiện tại</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => {
              if (location) fetchAQI(location.latitude, location.longitude);
              else getLocation();
            }}
          >
            <Ionicons name="refresh" size={22} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {/* Card AQI */}
        <View style={[styles.card, { borderLeftColor: info.color }]}>
          <Text style={styles.emoji}>{info.emoji}</Text>
          <Text style={[styles.aqiValue, { color: info.color }]}>{displayedAqi}</Text>
          <Text style={styles.aqiLevel}>{info.level}</Text>
          <Text style={styles.advice}>{info.advice}</Text>
        </View>

        {/* Weather Card */}
        {aqiData?.tempC && (
          <View style={styles.weatherCard}>
            <Image source={{ uri: aqiData.weatherIcon }} style={styles.weatherIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationText}>📍 {aqiData.locationName}</Text>
              <Text style={styles.tempText}>
                🌡️ {aqiData.tempC.toFixed(1)}°C / {aqiData.tempF.toFixed(1)}°F
              </Text>
              <Text style={styles.humidityText}>💧 Độ ẩm: {aqiData.humidity}%</Text>
              <Text style={styles.weatherDesc}>
                {aqiData.weatherDesc.charAt(0).toUpperCase() + aqiData.weatherDesc.slice(1)}
              </Text>
            </View>
          </View>
        )}

        {/* Air components */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌬️ Thành phần không khí</Text>
          {aqiData ? (
            Object.entries(aqiData.components).map(([key, val]) => (
              <View key={key} style={styles.row}>
                <Text style={styles.label}>{key.toUpperCase()}</Text>
                <Text style={styles.value}>{val.toFixed(2)} µg/m³</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noData}>Không có dữ liệu chi tiết.</Text>
          )}
        </View>

        {/* Slider */}
        <View style={styles.section}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={styles.sectionTitle}>⚙️ Ngưỡng cảnh báo AQI</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#2e7d32" }}>
              {aqiThreshold}
            </Text>
          </View>

          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={500}
            step={10}
            value={aqiThreshold}
            onValueChange={(v) => setAqiThreshold(v)}
            minimumTrackTintColor="#2e7d32"
            maximumTrackTintColor="#ccc"
          />
          <Text style={styles.sliderHint}>Nhận thông báo khi AQI ≥ {aqiThreshold}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { flexGrow: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#2e7d32" },
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  refreshBtn: { position: "absolute", right: 20, padding: 6 },
  headerText: { fontSize: 18, fontWeight: "bold", color: "#333" },
  card: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  emoji: { fontSize: 50, marginBottom: 5 },
  aqiValue: { fontSize: 58, fontWeight: "bold" },
  aqiLevel: { fontSize: 20, fontWeight: "600", color: "#333", marginTop: 5 },
  advice: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 8 },
  weatherCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 5,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
  },
  weatherIcon: { width: 60, height: 60, marginRight: 10 },
  locationText: { fontSize: 15, fontWeight: "600", color: "#333" },
  tempText: { fontSize: 14, color: "#555", marginTop: 2 },
  humidityText: { fontSize: 14, color: "#555", marginTop: 2 },
  weatherDesc: { fontSize: 13, color: "#777", marginTop: 4, fontStyle: "italic" },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#2e7d32", marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: { fontSize: 14, color: "#555" },
  value: { fontSize: 14, color: "#333", fontWeight: "500" },
  noData: { textAlign: "center", fontSize: 14, color: "#999" },
  sliderHint: {
    fontSize: 13,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
    fontStyle: "italic",
  },
});

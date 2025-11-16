// src/screens/MapScreen.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

const OPENWEATHER_API_KEY = "2a110f99ddf042dfdbd222451ed81f20";

export default function MapScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState({});

  // Refs để track mounted state và prevent memory leaks
  const isMounted = useRef(true);
  const fetchController = useRef(null);
  const fetchTimeouts = useRef({});

  const [region, setRegion] = useState({
    latitude: 10.762622,
    longitude: 106.660172,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const filters = [
    { id: "all", name: "Tất cả", icon: "layers", color: "#2196F3" },
    { id: "recycle", name: "Tái chế", icon: "refresh", color: "#4CAF50" },
    { id: "electronic", name: "Điện tử", icon: "hardware-chip", color: "#FF9800" },
    { id: "plastic", name: "Nhựa", icon: "water", color: "#00BCD4" },
    { id: "battery", name: "Pin", icon: "battery-half", color: "#FFC107" },
    { id: "medical", name: "Y tế", icon: "medical", color: "#F44336" },
  ];

  const locations = [
    {
      id: 1,
      name: "Điểm thu gom Quận 1",
      type: "recycle",
      latitude: 10.7769,
      longitude: 106.7009,
      address: "123 Nguyễn Huệ, Q1, TP.HCM",
      phone: "0901234567",
      hours: "8:00 - 17:00",
      services: ["Nhựa", "Giấy", "Kim loại"],
      description: "Trung tâm thu gom rác tái chế lớn nhất Quận 1",
    },
    {
      id: 2,
      name: "Thu gom điện tử District 3",
      type: "electronic",
      latitude: 10.7858,
      longitude: 106.6969,
      address: "456 Lê Văn Sỹ, Q3, TP.HCM",
      phone: "0909876543",
      hours: "9:00 - 18:00",
      services: ["Máy tính", "Điện thoại", "TV"],
      description: "Chuyên thu gom và xử lý rác điện tử",
    },
    {
      id: 3,
      name: "Trạm xử lý rác Bình Tân",
      type: "plastic",
      latitude: 10.7479,
      longitude: 106.6165,
      address: "789 Đường số 6, Bình Tân, TP.HCM",
      phone: "0912345678",
      hours: "7:00 - 19:00",
      services: ["Nhựa", "Túi nilon"],
      description: "Trạm xử lý nhựa và bao bì",
    },
    {
      id: 4,
      name: "Thu pin và ắc quy Q7",
      type: "battery",
      latitude: 10.7333,
      longitude: 106.7196,
      address: "321 Nguyễn Thị Thập, Q7, TP.HCM",
      phone: "0918765432",
      hours: "8:00 - 16:00",
      services: ["Pin", "Ắc quy", "Bóng đèn"],
      description: "Thu gom pin và chất thải nguy hại",
    },
    {
      id: 5,
      name: "Rác thải y tế Tân Bình",
      type: "medical",
      latitude: 10.8006,
      longitude: 106.6536,
      address: "654 Cộng Hòa, Tân Bình, TP.HCM",
      phone: "0923456789",
      hours: "24/7",
      services: ["Khẩu trang", "Thuốc hết hạn", "Kim tiêm"],
      description: "Trung tâm xử lý rác thải y tế",
    },
    {
      id: 6,
      name: "Điểm thu gom Quận 2",
      type: "recycle",
      latitude: 10.7905,
      longitude: 106.7358,
      address: "888 Xa lộ Hà Nội, Q2, TP.HCM",
      phone: "0934567890",
      hours: "8:00 - 18:00",
      services: ["Giấy", "Carton", "Kim loại"],
      description: "Thu gom rác tái chế khu vực Đông Sài Gòn",
    },
    {
      id: 7,
      name: "Xử lý điện tử Thủ Đức",
      type: "electronic",
      latitude: 10.8506,
      longitude: 106.7719,
      address: "555 Võ Văn Ngân, Thủ Đức, TP.HCM",
      phone: "0945678901",
      hours: "8:30 - 17:30",
      services: ["Laptop", "Màn hình", "Linh kiện"],
      description: "Chuyên xử lý e-waste công nghệ",
    },
  ];

  const filteredLocations =
    selectedFilter === "all"
      ? locations
      : locations.filter((loc) => loc.type === selectedFilter);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      // Cancel tất cả fetch requests
      if (fetchController.current) {
        fetchController.current.abort();
      }
      // Clear tất cả timeouts
      Object.values(fetchTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    fetchEnvironmentalDataForAllLocations();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần cấp quyền truy cập vị trí");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      if (isMounted.current) {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.log("Error getting location:", error);
    }
  };

  const fetchEnvironmentalDataForAllLocations = async () => {
    if (loading) return; // Prevent multiple simultaneous fetches
    
    setLoading(true);
    const data = {};

    // Tạo AbortController mới cho batch này
    fetchController.current = new AbortController();

    // Fetch với timeout và error handling tốt hơn
    const fetchPromises = locations.map(async (location) => {
      try {
        const envData = await fetchEnvironmentalDataWithTimeout(
          location.latitude,
          location.longitude,
          location.id,
          10000 // 10 second timeout
        );
        data[location.id] = envData;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log(`Error fetching data for location ${location.id}:`, error);
        }
        // Set default data on error
        data[location.id] = getDefaultEnvironmentalData();
      }
    });

    try {
      await Promise.all(fetchPromises);
    } catch (error) {
      console.log("Error in batch fetch:", error);
    }

    if (isMounted.current) {
      setEnvironmentalData(data);
      setLoading(false);
    }
  };

  const fetchEnvironmentalDataWithTimeout = (lat, lon, locationId, timeout) => {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      fetchTimeouts.current[locationId] = timeoutId;

      try {
        const data = await fetchEnvironmentalData(lat, lon);
        clearTimeout(timeoutId);
        delete fetchTimeouts.current[locationId];
        resolve(data);
      } catch (error) {
        clearTimeout(timeoutId);
        delete fetchTimeouts.current[locationId];
        reject(error);
      }
    });
  };

  const getDefaultEnvironmentalData = () => ({
    aqi: 0,
    aqiLevel: "N/A",
    temperature: 0,
    humidity: 0,
    pressure: 0,
    windSpeed: 0,
    pm25: "N/A",
    pm10: "N/A",
    co: "N/A",
    no2: "N/A",
    o3: "N/A",
    so2: "N/A",
    noise: 0,
  });

  const fetchEnvironmentalData = async (lat, lon) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Fetch Air Quality Index (AQI)
      const aqiResponse = await fetch(
        `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`,
        { signal: controller.signal }
      );
      
      if (!aqiResponse.ok) throw new Error('AQI fetch failed');
      const aqiData = await aqiResponse.json();

      // Fetch Weather data
      const weatherResponse = await fetch(
        `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`,
        { signal: controller.signal }
      );
      
      if (!weatherResponse.ok) throw new Error('Weather fetch failed');
      const weatherData = await weatherResponse.json();

      clearTimeout(timeoutId);

      const aqi = aqiData.list?.[0]?.main?.aqi || 0;
      const aqiValue = aqi * 50;
      const components = aqiData.list?.[0]?.components || {};

      return {
        aqi: Math.round(aqiValue),
        aqiLevel: getAQILevel(aqiValue),
        temperature: Math.round(weatherData.main?.temp || 0),
        humidity: weatherData.main?.humidity || 0,
        pressure: weatherData.main?.pressure || 0,
        windSpeed: weatherData.wind?.speed || 0,
        pm25: components.pm2_5?.toFixed(2) || "N/A",
        pm10: components.pm10?.toFixed(2) || "N/A",
        co: components.co?.toFixed(2) || "N/A",
        no2: components.no2?.toFixed(2) || "N/A",
        o3: components.o3?.toFixed(2) || "N/A",
        so2: components.so2?.toFixed(2) || "N/A",
        noise: Math.round(50 + Math.random() * 30),
      };
    } catch (error) {
      console.error("Error fetching environmental data:", error);
      return getDefaultEnvironmentalData();
    }
  };

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return "Tốt";
    if (aqi <= 100) return "Trung bình";
    if (aqi <= 150) return "Kém";
    if (aqi <= 200) return "Xấu";
    if (aqi <= 300) return "Rất xấu";
    return "Nguy hại";
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return "#4CAF50";
    if (aqi <= 100) return "#FFC107";
    if (aqi <= 150) return "#FF9800";
    if (aqi <= 200) return "#F44336";
    if (aqi <= 300) return "#9C27B0";
    return "#880E4F";
  };

  const getMarkerColor = (type) => {
    const filter = filters.find((f) => f.id === type);
    return filter?.color || "#2196F3";
  };

  // Sử dụng useCallback để memoize function và prevent re-renders
  const handleMarkerPress = useCallback(async (location) => {
    // Prevent multiple rapid taps
    if (modalVisible) return;

    setSelectedMarker(location);
    setModalVisible(true);

    // Chỉ fetch nếu chưa có data hoặc data đã cũ (> 5 phút)
    const existingData = environmentalData[location.id];
    const shouldRefresh = !existingData || 
      (existingData.timestamp && Date.now() - existingData.timestamp > 300000);

    if (shouldRefresh && isMounted.current) {
      try {
        const envData = await fetchEnvironmentalDataWithTimeout(
          location.latitude,
          location.longitude,
          location.id,
          8000
        );
        
        if (isMounted.current) {
          setEnvironmentalData((prev) => ({
            ...prev,
            [location.id]: { ...envData, timestamp: Date.now() },
          }));
        }
      } catch (error) {
        console.log("Error refreshing environmental data:", error);
      }
    }
  }, [modalVisible, environmentalData]);

  const handleRecenterMap = () => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } else {
      getCurrentLocation();
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
    const distance = R * c;
    return distance.toFixed(2);
  };

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    // Delay clear để animation mượt hơn
    setTimeout(() => {
      if (isMounted.current) {
        setSelectedMarker(null);
      }
    }, 300);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bản đồ môi trường</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={fetchEnvironmentalDataForAllLocations}
          disabled={loading}
        >
          <Ionicons name="refresh" size={24} color={loading ? "#ccc" : "#222"} />
        </TouchableOpacity>
      </View>

      {/* Filter Categories */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && {
                  backgroundColor: filter.color,
                },
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Ionicons
                name={filter.icon}
                size={20}
                color={selectedFilter === filter.id ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextActive,
                ]}
              >
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang tải dữ liệu môi trường...</Text>
        </View>
      )}

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* User Location Circle */}
        {userLocation && (
          <Circle
            center={userLocation}
            radius={500}
            strokeColor="rgba(33, 150, 243, 0.5)"
            fillColor="rgba(33, 150, 243, 0.1)"
          />
        )}

        {/* Location Markers */}
        {filteredLocations.map((location) => {
          const envData = environmentalData[location.id];
          return (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              onPress={() => handleMarkerPress(location)}
            >
              <View
                style={[
                  styles.markerContainer,
                  { backgroundColor: getMarkerColor(location.type) },
                ]}
              >
                <Ionicons
                  name={filters.find((f) => f.id === location.type)?.icon}
                  size={24}
                  color="#fff"
                />
                {envData && envData.aqi > 0 && (
                  <View
                    style={[
                      styles.markerBadge,
                      { backgroundColor: getAQIColor(envData.aqi) },
                    ]}
                  >
                    <Text style={styles.markerBadgeText}>{envData.aqi}</Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Location Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={handleCloseModal}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            {selectedMarker && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View
                  style={[
                    styles.modalIcon,
                    { backgroundColor: getMarkerColor(selectedMarker.type) + "20" },
                  ]}
                >
                  <Ionicons
                    name={filters.find((f) => f.id === selectedMarker.type)?.icon}
                    size={40}
                    color={getMarkerColor(selectedMarker.type)}
                  />
                </View>

                <Text style={styles.modalTitle}>{selectedMarker.name}</Text>
                <Text style={styles.modalDescription}>
                  {selectedMarker.description}
                </Text>

                {/* Basic Info */}
                <View style={styles.modalInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={20} color="#666" />
                    <Text style={styles.infoText}>{selectedMarker.address}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="call" size={20} color="#666" />
                    <Text style={styles.infoText}>{selectedMarker.phone}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="time" size={20} color="#666" />
                    <Text style={styles.infoText}>{selectedMarker.hours}</Text>
                  </View>

                  {userLocation && (
                    <View style={styles.infoRow}>
                      <Ionicons name="navigate" size={20} color="#666" />
                      <Text style={styles.infoText}>
                        Cách bạn{" "}
                        {calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          selectedMarker.latitude,
                          selectedMarker.longitude
                        )}{" "}
                        km
                      </Text>
                    </View>
                  )}
                </View>

                {/* Services */}
                <View style={styles.servicesSection}>
                  <Text style={styles.servicesTitle}>Dịch vụ:</Text>
                  <View style={styles.servicesTags}>
                    {selectedMarker.services.map((service, index) => (
                      <View key={index} style={styles.serviceTag}>
                        <Text style={styles.serviceTagText}>{service}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Environmental Data */}
                {environmentalData[selectedMarker.id] && environmentalData[selectedMarker.id].aqi > 0 && (
                  <View style={styles.envDataSection}>
                    <Text style={styles.envDataTitle}>
                      Dữ liệu môi trường thời gian thực:
                    </Text>

                    {/* AQI Card */}
                    <View
                      style={[
                        styles.aqiCard,
                        {
                          backgroundColor:
                            getAQIColor(environmentalData[selectedMarker.id].aqi) +
                            "15",
                        },
                      ]}
                    >
                      <View style={styles.aqiHeader}>
                        <Ionicons name="cloud" size={28} color="#FF9800" />
                        <View style={styles.aqiHeaderText}>
                          <Text style={styles.aqiLabel}>Chỉ số chất lượng không khí</Text>
                          <Text
                            style={[
                              styles.aqiValue,
                              {
                                color: getAQIColor(
                                  environmentalData[selectedMarker.id].aqi
                                ),
                              },
                            ]}
                          >
                            {environmentalData[selectedMarker.id].aqi} -{" "}
                            {environmentalData[selectedMarker.id].aqiLevel}
                          </Text>
                        </View>
                      </View>

                      {/* Pollutants */}
                      <View style={styles.pollutantsGrid}>
                        <View style={styles.pollutantItem}>
                          <Text style={styles.pollutantLabel}>PM2.5</Text>
                          <Text style={styles.pollutantValue}>
                            {environmentalData[selectedMarker.id].pm25} μg/m³
                          </Text>
                        </View>
                        <View style={styles.pollutantItem}>
                          <Text style={styles.pollutantLabel}>PM10</Text>
                          <Text style={styles.pollutantValue}>
                            {environmentalData[selectedMarker.id].pm10} μg/m³
                          </Text>
                        </View>
                        <View style={styles.pollutantItem}>
                          <Text style={styles.pollutantLabel}>CO</Text>
                          <Text style={styles.pollutantValue}>
                            {environmentalData[selectedMarker.id].co} μg/m³
                          </Text>
                        </View>
                        <View style={styles.pollutantItem}>
                          <Text style={styles.pollutantLabel}>NO₂</Text>
                          <Text style={styles.pollutantValue}>
                            {environmentalData[selectedMarker.id].no2} μg/m³
                          </Text>
                        </View>
                        <View style={styles.pollutantItem}>
                          <Text style={styles.pollutantLabel}>O₃</Text>
                          <Text style={styles.pollutantValue}>
                            {environmentalData[selectedMarker.id].o3} μg/m³
                          </Text>
                        </View>
                        <View style={styles.pollutantItem}>
                          <Text style={styles.pollutantLabel}>SO₂</Text>
                          <Text style={styles.pollutantValue}>
                            {environmentalData[selectedMarker.id].so2} μg/m³
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Other Environmental Data */}
                    <View style={styles.envDataRow}>
                      <View style={styles.envDataCard}>
                        <Ionicons name="thermometer" size={24} color="#FF5722" />
                        <Text style={styles.envDataLabel}>Nhiệt độ</Text>
                        <Text style={styles.envDataValue}>
                          {environmentalData[selectedMarker.id].temperature}°C
                        </Text>
                      </View>

                      <View style={styles.envDataCard}>
                        <Ionicons name="water" size={24} color="#2196F3" />
                        <Text style={styles.envDataLabel}>Độ ẩm</Text>
                        <Text style={styles.envDataValue}>
                          {environmentalData[selectedMarker.id].humidity}%
                        </Text>
                      </View>

                      <View style={styles.envDataCard}>
                        <Ionicons name="volume-high" size={24} color="#9C27B0" />
                        <Text style={styles.envDataLabel}>Tiếng ồn</Text>
                        <Text style={styles.envDataValue}>
                          {environmentalData[selectedMarker.id].noise} dB
                        </Text>
                      </View>
                    </View>

                    <View style={styles.envDataRow}>
                      <View style={styles.envDataCard}>
                        <Ionicons name="speedometer" size={24} color="#00BCD4" />
                        <Text style={styles.envDataLabel}>Áp suất</Text>
                        <Text style={styles.envDataValue}>
                          {environmentalData[selectedMarker.id].pressure} hPa
                        </Text>
                      </View>

                      <View style={styles.envDataCard}>
                        <Ionicons name="leaf" size={24} color="#4CAF50" />
                        <Text style={styles.envDataLabel}>Gió</Text>
                        <Text style={styles.envDataValue}>
                          {environmentalData[selectedMarker.id].windSpeed} m/s
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.dataTimestamp}>
                      Cập nhật: {new Date().toLocaleString("vi-VN")}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.directionButton}>
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.directionButtonText}>Chỉ đường</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleRecenterMap}>
        <Ionicons name="locate" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  searchButton: {
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
    flex: 1,
  },
  filterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterScroll: {
    paddingHorizontal: 15,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 10,
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
  },
  loadingOverlay: {
    position: "absolute",
    top: 150,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markerBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: "85%",
  },
  modalClose: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },
  modalInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  servicesSection: {
    marginTop: 10,
    marginBottom: 15,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  servicesTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  serviceTag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  serviceTagText: {
    fontSize: 13,
    color: "#1976D2",
    fontWeight: "500",
  },
  envDataSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  envDataTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  aqiCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  aqiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  aqiHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  aqiLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  aqiValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  pollutantsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  pollutantItem: {
    width: "30%",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  pollutantLabel: {
    fontSize: 11,
    color: "#888",
    marginBottom: 4,
  },
  pollutantValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  envDataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  envDataCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 3,
  },
  envDataLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    marginBottom: 4,
  },
  envDataValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  dataTimestamp: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  directionButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  directionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
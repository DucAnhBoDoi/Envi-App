// src/navigation/AppNavigator.js
import React, { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import Screens
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import AQIScreen from "../screens/AQIScreen";
import WasteGuideScreen from "../screens/WasteGuideScreen";
import ReportScreen from "../screens/ReportScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ReportHistoryScreen from "../screens/ReportHistoryScreen";
import ChatHistoryScreen from "../screens/ChatHistoryScreen";
import ChatbotScreen from "../screens/ChatbotScreen";

// 3 màn hình chính từ Home (cũ)
import NotificationsScreen from "../screens/NotificationsScreen";
import CommunityScreen from "../screens/CommunityScreen";
import LearningScreen from "../screens/LearningScreen";
import NotificationDetailScreen from "../screens/NotificationDetailScreen";

// 🆕 3 màn hình mới: Gamification, Map, Analytics
import GamificationScreen from "../screens/GamificationScreen";
import MapScreen from "../screens/MapScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Trang chủ") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Chất lượng không khí") iconName = focused ? "leaf" : "leaf-outline";
          else if (route.name === "Xử lý rác") iconName = focused ? "reload-circle" : "reload-circle-outline";
          else if (route.name === "Báo cáo") iconName = focused ? "alert-circle" : "alert-circle-outline";
          else if (route.name === "Chatbot") iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          else if (route.name === "Tài khoản") iconName = focused ? "person" : "person-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2e7d32",
        tabBarInactiveTintColor: "#999",
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          height: 65 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 8,
          position: "absolute",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 5,
        },
        tabBarItemStyle: {
          marginTop: 5,
        },
      })}
    >
      <Tab.Screen 
        name="Trang chủ" 
        component={HomeScreen} 
        options={{ title: "Trang chủ" }} 
      />
      <Tab.Screen 
        name="Chất lượng không khí" 
        component={AQIScreen} 
        options={{ title: "AQI" }} 
      />
      <Tab.Screen 
        name="Xử lý rác" 
        component={WasteGuideScreen} 
      />
      <Tab.Screen 
        name="Báo cáo" 
        component={ReportScreen} 
        options={{ title: "Báo cáo" }} 
      />
      <Tab.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{ title: "Chatbot" }}
      />
      <Tab.Screen 
        name="Tài khoản" 
        component={ProfileScreen} 
        options={{ title: "Tài khoản" }} 
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Group>
            {/* Tab chính */}
            <Stack.Screen name="MainTabs" component={MainTabs} />

            {/* Các màn hình con - Profile */}
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                headerShown: false,
                title: "Chỉnh sửa hồ sơ",
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#2e7d32",
                headerTitleStyle: { fontWeight: "bold" },
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="ReportHistory"
              component={ReportHistoryScreen}
              options={{
                headerShown: false,
                title: "Lịch sử báo cáo",
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#2e7d32",
                headerTitleStyle: { fontWeight: "bold" },
                animation: "slide_from_right",

              }}
            />
            <Stack.Screen
              name="ChatHistory"
              component={ChatHistoryScreen}
              options={{
                headerShown: false,
                title: "Lịch sử chat",
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#2e7d32",
                headerTitleStyle: { fontWeight: "bold" },
                animation: "slide_from_right",

              }}
            />

            {/* 3 màn hình chính từ Home (cũ) */}
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                headerShown: false,
                title: "Thông báo",
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#2e7d32",
                headerTitleStyle: { fontWeight: "bold" },
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="Community"
              component={CommunityScreen}
              options={{
                headerShown: false,
                title: "Cộng đồng",
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#2e7d32",
                headerTitleStyle: { fontWeight: "bold" },
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="Learning"
              component={LearningScreen}
              options={{
                headerShown: false,
                title: "Học tập",
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#2e7d32",
                headerTitleStyle: { fontWeight: "bold" },
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="NotificationDetail"
              component={NotificationDetailScreen}
              options={{
                headerShown: false,
                title: "Chi tiết thông báo",
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#2e7d32",
                headerTitleStyle: { fontWeight: "bold" },
                animation: "slide_from_right",

              }}
            />

            {/* 🆕 3 màn hình mới: Gamification, Map, Analytics */}
            <Stack.Screen
              name="Gamification"
              component={GamificationScreen}
              options={{
                headerShown: false, // Tự xử lý header trong component
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="MapScreen"
              component={MapScreen}
              options={{
                headerShown: false, // Tự xử lý header trong component
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="Analytics"
              component={AnalyticsScreen}
              options={{
                headerShown: false, // Tự xử lý header trong component
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
          </Stack.Group>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
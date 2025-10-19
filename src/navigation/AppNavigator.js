// src/navigation/AppNavigator.js
import React, { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

// Import Screens
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import AQIScreen from "../screens/AQIScreen";
import ReportScreen from "../screens/ReportScreen";
import ProfileScreen from "../screens/ProfileScreen";
// ✅ THÊM 3 DÒNG NÀY
import EditProfileScreen from "../screens/EditProfileScreen";
import ReportHistoryScreen from "../screens/ReportHistoryScreen";
import ChatHistoryScreen from "../screens/ChatHistoryScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Trang chủ") iconName = "home";
          else if (route.name === "Chất lượng không khí") iconName = "leaf";
          else if (route.name === "Báo cáo") iconName = "alert-circle";
          else if (route.name === "Tài khoản") iconName = "person";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2e7d32",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
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
        name="Báo cáo"
        component={ReportScreen}
        options={{ title: "Báo cáo" }}
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <Stack.Group>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ 
                title: "Chỉnh sửa hồ sơ",
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#2e7d32",
                headerTitleStyle: { fontWeight: "bold" },
              }}
            />
            <Stack.Screen 
              name="ReportHistory" 
              component={ReportHistoryScreen}
              options={{ 
                title: "Lịch sử báo cáo",
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#2e7d32",
                headerTitleStyle: { fontWeight: "bold" },
              }}
            />
            <Stack.Screen 
              name="ChatHistory" 
              component={ChatHistoryScreen}
              options={{ 
                title: "Lịch sử chat",
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#2e7d32",
                headerTitleStyle: { fontWeight: "bold" },
              }}
            />
          </Stack.Group>
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
// App.js
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { UserProvider } from "./src/context/UserContext";
import { PermissionsProvider } from "./src/context/PermissionsContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PermissionsProvider>
          <UserProvider>
            <AppNavigator />
          </UserProvider>
        </PermissionsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
import React from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import { UserProvider } from "./src/context/UserContext"; 
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AuthProvider>
        <UserProvider> 
          <AppNavigator />
        </UserProvider>
      </AuthProvider>
    </>
  );
}
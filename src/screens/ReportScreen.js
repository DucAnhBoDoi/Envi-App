// src/screens/ReportScreen.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚨 Báo cáo vi phạm môi trường</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#e53935" },
});

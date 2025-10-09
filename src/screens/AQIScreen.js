// src/screens/AQIScreen.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AQIScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌫️ Chất lượng không khí</Text>
      <Text style={styles.text}>
        Tính năng hiển thị chỉ số AQI sẽ được cập nhật tại đây.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#2e7d32", marginBottom: 10 },
  text: { textAlign: "center", fontSize: 16 },
});

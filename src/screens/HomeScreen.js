// src/screens/HomeScreen.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌍 Ứng dụng Bảo vệ Môi Trường</Text>
      <Text style={styles.text}>
        Theo dõi chất lượng không khí, xử lý rác đúng cách, báo cáo vi phạm và nhiều hơn nữa.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#2e7d32", marginBottom: 10 },
  text: { textAlign: "center", fontSize: 16 },
});

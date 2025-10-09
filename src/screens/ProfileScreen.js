// src/screens/ProfileScreen.js
import React, { useContext } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: user?.profile?.avatar || "https://i.imgur.com/6VBx3io.png" }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{user?.profile?.name || "Người dùng"}</Text>
      <Text>{user?.email}</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("EditProfile")}
      >
        <Text style={styles.btnText}>Chỉnh sửa hồ sơ</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={logout}>
        <Text style={styles.btnText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  name: { fontSize: 20, fontWeight: "bold" },
  btn: {
    backgroundColor: "#2e7d32",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    width: "60%",
  },
  btnText: { color: "#fff", textAlign: "center" },
});

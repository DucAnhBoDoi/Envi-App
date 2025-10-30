// src/screens/AuthScreen.js
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useGoogleAuth } from "../services/oauthService";

//hehe hoang
// 🔹 Hàm chuyển lỗi Firebase sang tiếng Việt
const getFirebaseErrorMessage = (errorCode) => {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Địa chỉ email không hợp lệ.";
    case "auth/missing-email":
      return "Vui lòng nhập email.";
    case "auth/missing-password":
      return "Vui lòng nhập mật khẩu.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn (ít nhất 6 ký tự).";
    case "auth/email-already-in-use":
      return "Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Mật khẩu không đúng. Vui lòng thử lại.";
    case "auth/user-not-found":
      return "Tài khoản không tồn tại. Vui lòng đăng ký trước.";
    case "auth/too-many-requests":
      return "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.";
    case "auth/network-request-failed":
      return "Không thể kết nối đến máy chủ. Kiểm tra lại kết nối mạng của bạn.";
    default:
      return "Đã xảy ra lỗi. Vui lòng thử lại sau.";
  }
};

export default function AuthScreen({ navigation }) {
  const { signUpWithEmail, signInWithEmail, signInAsGuest, resetPassword } =
    useContext(AuthContext);

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { handleGoogleSignIn } = useGoogleAuth();

  const handleSignUp = async () => {
    if (!email) return Alert.alert("Lỗi", "Vui lòng nhập email để đăng ký.");
    if (!password) return Alert.alert("Lỗi", "Vui lòng nhập mật khẩu.");
    if (!displayName) return Alert.alert("Lỗi", "Vui lòng nhập tên hiển thị.");
    if (password !== confirmPassword)
      return Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
    if (password.length < 6)
      return Alert.alert("Lỗi", "Mật khẩu phải ít nhất 6 ký tự.");

    setLoading(true);
    const result = await signUpWithEmail(email.trim(), password, displayName);
    setLoading(false);

    if (result.success) {
      Alert.alert("Thành công", "Đăng ký thành công!");
      setIsSignUp(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDisplayName("");
    } else {
      Alert.alert("Lỗi", getFirebaseErrorMessage(result.errorCode || result.error));
    }
  };

  const handleSignIn = async () => {
    if (!email) return Alert.alert("Lỗi", "Vui lòng nhập email để đăng nhập.");
    if (!password) return Alert.alert("Lỗi", "Vui lòng nhập mật khẩu.");

    setLoading(true);
    const result = await signInWithEmail(email.trim(), password);
    setLoading(false);

    if (result.success) {
      Alert.alert("Thành công", "Đăng nhập thành công!");
      // Reset form
      setEmail("");
      setPassword("");
    } else {
      Alert.alert("Lỗi", getFirebaseErrorMessage(result.errorCode || result.error));
    }
  };

  const handleResetPassword = async () => {
    if (!email) return Alert.alert("Lỗi", "Vui lòng nhập email");
    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.success) {
      Alert.alert("Thành công", result.message);
      setIsForgotPassword(false);
      setEmail("");
    } else {
      Alert.alert("Lỗi", getFirebaseErrorMessage(result.errorCode || result.error));
    }
  };

  const handleGuestMode = async () => {
    setLoading(true);
    const result = await signInAsGuest("Khách");
    setLoading(false);
    if (!result.success) {
      Alert.alert("Lỗi", getFirebaseErrorMessage(result.errorCode || result.error));
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Đang xử lý...</Text>
      </View>
    );
  }

  if (isForgotPassword) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🌍</Text>
          <Text style={styles.appName}>Bảo Vệ Môi Trường</Text>
        </View>

        <Text style={styles.title}>Đặt lại mật khẩu</Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập email của bạn"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleResetPassword}>
          <Text style={styles.primaryBtnText}>Gửi email đặt lại</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setIsForgotPassword(false)}>
          <Text style={styles.secondaryBtnText}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🌍</Text>
        <Text style={styles.appName}>Bảo Vệ Môi Trường</Text>
      </View>

      <Text style={styles.title}>{isSignUp ? "Đăng ký tài khoản" : "Đăng nhập"}</Text>

      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="Tên của bạn"
          placeholderTextColor="#999"
          value={displayName}
          onChangeText={setDisplayName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="Xác nhận mật khẩu"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={isSignUp ? handleSignUp : handleSignIn}>
        <Text style={styles.primaryBtnText}>{isSignUp ? "Đăng ký" : "Đăng nhập"}</Text>
      </TouchableOpacity>

      {!isSignUp && (
        <TouchableOpacity style={styles.forgotPasswordBtn} onPress={() => setIsForgotPassword(true)}>
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      )}

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>hoặc</Text>
        <View style={styles.dividerLine} />
      </View>
      
      {/* ✅ Chỉ giữ nút Google */}
      <TouchableOpacity
        style={[styles.oauthBtn, { borderColor: "#4285F4" }]}
        onPress={handleGoogleSignIn}
      >
        <Ionicons name="logo-google" size={20} color="#4285F4" style={styles.oauthIcon} />
        <View style={styles.oauthTextContainer}>
          <Text style={styles.oauthBtnText}>Đăng nhập bằng Google</Text>
        </View>
      </TouchableOpacity>

      {/* ✅ Chỉ giữ nút Khách */}
      <TouchableOpacity style={[styles.oauthBtn, { borderColor: "#999" }]} onPress={handleGuestMode}>
        <Ionicons name="person-circle-outline" size={20} color="#555" style={styles.oauthIcon} />
        <View style={styles.oauthTextContainer}>
          <Text style={styles.oauthBtnText}>Tiếp tục với tư cách khách</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.toggleBtnText}>
          {isSignUp ? "Bạn đã có tài khoản? Đăng nhập" : "Bạn chưa có tài khoản? Đăng ký"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContent: { padding: 20, justifyContent: "center", minHeight: "100%" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#2e7d32" },
  logoContainer: { alignItems: "center", marginBottom: 30 },
  logo: { fontSize: 60, marginBottom: 10 },
  appName: { fontSize: 24, fontWeight: "bold", color: "#2e7d32" },
  title: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 20, textAlign: "center" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#333",
  },
  primaryBtn: {
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  secondaryBtn: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2e7d32",
    marginTop: 12,
  },
  secondaryBtnText: { color: "#2e7d32", fontSize: 16, fontWeight: "bold" },
  forgotPasswordBtn: { alignItems: "center", marginTop: 12 },
  forgotPasswordText: { color: "#2e7d32", fontSize: 14, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#ddd" },
  dividerText: { marginHorizontal: 10, color: "#999", fontSize: 14 },
  oauthBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    position: "relative",
  },
  oauthIcon: { width: 30, textAlign: "center", marginRight: 10 },
  oauthTextContainer: { flex: 1, alignItems: "center" },
  oauthBtnText: { fontSize: 14, fontWeight: "600", color: "#333" },
  toggleBtn: { alignItems: "center", marginTop: 15 },
  toggleBtnText: { color: "#2e7d32", fontSize: 14, fontWeight: "600" },
});
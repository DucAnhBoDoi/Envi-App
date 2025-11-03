// src/services/oauthService.js
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = (onLoginSuccess) => {
  const navigation = useNavigation();

  // Tạo request OAuth Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "922974471929-grpuu60g2drbkd81qevpugk8h7s1kmv1.apps.googleusercontent.com",
    webClientId: "922974471929-grpuu60g2drbkd81qevpugk8h7s1kmv1.apps.googleusercontent.com",
    redirectUri: "https://auth.expo.io/@sowsd1/envi-app",
  });

  // Khi có phản hồi từ Google
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;

      // Tạo credential cho Firebase
      const credential = GoogleAuthProvider.credential(null, authentication.accessToken);

      // Đăng nhập Firebase
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          console.log("✅ Đăng nhập Google thành công:", userCredential.user.email);

          if (onLoginSuccess) onLoginSuccess(userCredential.user);

          // 👉 Chuyển sang HomeScreen sau khi đăng nhập
          navigation.reset({
            index: 0,
            routes: [{ name: "HomeScreen" }],
          });
        })
        .catch((error) => {
          console.error("❌ Lỗi Firebase sign-in:", error);
          alert("Không thể đăng nhập bằng Google. Vui lòng thử lại!");
        });
    }
  }, [response]);

  // Hàm khi nhấn nút đăng nhập Google
  const handleGoogleSignIn = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error("❌ Google SignIn error:", error);
    }
  };

  return { handleGoogleSignIn };
};
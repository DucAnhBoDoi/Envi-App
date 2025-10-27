// src/services/oauthService.js
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "./firebaseConfig";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = (onLoginSuccess) => {
  // 👉 Dùng link cố định cho app build thật (không còn bị lỗi SSL)
  const redirectUri = "https://auth.expo.dev/@ducanhbodoi7204/envi-app";

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "909703253627-r2ms4novvg7ljke93vvi53omqfigtko2.apps.googleusercontent.com",
    androidClientId: "909703253627-r2ms4novvg7ljke93vvi53omqfigtko2.apps.googleusercontent.com",
    webClientId: "909703253627-u77vpm8b9us78ido97k533il0mkd96bh.apps.googleusercontent.com",
    redirectUri,
  });

  const handleGoogleSignIn = async () => {
    try {
      const result = await promptAsync();

      if (result?.type === "success") {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);
        console.log("✅ Đăng nhập Firebase bằng Google thành công!");

        if (onLoginSuccess) {
          onLoginSuccess(userCredential.user);
        }
      } else {
        console.log("⚠️ Hủy hoặc lỗi:", result);
      }
    } catch (error) {
      console.log("❌ Google SignIn error:", error);
    }
  };

  return { handleGoogleSignIn };
};

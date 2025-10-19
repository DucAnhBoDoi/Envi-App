//src/services/oauthService.js
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "./firebaseConfig";

WebBrowser.maybeCompleteAuthSession();

// ================= GOOGLE OAUTH =================
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "909703253627-r2ms4novvg7ljke93vvi53omqfigtko2.apps.googleusercontent.com",
    redirectUri: "https://auth.expo.dev/@ducanhbodoi7204/envi-app",
  });

  const handleGoogleSignIn = async () => {
    try {
      const result = await promptAsync();
      console.log("Google result:", result);

      if (result?.type === "success") {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        await signInWithCredential(auth, credential);
        console.log("✅ Đăng nhập Firebase bằng Google thành công!");
      } else {
        console.log("⚠️ Đăng nhập Google bị hủy:", result);
      }
    } catch (error) {
      console.log("❌ Google SignIn error:", error);
    }
  };

  return { handleGoogleSignIn };
};

/*
  HƯỚNG DẪN CẤU HÌNH GOOGLE OAUTH:

  1️⃣ Vào Google Cloud Console: https://console.cloud.google.com
     - Tạo OAuth 2.0 Client ID (Web)
     - Copy Client ID vào expoClientId

  2️⃣ Vào Firebase Console > Authentication > Sign-in Method
     - Bật "Google" đăng nhập
     - Dán Client ID giống ở bước 1

  3️⃣ Trong dự án Expo:
     - Đảm bảo redirectUri đúng:
         "https://auth.expo.dev/@<tên_tài_khoản_expo>/envi-app"
     - Nếu dùng Expo Go, không cần build native.

  ✅ Sau khi cấu hình, chỉ cần gọi:
     const { handleGoogleSignIn } = useGoogleAuth();
     handleGoogleSignIn();
*/

// services/oauthService.js
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "./firebaseConfig";

WebBrowser.maybeCompleteAuthSession();

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
        console.log("Đăng nhập Firebase thành công!");
      } else {
        console.log("Đăng nhập bị hủy:", result);
      }
    } catch (error) {
      console.log("Google SignIn error:", error);
    }
  };

  return { handleGoogleSignIn };
};


// ========== FACEBOOK OAUTH ==========
const facebookConfig = {
  clientId: "YOUR_FACEBOOK_APP_ID", // Thay bằng Facebook App ID
  redirectUrl: "https://auth.expo.io/@YOUR_USERNAME/envi-app",
};

export const useFacebookAuth = () => {
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: facebookConfig.clientId,
    redirectUrl: facebookConfig.redirectUrl,
  });

  const handleFacebookSignIn = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === "success") {
        const { access_token } = result.params;
        const credential = FacebookAuthProvider.credential(access_token);
        await signInWithCredential(auth, credential);
        return { success: true };
      }
      return { success: false, error: "Đăng nhập Facebook bị hủy" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return { handleFacebookSignIn, isLoading: !request };
};

/* 
  HƯỚNG DẪN CẤU HÌNH:

  1. GOOGLE OAUTH:
     - Vào Google Cloud Console: https://console.cloud.google.com
     - Tạo OAuth 2.0 Client ID (Web)
     - Copy Client ID vào googleConfig.clientId
     - Vào Firebase Console > Authentication > Google
     - Bật Google Sign-in

  2. FACEBOOK OAUTH:
     - Vào Facebook Developer: https://developers.facebook.com
     - Tạo App mới
     - Vào Settings > Basic, copy App ID vào facebookConfig.clientId
     - Vào Firebase Console > Authentication > Facebook
     - Bật Facebook Sign-in và nhập App ID + Secret

  3. EXPO:
     - Chạy: eas build:configure
     - Chạy: eas login
     - Thay YOUR_USERNAME bằng Expo username của bạn
*/
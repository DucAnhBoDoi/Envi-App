// src/services/oauthService.js
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = (onLoginSuccess) => {
  const navigation = useNavigation();

  const redirectUri = makeRedirectUri({
    useProxy: true,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "909703253627-r2ms4novvg7ljke93vvi53omqfigtko2.apps.googleusercontent.com",
    iosClientId: "909703253627-krf2fltc6o122733an57f255a8qmjcqf.apps.googleusercontent.com",
    androidClientId: "909703253627-v8nb45e8ehe6vk8prtr6sp7p6fdve23q.apps.googleusercontent.com",
    webClientId: "909703253627-u77vpm8b9us78ido97k533il0mkd96bh.apps.googleusercontent.com",
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      const credential = GoogleAuthProvider.credential(null, authentication.accessToken);

      signInWithCredential(auth, credential)
        .then((userCredential) => {
          console.log("Đăng nhập Google thành công:", userCredential.user.email);
          if (onLoginSuccess) onLoginSuccess(userCredential.user);
          navigation.reset({ index: 0, routes: [{ name: "HomeScreen" }] });
        })
        .catch((error) => {
          console.error("Lỗi Firebase sign-in:", error);
          alert("Không thể đăng nhập bằng Google. Vui lòng thử lại!");
        });
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    try {
      await promptAsync({ useProxy: true });
    } catch (error) {
      console.error("Google SignIn error:", error);
    }
  };

  return { handleGoogleSignIn };
};
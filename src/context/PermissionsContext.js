// src/context/PermissionsContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { AuthContext } from "./AuthContext";
import { Platform, Linking } from "react-native";

export const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
    const { user, guestMode } = useContext(AuthContext);

    const [permissions, setPermissions] = useState({
        location: false,
        notifications: false,
        dataSharing: false,
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPermissions();
    }, [user, guestMode]);

    const loadPermissions = async () => {
        try {
            setLoading(true);
            await checkSystemPermissions();
        } catch (error) {
            console.error("Lỗi load permissions:", error);
        } finally {
            setLoading(false);
        }
    };

    // Kiểm tra quyền hệ thống
    const checkSystemPermissions = async () => {
        try {
            const locationStatus = await Location.getForegroundPermissionsAsync();
            const notificationStatus = await Notifications.getPermissionsAsync();

            const key = guestMode ? "guestPermissions" : `permissions_${user?.uid}`;
            const saved = await AsyncStorage.getItem(key);
            let dataSharingValue = false;

            if (saved) {
                const parsed = JSON.parse(saved);
                dataSharingValue = parsed.dataSharing || false;
            }

            const newPermissions = {
                location: locationStatus.granted,
                notifications: notificationStatus.granted,
                dataSharing: dataSharingValue,
            };

            setPermissions(newPermissions);
            await AsyncStorage.setItem(key, JSON.stringify(newPermissions));

            return newPermissions;
        } catch (error) {
            console.error("Lỗi kiểm tra quyền:", error);
            return permissions;
        }
    };

    const savePermissions = async (newPermissions) => {
        try {
            const key = guestMode ? "guestPermissions" : `permissions_${user?.uid}`;
            await AsyncStorage.setItem(key, JSON.stringify(newPermissions));
        } catch (error) {
            console.error("Lỗi lưu permissions:", error);
        }
    };

    // Mở Settings
    const openAppSettings = () => {
        if (Platform.OS === "ios") {
            Linking.openURL("app-settings:");
        } else {
            Linking.openSettings();
        }
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            const granted = status === "granted";

            await checkSystemPermissions();

            return { success: granted };
        } catch (error) {
            console.error("Lỗi request location:", error);
            return { success: false, error: error.message };
        }
    };

    const requestNotificationPermission = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            const granted = status === "granted";

            await checkSystemPermissions();

            return { success: granted };
        } catch (error) {
            console.error("Lỗi request notification:", error);
            return { success: false, error: error.message };
        }
    };

    const toggleLocationPermission = async () => {
        if (!permissions.location) {
            // Chưa bật → Request quyền
            return await requestLocationPermission();
        } else {
            // Đã bật → Mở Settings để user tắt
            openAppSettings();
            return { success: false, requireSettings: true };
        }
    };

    const toggleNotificationPermission = async () => {
        if (!permissions.notifications) {
            // Chưa bật → Request quyền
            return await requestNotificationPermission();
        } else {
            // Đã bật → Mở Settings để user tắt
            openAppSettings();
            return { success: false, requireSettings: true };
        }
    };

    // Toggle chia sẻ dữ liệu (APP-LEVEL)
    const toggleDataSharing = async () => {
        try {
            const newValue = !permissions.dataSharing;
            const newPermissions = { ...permissions, dataSharing: newValue };
            setPermissions(newPermissions);
            await savePermissions(newPermissions);

            return { success: true, enabled: newValue };
        } catch (error) {
            console.error("Lỗi toggle data sharing:", error);
            return { success: false, error: error.message };
        }
    };

    // Revoke tất cả quyền
    const revokeAllPermissions = async () => {
        try {
            const resetPermissions = {
                location: false,
                notifications: false,
                dataSharing: false,
            };
            setPermissions(resetPermissions);

            const key = guestMode ? "guestPermissions" : `permissions_${user?.uid}`;
            await AsyncStorage.removeItem(key);

            return { success: true };
        } catch (error) {
            console.error("Lỗi revoke permissions:", error);
            return { success: false, error: error.message };
        }
    };

    return (
        <PermissionsContext.Provider
            value={{
                permissions,
                loading,
                requestLocationPermission,
                requestNotificationPermission,
                toggleLocationPermission,
                toggleNotificationPermission,
                toggleDataSharing,
                revokeAllPermissions,
                checkSystemPermissions,
                openAppSettings,
            }}
        >
            {children}
        </PermissionsContext.Provider>
    );
};
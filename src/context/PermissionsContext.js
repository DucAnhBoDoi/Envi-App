// src/context/PermissionsContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { AuthContext } from "./AuthContext";

export const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
    const { user, guestMode } = useContext(AuthContext);

    // Trạng thái quyền
    const [permissions, setPermissions] = useState({
        location: false,
        notifications: false,
        camera: false,
        dataSharing: false,
    });

    const [loading, setLoading] = useState(true);

    // Load trạng thái quyền từ AsyncStorage
    useEffect(() => {
        loadPermissions();
    }, [user, guestMode]);

    const loadPermissions = async () => {
        try {
            setLoading(true);
            const key = guestMode ? "guestPermissions" : `permissions_${user?.uid}`;
            const saved = await AsyncStorage.getItem(key);

            if (saved) {
                setPermissions(JSON.parse(saved));
            } else {
                // Kiểm tra quyền hệ thống hiện tại
                await checkSystemPermissions();
            }
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

            const newPermissions = {
                location: locationStatus.granted,
                notifications: notificationStatus.granted,
                camera: false, // Sẽ check khi cần
                dataSharing: false, // Mặc định không chia sẻ
            };

            setPermissions(newPermissions);
            await savePermissions(newPermissions);
        } catch (error) {
            console.error("Lỗi kiểm tra quyền:", error);
        }
    };

    // Lưu trạng thái quyền
    const savePermissions = async (newPermissions) => {
        try {
            const key = guestMode ? "guestPermissions" : `permissions_${user?.uid}`;
            await AsyncStorage.setItem(key, JSON.stringify(newPermissions));
        } catch (error) {
            console.error("Lỗi lưu permissions:", error);
        }
    };

    // Request quyền vị trí
    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            const granted = status === "granted";

            const newPermissions = { ...permissions, location: granted };
            setPermissions(newPermissions);
            await savePermissions(newPermissions);

            return { success: granted };
        } catch (error) {
            console.error("Lỗi request location:", error);
            return { success: false, error: error.message };
        }
    };

    // Request quyền thông báo
    const requestNotificationPermission = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            const granted = status === "granted";

            const newPermissions = { ...permissions, notifications: granted };
            setPermissions(newPermissions);
            await savePermissions(newPermissions);

            return { success: granted };
        } catch (error) {
            console.error("Lỗi request notification:", error);
            return { success: false, error: error.message };
        }
    };

    // Toggle chia sẻ dữ liệu
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

    // Revoke tất cả quyền (khi xóa tài khoản)
    const revokeAllPermissions = async () => {
        try {
            const resetPermissions = {
                location: false,
                notifications: false,
                camera: false,
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
                toggleDataSharing,
                revokeAllPermissions,
                checkSystemPermissions,
            }}
        >
            {children}
        </PermissionsContext.Provider>
    );
};
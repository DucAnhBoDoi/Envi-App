// src/components/SafeAreaScrollView.js
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SafeAreaScrollView({ children, style, ...props }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={{ 
        paddingTop: insets.top, // ✅ Thêm padding top
        paddingBottom: insets.bottom + 80 
      }}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
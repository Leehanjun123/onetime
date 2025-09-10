import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONTS } from '../config/constants';

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>원데이</Text>
      <Text style={styles.subtitle}>일자리를 더 쉽게</Text>
      <ActivityIndicator 
        size="large" 
        color={COLORS.primary} 
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.gray,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
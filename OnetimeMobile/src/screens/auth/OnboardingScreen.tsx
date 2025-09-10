import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../config/constants';

const OnboardingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>온보딩 화면</Text>
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
    fontSize: FONTS.sizes.xl,
    color: COLORS.dark,
  },
});

export default OnboardingScreen;
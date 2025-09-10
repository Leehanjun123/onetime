import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SCREENS, COLORS } from '../config/constants';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

export type AuthStackParamList = {
  [SCREENS.LOGIN]: undefined;
  [SCREENS.REGISTER]: undefined;
  [SCREENS.FORGOT_PASSWORD]: undefined;
  [SCREENS.ONBOARDING]: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name={SCREENS.LOGIN} 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={SCREENS.REGISTER} 
        component={RegisterScreen}
        options={{ title: '회원가입' }}
      />
      <Stack.Screen 
        name={SCREENS.FORGOT_PASSWORD} 
        component={ForgotPasswordScreen}
        options={{ title: '비밀번호 찾기' }}
      />
      <Stack.Screen 
        name={SCREENS.ONBOARDING} 
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
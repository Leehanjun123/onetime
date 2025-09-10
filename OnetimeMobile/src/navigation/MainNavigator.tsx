import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SCREENS, COLORS } from '../config/constants';
import Icon from 'react-native-vector-icons/FontAwesome5';

import HomeScreen from '../screens/main/HomeScreen';
import JobsScreen from '../screens/jobs/JobsScreen';
import JobDetailScreen from '../screens/jobs/JobDetailScreen';
import ApplicationsScreen from '../screens/applications/ApplicationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const JobsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name={SCREENS.JOBS} 
      component={JobsScreen}
      options={{ title: '일자리' }}
    />
    <Stack.Screen 
      name={SCREENS.JOB_DETAIL} 
      component={JobDetailScreen}
      options={{ title: '일자리 상세' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name={SCREENS.PROFILE} 
      component={ProfileScreen}
      options={{ title: '프로필' }}
    />
    <Stack.Screen 
      name={SCREENS.SETTINGS} 
      component={SettingsScreen}
      options={{ title: '설정' }}
    />
    <Stack.Screen 
      name={SCREENS.NOTIFICATIONS} 
      component={NotificationsScreen}
      options={{ title: '알림' }}
    />
  </Stack.Navigator>
);

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = '';

          switch (route.name) {
            case SCREENS.HOME:
              iconName = 'home';
              break;
            case 'JobsStack':
              iconName = 'briefcase';
              break;
            case SCREENS.APPLICATIONS:
              iconName = 'file-alt';
              break;
            case 'ProfileStack':
              iconName = 'user';
              break;
          }

          return <Icon name={iconName} size={size} color={color} solid={focused} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name={SCREENS.HOME} 
        component={HomeScreen}
        options={{ title: '홈' }}
      />
      <Tab.Screen 
        name="JobsStack" 
        component={JobsStack}
        options={{ title: '일자리' }}
      />
      <Tab.Screen 
        name={SCREENS.APPLICATIONS} 
        component={ApplicationsScreen}
        options={{ title: '지원내역' }}
      />
      <Tab.Screen 
        name="ProfileStack" 
        component={ProfileStack}
        options={{ title: '프로필' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
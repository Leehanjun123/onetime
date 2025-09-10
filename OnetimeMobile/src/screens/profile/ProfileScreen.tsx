import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { COLORS, FONTS, SPACING, SCREENS } from '../../config/constants';
import Icon from 'react-native-vector-icons/FontAwesome5';

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  const menuItems = [
    {
      title: '알림',
      icon: 'bell',
      onPress: () => navigation.navigate(SCREENS.NOTIFICATIONS),
    },
    {
      title: '설정',
      icon: 'cog',
      onPress: () => navigation.navigate(SCREENS.SETTINGS),
    },
    {
      title: '고객센터',
      icon: 'headset',
      onPress: () => Alert.alert('고객센터', '준비 중입니다.'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Icon name="user" size={40} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.role}>
              {user?.role === 'worker' ? '구직자' : '사업자'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>프로필 수정</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <Icon name={item.icon} size={20} color={COLORS.gray} />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Icon name="chevron-right" size={16} color={COLORS.gray} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  name: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  email: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginVertical: SPACING.xs,
  },
  role: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  editButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
  },
  menu: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.dark,
    marginLeft: SPACING.md,
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
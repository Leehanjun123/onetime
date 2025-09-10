import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchNotifications, markAsRead } from '../store/slices/notificationsSlice';
import { COLORS, FONTS, SPACING } from '../config/constants';
import Icon from 'react-native-vector-icons/FontAwesome5';

const NotificationsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, isLoading } = useSelector((state: RootState) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markAsRead(notificationId));
  };

  const renderNotification = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <View style={styles.iconContainer}>
        <Icon 
          name={item.type === 'application' ? 'file-alt' : 'bell'} 
          size={20} 
          color={COLORS.primary} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
          {item.title}
        </Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>{item.createdAt}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>알림이 없습니다.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'flex-start',
  },
  unreadCard: {
    backgroundColor: '#F8F9FF',
    borderColor: COLORS.primaryLight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.md,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  message: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  date: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
  },
});

export default NotificationsScreen;
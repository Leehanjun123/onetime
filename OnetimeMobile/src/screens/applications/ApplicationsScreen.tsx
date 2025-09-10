import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchApplications } from '../../store/slices/applicationsSlice';
import { COLORS, FONTS, SPACING, APPLICATION_STATUS } from '../../config/constants';

const ApplicationsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { applications, isLoading } = useSelector((state: RootState) => state.applications);

  useEffect(() => {
    dispatch(fetchApplications());
  }, [dispatch]);

  const renderApplication = ({ item }: any) => (
    <View style={styles.applicationCard}>
      <Text style={styles.jobTitle}>{item.job?.title}</Text>
      <Text style={styles.company}>{item.job?.business?.name}</Text>
      <View style={styles.statusContainer}>
        <Text style={[
          styles.status,
          { color: APPLICATION_STATUS[item.status as keyof typeof APPLICATION_STATUS]?.color }
        ]}>
          {APPLICATION_STATUS[item.status as keyof typeof APPLICATION_STATUS]?.label}
        </Text>
        <Text style={styles.date}>{item.appliedAt}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={applications}
        renderItem={renderApplication}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>지원 내역이 없습니다.</Text>
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
  applicationCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  jobTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  company: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  status: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
  },
  date: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
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

export default ApplicationsScreen;
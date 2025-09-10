import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchJobs } from '../../store/slices/jobsSlice';
import { COLORS, FONTS, SPACING, SCREENS } from '../../config/constants';

const JobsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { jobs, isLoading, hasMore, page } = useSelector((state: RootState) => state.jobs);

  useEffect(() => {
    dispatch(fetchJobs({ page: 1 }));
  }, [dispatch]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      dispatch(fetchJobs({ page: page + 1 }));
    }
  };

  const renderJob = ({ item }: any) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate(SCREENS.JOB_DETAIL, { jobId: item.id })}
    >
      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.jobCompany}>{item.business?.name}</Text>
      <View style={styles.jobInfo}>
        <Text style={styles.jobWage}>시급 {item.hourlyWage?.toLocaleString()}원</Text>
        <Text style={styles.jobLocation}>{item.location}</Text>
      </View>
      <View style={styles.jobMeta}>
        <Text style={styles.jobDate}>{item.workDate}</Text>
        <Text style={styles.jobStatus}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading ? <ActivityIndicator size="large" color={COLORS.primary} /> : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>일자리가 없습니다.</Text>
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
  jobCard: {
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
  jobCompany: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  jobInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  jobWage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  jobLocation: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
  },
  jobStatus: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.success,
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

export default JobsScreen;
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchRecommendedJobs, fetchNearbyJobs } from '../../store/slices/jobsSlice';
import { COLORS, FONTS, SPACING, CATEGORIES, SCREENS } from '../../config/constants';
import Icon from 'react-native-vector-icons/FontAwesome5';

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { recommendedJobs, nearbyJobs } = useSelector((state: RootState) => state.jobs);

  useEffect(() => {
    dispatch(fetchRecommendedJobs());
    // Get user location and fetch nearby jobs
    // dispatch(fetchNearbyJobs({ latitude: 37.5665, longitude: 126.9780 }));
  }, [dispatch]);

  const renderCategory = ({ item }: any) => (
    <TouchableOpacity style={styles.categoryCard}>
      <Icon name={item.icon} size={24} color={COLORS.primary} />
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

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
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          안녕하세요, {user?.name || '사용자'}님!
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate(SCREENS.NOTIFICATIONS)}>
          <Icon name="bell" size={24} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Icon name="search" size={16} color={COLORS.gray} />
        <Text style={styles.searchPlaceholder}>어떤 일자리를 찾으세요?</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>카테고리</Text>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>추천 일자리</Text>
          <TouchableOpacity onPress={() => navigation.navigate('JobsStack')}>
            <Text style={styles.seeMore}>더보기</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recommendedJobs.slice(0, 5)}
          renderItem={renderJob}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>내 주변 일자리</Text>
          <TouchableOpacity onPress={() => navigation.navigate('JobsStack')}>
            <Text style={styles.seeMore}>더보기</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={nearbyJobs.slice(0, 5)}
          renderItem={renderJob}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  greeting: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  searchPlaceholder: {
    marginLeft: SPACING.sm,
    color: COLORS.gray,
    fontSize: FONTS.sizes.md,
  },
  section: {
    marginVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  seeMore: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    width: 80,
  },
  categoryName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.dark,
    marginTop: SPACING.xs,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
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
});

export default HomeScreen;
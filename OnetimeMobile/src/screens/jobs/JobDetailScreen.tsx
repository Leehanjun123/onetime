import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchJobDetail, applyToJob } from '../../store/slices/jobsSlice';
import { COLORS, FONTS, SPACING } from '../../config/constants';

const JobDetailScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute<any>();
  const { jobId } = route.params;
  const { currentJob, isLoading } = useSelector((state: RootState) => state.jobs);

  useEffect(() => {
    dispatch(fetchJobDetail(jobId));
  }, [dispatch, jobId]);

  const handleApply = () => {
    Alert.alert(
      '지원하기',
      '이 일자리에 지원하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '지원하기',
          onPress: () => {
            dispatch(applyToJob({ jobId }));
            Alert.alert('완료', '지원이 완료되었습니다.');
          },
        },
      ]
    );
  };

  if (isLoading || !currentJob) {
    return (
      <View style={styles.loadingContainer}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{currentJob.title}</Text>
        <Text style={styles.company}>{currentJob.business?.name}</Text>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>근무 정보</Text>
          <Text style={styles.infoText}>• 근무일: {currentJob.workDate}</Text>
          <Text style={styles.infoText}>• 근무시간: {currentJob.startTime} - {currentJob.endTime}</Text>
          <Text style={styles.infoText}>• 시급: {currentJob.hourlyWage?.toLocaleString()}원</Text>
          <Text style={styles.infoText}>• 근무지: {currentJob.address}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>업무 내용</Text>
          <Text style={styles.description}>{currentJob.description}</Text>
        </View>

        {currentJob.requirements && currentJob.requirements.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>우대사항</Text>
            {currentJob.requirements.map((req, index) => (
              <Text key={index} style={styles.infoText}>• {req}</Text>
            ))}
          </View>
        )}

        {currentJob.benefits && currentJob.benefits.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>복리혜택</Text>
            {currentJob.benefits.map((benefit, index) => (
              <Text key={index} style={styles.infoText}>• {benefit}</Text>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>총 예상 급여</Text>
          <Text style={styles.price}>
            {currentJob.totalWage?.toLocaleString()}원
          </Text>
        </View>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>지원하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  company: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.gray,
    marginBottom: SPACING.lg,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  description: {
    fontSize: FONTS.sizes.md,
    color: COLORS.dark,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  price: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
});

export default JobDetailScreen;
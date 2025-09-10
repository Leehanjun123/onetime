import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { AppDispatch, RootState } from '../../store';
import { register } from '../../store/slices/authSlice';
import { COLORS, FONTS, SPACING } from '../../config/constants';

const RegisterScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'worker' as 'worker' | 'business',
  });

  const handleRegister = async () => {
    const { email, password, confirmPassword, name, phone, role } = formData;

    if (!email || !password || !name || !phone) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('오류', '비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    try {
      await dispatch(register({ email, password, name, phone, role })).unwrap();
      Alert.alert('성공', '회원가입이 완료되었습니다.');
    } catch (err) {
      Alert.alert('회원가입 실패', '회원가입에 실패했습니다.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              formData.role === 'worker' && styles.roleButtonActive,
            ]}
            onPress={() => setFormData({ ...formData, role: 'worker' })}
          >
            <Text
              style={[
                styles.roleButtonText,
                formData.role === 'worker' && styles.roleButtonTextActive,
              ]}
            >
              구직자
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleButton,
              formData.role === 'business' && styles.roleButtonActive,
            ]}
            onPress={() => setFormData({ ...formData, role: 'business' })}
          >
            <Text
              style={[
                styles.roleButtonText,
                formData.role === 'business' && styles.roleButtonTextActive,
              ]}
            >
              사업자
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호 (8자 이상)"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호 확인"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="이름"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="전화번호"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '가입 중...' : '회원가입'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  roleButton: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
  },
  roleButtonTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
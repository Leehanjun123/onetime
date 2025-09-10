import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../config/constants';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert('오류', '이메일을 입력해주세요.');
      return;
    }
    Alert.alert('성공', '비밀번호 재설정 링크를 이메일로 전송했습니다.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        가입하신 이메일 주소를 입력하시면{'\n'}
        비밀번호 재설정 링크를 보내드립니다.
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>재설정 링크 전송</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  description: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
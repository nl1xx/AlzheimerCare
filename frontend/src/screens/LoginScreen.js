import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../theme';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLogin = async () => {
    if (!phone || !password) return Alert.alert('Error', 'Please fill all fields');
    
    setLoading(true);
    const result = await login(phone, password);
    setLoading(false);

    if (result.success) {
      navigation.replace('Main');
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  const handleRegister = async () => {
    if (!phone || !password) return Alert.alert('Error', 'Please fill all fields');

    setLoading(true);
    const result = await register(phone, password);
    setLoading(false);

    if (result.success) {
      navigation.replace('Onboarding');
    } else {
      Alert.alert('Registration Failed', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>CareAssist</Text>
        <Text style={styles.slogan}>让照护不再孤单</Text>
      </View>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="手机号"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="密码"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <Button title="登录" onPress={handleLogin} />
            <Button title="注册新账号" type="outline" onPress={handleRegister} />
            <Button title="先体验一下 (游客)" type="outline" onPress={() => navigation.replace('Main')} style={{marginTop: 20}} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.splash,
    justifyContent: 'center',
    padding: spacing.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.s,
  },
  slogan: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: colors.background.card,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.m,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [diagnosis, setDiagnosis] = useState('uncertain'); // yes, no, uncertain
  
  const { user } = useAuth();

  const handleFinish = async () => {
    if (!name || !age) {
      return Alert.alert('提示', '请填写完整信息');
    }

    try {
      await axios.post(`${API_URL}/patient/profile`, {
        userId: user.id,
        name,
        age: parseInt(age),
        diagnosis_status: diagnosis,
        condition_stage: diagnosis === 'yes' ? 'mild' : 'unknown' // Default logic
      });
      navigation.replace('Main');
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  if (step === 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>欢迎使用</Text>
        <Text style={styles.desc}>只需三步，为您定制照护计划。</Text>
        <View style={styles.carouselItem}>
           <Text style={styles.carouselTitle}>了解认知变化</Text>
           <Text style={styles.carouselDesc}>快速评估，掌握病情发展。</Text>
        </View>
        <Button title="下一步" onPress={() => setStep(2)} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>创建照护对象</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>您怎么称呼他/她？</Text>
        <TextInput
          style={styles.input}
          placeholder="如：妈妈、爸爸"
          value={name}
          onChangeText={setName}
        />
        
        <Text style={styles.label}>年龄</Text>
        <TextInput
          style={styles.input}
          placeholder="如：75"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>是否确诊阿尔茨海默？</Text>
        <View style={styles.optionRow}>
          <Button 
            title="是" 
            type={diagnosis === 'yes' ? 'primary' : 'outline'} 
            style={styles.optionBtn} 
            onPress={() => setDiagnosis('yes')} 
          />
          <Button 
            title="否" 
            type={diagnosis === 'no' ? 'primary' : 'outline'} 
            style={styles.optionBtn} 
            onPress={() => setDiagnosis('no')} 
          />
          <Button 
            title="不确定" 
            type={diagnosis === 'uncertain' ? 'primary' : 'outline'} 
            style={styles.optionBtn} 
            onPress={() => setDiagnosis('uncertain')} 
          />
        </View>

        <Button title="完成" onPress={handleFinish} style={{ marginTop: spacing.xl }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background.main,
    padding: spacing.l,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  desc: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  carouselItem: {
    backgroundColor: colors.background.card,
    padding: spacing.xl,
    borderRadius: 20,
    marginBottom: spacing.xl,
    alignItems: 'center',
    height: 200,
    justifyContent: 'center',
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.s,
  },
  carouselDesc: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.s,
    marginTop: spacing.m,
  },
  input: {
    backgroundColor: colors.background.card,
    padding: spacing.m,
    borderRadius: 12,
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionBtn: {
    flex: 1,
    marginHorizontal: 4,
  }
});

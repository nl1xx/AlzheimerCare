import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function EditMedicationScreen({ navigation, route }) {
  const { medication } = route.params;
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state - initialize with medication data
  const [formData, setFormData] = useState({
    name: medication.name || '',
    dosage: medication.dosage || '',
    frequency: medication.frequency || '',
    times: medication.times ? JSON.parse(medication.times) : [],
    startDate: medication.start_date ? new Date(medication.start_date) : new Date(),
    endDate: medication.end_date ? new Date(medication.end_date) : null,
    notes: medication.notes || '',
  });

  // Date picker state
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

  // Time picker state
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(-1);

  useEffect(() => {
    if (user) {
      fetchPatientId();
    }
  }, [user]);

  const fetchPatientId = async () => {
    try {
      const patientRes = await axios.get(`${API_URL}/patient/${user.id}`);
      const patient = patientRes.data.patient;
      setSelectedPatientId(patient?.id);
    } catch (e) {
      console.log(e);
      Alert.alert('错误', '获取患者信息失败');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showStartDatePicker = () => {
    setStartDatePickerVisible(true);
  };

  const hideStartDatePicker = () => {
    setStartDatePickerVisible(false);
  };

  const handleStartDateConfirm = (date) => {
    setFormData(prev => ({
      ...prev,
      startDate: date
    }));
    hideStartDatePicker();
  };

  const showEndDatePicker = () => {
    setEndDatePickerVisible(true);
  };

  const hideEndDatePicker = () => {
    setEndDatePickerVisible(false);
  };

  const handleEndDateConfirm = (date) => {
    setFormData(prev => ({
      ...prev,
      endDate: date
    }));
    hideEndDatePicker();
  };

  const showTimePicker = (index) => {
    setCurrentTimeIndex(index);
    setTimePickerVisible(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisible(false);
    setCurrentTimeIndex(-1);
  };

  const handleTimeConfirm = (date) => {
    const formattedTime = format(date, 'HH:mm');
    const times = [...formData.times];
    
    if (currentTimeIndex >= 0) {
      // Update existing time
      times[currentTimeIndex] = formattedTime;
    } else {
      // Add new time
      times.push(formattedTime);
    }
    
    setFormData(prev => ({
      ...prev,
      times
    }));
    
    hideTimePicker();
  };

  const removeTime = (index) => {
    const times = formData.times.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      times
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.dosage || !formData.frequency || formData.times.length === 0) {
      Alert.alert('提示', '请填写药物名称、剂量、频率和至少一个服药时间');
      return;
    }

    if (!selectedPatientId) {
      Alert.alert('错误', '请先设置照护对象');
      return;
    }

    try {
      setSubmitting(true);
      
      const medicationData = {
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        times: formData.times,
        start_date: format(formData.startDate, 'yyyy-MM-dd'),
        end_date: formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : null,
        notes: formData.notes,
      };

      await axios.put(`${API_URL}/medication/${medication.id}`, medicationData);
      Alert.alert('成功', '药物信息已更新', [
        { text: '确定', onPress: () => navigation.navigate('Medication') }
      ]);
    } catch (e) {
      console.log(e);
      Alert.alert('错误', '更新药物失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>编辑药物</Text>
        <View style={{ width: 24 }} /> {/* Placeholder for centering */}
      </View>

      {/* Form */}
      <ScrollView style={styles.form}>
        {/* Medication Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>药物名称 *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="请输入药物名称"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        {/* Dosage */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>剂量 *</Text>
          <TextInput
            style={styles.input}
            value={formData.dosage}
            onChangeText={(text) => handleInputChange('dosage', text)}
            placeholder="例如：1片，5ml"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        {/* Frequency */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>服用频率 *</Text>
          <TextInput
            style={styles.input}
            value={formData.frequency}
            onChangeText={(text) => handleInputChange('frequency', text)}
            placeholder="例如：每天，每周一、三、五"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        {/* Medication Times */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>服药时间 *</Text>
          
          {/* Time List */}
          {formData.times.map((time, index) => (
            <View key={index} style={styles.timeItem}>
              <TouchableOpacity 
                style={styles.timeButton} 
                onPress={() => showTimePicker(index)}
              >
                <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.timeText}>{time}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => removeTime(index)}
              >
                <Ionicons name="close-circle" size={20} color={colors.status.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Time Button */}
          <TouchableOpacity 
            style={styles.addTimeButton} 
            onPress={() => showTimePicker(-1)}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addTimeText}>添加服药时间</Text>
          </TouchableOpacity>
        </View>

        {/* Start Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>开始日期</Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={showStartDatePicker}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.dateText}>
              {format(formData.startDate, 'yyyy年MM月dd日', { locale: zhCN })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* End Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>结束日期 (可选)</Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={showEndDatePicker}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Text style={[styles.dateText, !formData.endDate && styles.placeholderText]}>
              {formData.endDate ? format(formData.endDate, 'yyyy年MM月dd日', { locale: zhCN }) : '无'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>备注 (可选)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            placeholder="其他需要注意的信息"
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.text.white} />
          ) : (
            <Text style={styles.submitButtonText}>保存修改</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="date"
        onConfirm={handleStartDateConfirm}
        onCancel={hideStartDatePicker}
        locale="zh_CN"
        minimumDate={new Date()}
      />

      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="date"
        onConfirm={handleEndDateConfirm}
        onCancel={hideEndDatePicker}
        locale="zh_CN"
        minimumDate={formData.startDate}
      />

      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={hideTimePicker}
        locale="zh_CN"
        is24Hour={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
    backgroundColor: colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  form: {
    flex: 1,
    padding: spacing.m,
  },
  formGroup: {
    marginBottom: spacing.l,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.s,
    color: colors.text.primary,
  },
  input: {
    backgroundColor: colors.background.card,
    padding: spacing.m,
    borderRadius: borderRadius.m,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.m,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    gap: spacing.s,
  },
  timeText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  removeButton: {
    marginLeft: spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.s,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    gap: spacing.s,
  },
  addTimeText: {
    fontSize: 14,
    color: colors.primary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.m,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    gap: spacing.s,
  },
  dateText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  placeholderText: {
    color: colors.text.secondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.m,
    borderRadius: borderRadius.m,
    alignItems: 'center',
    marginVertical: spacing.l,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

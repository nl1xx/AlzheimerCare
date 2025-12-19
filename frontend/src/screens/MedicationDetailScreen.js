import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function MedicationDetailScreen({ navigation, route }) {
  const { medication } = route.params;
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Parse medication data
  const parsedTimes = medication.times ? JSON.parse(medication.times) : [];
  const parsedStartDate = medication.start_date ? new Date(medication.start_date) : null;
  const parsedEndDate = medication.end_date ? new Date(medication.end_date) : null;

  const handleEditMedication = () => {
    navigation.navigate('EditMedication', { medication });
  };

  const handleDeleteMedication = () => {
    Alert.alert(
      '确认删除',
      `确定要删除药物 "${medication.name}" 吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await axios.delete(`${API_URL}/medication/${medication.id}`);
              Alert.alert('成功', '药物已删除', [
                { text: '确定', onPress: () => navigation.navigate('Medication') }
              ]);
            } catch (e) {
              console.log(e);
              Alert.alert('错误', '删除药物失败，请重试');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleMarkAsTaken = async (time) => {
    try {
      setLoading(true);
      // Get today's date in YYYY-MM-DD format
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Find the reminder for this medication and time
      const remindersRes = await axios.get(`${API_URL}/medication/${medication.id}/reminders`);
      const reminders = remindersRes.data.reminders;
      const todayReminder = reminders.find(r => 
        r.time === time && r.reminder_date === today
      );

      if (todayReminder) {
        // Mark as taken
        await axios.put(`${API_URL}/medication/reminder/${todayReminder.id}/taken`, {
          taken_at: new Date().toISOString()
        });
        Alert.alert('成功', '已标记为已服用');
        // Navigate back to refresh the list
        navigation.goBack();
      } else {
        // Create a reminder for today
        await axios.post(`${API_URL}/medication/${medication.id}/reminder`, {
          time,
          reminder_date: today,
          is_taken: 1,
          taken_at: new Date().toISOString()
        });
        Alert.alert('成功', '已标记为已服用');
        // Navigate back to refresh the list
        navigation.goBack();
      }
    } catch (e) {
      console.log(e);
      Alert.alert('错误', '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>药物详情</Text>
        <View style={{ flexDirection: 'row', gap: spacing.s }}>
          <TouchableOpacity onPress={handleEditMedication}>
            <Ionicons name="create-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteMedication} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Ionicons name="trash-outline" size={24} color={colors.status.danger} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Medication Details */}
      <ScrollView style={styles.content}>
        {/* Basic Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          <DetailItem label="药物名称" value={medication.name} />
          <DetailItem label="剂量" value={medication.dosage} />
          <DetailItem label="服用频率" value={medication.frequency} />
        </Card>

        {/* Medication Schedule */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>服用时间</Text>
          
          {parsedTimes.map((time, index) => (
            <View key={index} style={styles.timeItem}>
              <View style={styles.timeInfo}>
                <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.timeText}>{time}</Text>
              </View>
              <TouchableOpacity 
                style={styles.takeButton} 
                onPress={() => handleMarkAsTaken(time)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.text.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.text.white} />
                    <Text style={styles.takeButtonText}>已服用</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </Card>

        {/* Date Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>时间范围</Text>
          
          <DetailItem 
            label="开始日期" 
            value={parsedStartDate ? format(parsedStartDate, 'yyyy年MM月dd日', { locale: zhCN }) : '未设置'} 
          />
          <DetailItem 
            label="结束日期" 
            value={parsedEndDate ? format(parsedEndDate, 'yyyy年MM月dd日', { locale: zhCN }) : '长期服用'} 
          />
        </Card>

        {/* Notes */}
        {medication.notes && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>备注</Text>
            <Text style={styles.notesText}>{medication.notes}</Text>
          </Card>
        )}

        {/* Medication History */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>服用记录</Text>
          <View style={styles.historyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.historyText}>暂无服用记录</Text>
            <Text style={styles.historySubtext}>点击上方"已服用"按钮记录服药情况</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

// Helper Component: Card
function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

// Helper Component: Detail Item
function DetailItem({ label, value }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  content: {
    flex: 1,
    padding: spacing.m,
  },
  sectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.m,
    color: colors.text.primary,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  takeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.m,
    gap: 4,
  },
  takeButtonText: {
    color: colors.text.white,
    fontSize: 14,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  historyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  historyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  historySubtext: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});
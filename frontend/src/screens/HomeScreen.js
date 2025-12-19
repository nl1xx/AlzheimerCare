import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/patient/${user.id}`);
      setProfile(res.data.patient);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 3.1 Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
           <Text style={{fontSize: 24}}>👵</Text>
        </View>
        <View>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Text style={styles.greeting}>{profile ? profile.name : '未设置照护对象'}</Text>
              <Text style={styles.status}>当前阶段: {profile ? (profile.condition_stage || '未知') : '请完善信息'}</Text>
            </>
          )}
        </View>
      </View>

      {/* 3.2 Core Actions */}
      <View style={styles.actionGrid}>
        <Card style={styles.actionCard} onPress={() => navigation.navigate('CognitiveTest')}>
          <Ionicons name="analytics-outline" size={32} color={colors.primary} />
          <Text style={styles.actionText}>认知评估</Text>
        </Card>
        
        <Card style={styles.actionCard} onPress={() => navigation.navigate('Community')}>
          <Ionicons name="book-outline" size={32} color={colors.accent} />
          <Text style={styles.actionText}>知识/社区</Text>
        </Card>
        
        <Card style={styles.actionCard} onPress={() => navigation.navigate('Vitals')}>
          <Ionicons name="pulse-outline" size={32} color={colors.secondary} />
          <Text style={styles.actionText}>生命体征</Text>
        </Card>
      </View>

      {/* 3.3 Quick Record */}
      <Text style={styles.sectionTitle}>快速记录</Text>
      <Card style={styles.recordCard}>
        <Text style={styles.recordTitle}>今天状态如何？</Text>
        <View style={styles.moodRow}>
          <Ionicons name="happy-outline" size={40} color={colors.status.success} />
          <Ionicons name="meh-outline" size={40} color={colors.status.warning} />
          <Ionicons name="sad-outline" size={40} color={colors.status.danger} />
        </View>
      </Card>

      {/* 3.4 Recommendations */}
      <Text style={styles.sectionTitle}>为您推荐</Text>
      <Card>
        <Text style={styles.articleTitle}>如何应对老人的情绪波动？</Text>
        <Text style={styles.articleDesc}>了解情绪背后的原因，学会共情与转移注意力...</Text>
      </Card>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
    padding: spacing.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.l,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE0B2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  status: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.l,
  },
  actionCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: spacing.l,
    justifyContent: 'center',
  },
  actionText: {
    marginTop: spacing.s,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.s,
    color: colors.text.primary,
  },
  recordCard: {
    marginBottom: spacing.l,
  },
  recordTitle: {
    fontSize: 16,
    marginBottom: spacing.m,
    color: colors.text.primary,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.s,
    color: colors.text.primary,
  },
  articleDesc: {
    fontSize: 14,
    color: colors.text.secondary,
  }
});

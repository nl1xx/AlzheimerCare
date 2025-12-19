import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';
import { useFocusEffect } from '@react-navigation/native';

export default function MedicationScreen({ navigation }) {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchPatientAndMedications();
      }
    }, [user])
  );

  const fetchPatientAndMedications = async () => {
    try {
      setLoading(true);
      // First fetch the patient ID
      const patientRes = await axios.get(`${API_URL}/patient/${user.id}`);
      const patient = patientRes.data.patient;
      setSelectedPatientId(patient?.id);

      // Then fetch medications for this patient
      if (patient?.id) {
        const medsRes = await axios.get(`${API_URL}/medication/${patient.id}`);
        setMedications(medsRes.data.medications || []);
      }
    } catch (e) {
      console.log(e);
      Alert.alert('错误', '获取药物列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    // Navigate to add medication screen (to be created)
    navigation.navigate('AddMedication');
  };

  const handleMedicationPress = (medication) => {
    // Navigate to medication detail screen (to be created)
    navigation.navigate('MedicationDetail', { medication });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>药物管理</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddMedication}
        >
          <Ionicons name="add" size={24} color={colors.text.white} />
        </TouchableOpacity>
      </View>

      {/* Medication List */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.medicationList}>
          {medications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="medical-outline" size={64} color={colors.text.secondary} />
              <Text style={styles.emptyText}>暂无药物记录</Text>
              <TouchableOpacity 
                style={styles.emptyButton} 
                onPress={handleAddMedication}
              >
                <Text style={styles.emptyButtonText}>添加第一个药物</Text>
              </TouchableOpacity>
            </View>
          ) : (
            medications.map((medication) => {
              const times = medication.times ? JSON.parse(medication.times) : [];
              return (
                <Card 
                  key={medication.id} 
                  style={styles.medicationCard}
                  onPress={() => handleMedicationPress(medication)}
                >
                  <View style={styles.medicationHeader}>
                    <View>
                      <Text style={styles.medicationName}>{medication.name}</Text>
                      <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                  </View>
                  <View style={styles.medicationDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                      <Text style={styles.detailText}>{times.join(', ')}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
                      <Text style={styles.detailText}>{medication.frequency}</Text>
                    </View>
                  </View>
                  {medication.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesText}>{medication.notes}</Text>
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.l,
    backgroundColor: colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicationList: {
    flex: 1,
    padding: spacing.m,
  },
  medicationCard: {
    marginBottom: spacing.m,
    padding: spacing.m,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  medicationDosage: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  medicationDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.s,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  notesContainer: {
    marginTop: spacing.s,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  notesText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.m,
    marginBottom: spacing.l,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.m,
  },
  emptyButtonText: {
    color: colors.text.white,
    fontWeight: '600',
  },
});
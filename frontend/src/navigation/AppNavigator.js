import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CognitiveTestScreen from '../screens/CognitiveTestScreen';
import CommunityScreen from '../screens/CommunityScreen';
import VitalsScreen from '../screens/VitalsScreen';
import MedicationScreen from '../screens/MedicationScreen';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';
import EditMedicationScreen from '../screens/EditMedicationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'CognitiveTest') iconName = focused ? 'analytics' : 'analytics-outline';
          else if (route.name === 'Community') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Vitals') iconName = focused ? 'pulse' : 'pulse-outline';
          else if (route.name === 'Medication') iconName = focused ? 'medical' : 'medical-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
      <Tab.Screen name="CognitiveTest" component={CognitiveTestScreen} options={{ title: '认知' }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ title: '知识' }} />
      <Tab.Screen name="Vitals" component={VitalsScreen} options={{ title: '体征' }} />
      <Tab.Screen name="Medication" component={MedicationScreen} options={{ title: '药物' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
      <Stack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
      <Stack.Screen name="EditMedication" component={EditMedicationScreen} />
    </Stack.Navigator>
  );
}

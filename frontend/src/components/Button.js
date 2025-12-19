import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

export default function Button({ title, onPress, type = 'primary', style }) {
  const bg = type === 'outline' ? 'transparent' : (colors[type] || colors.primary);
  const textColor = type === 'outline' ? colors.primary : colors.text.white;
  const border = type === 'outline' ? { borderWidth: 1, borderColor: colors.primary } : {};

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: bg }, border, style]} 
      onPress={onPress}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.s,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

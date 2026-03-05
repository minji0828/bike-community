import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/tokens';

type Props = {
  text: string;
  tone?: 'info' | 'success' | 'warning';
  style?: StyleProp<ViewStyle>;
};

export default function AppChip({ text, tone = 'info', style }: Props) {
  return (
    <View style={[styles.base, toneStyles[tone], style]}>
      <Text style={[styles.label, textStyles[tone]]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '800',
  },
});

const toneStyles = StyleSheet.create({
  info: { backgroundColor: '#e8f0ff' },
  success: { backgroundColor: '#ebffd8' },
  warning: { backgroundColor: '#fff5e4' },
});

const textStyles = StyleSheet.create({
  info: { color: colors.primaryDeep },
  success: { color: '#2a5f00' },
  warning: { color: '#925500' },
});

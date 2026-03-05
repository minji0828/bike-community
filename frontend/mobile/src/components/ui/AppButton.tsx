import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radius, typography } from '../../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
  leftIcon?: ReactNode;
};

export default function AppButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
  style,
  full = false,
  leftIcon,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        full ? styles.full : null,
        variantStyles[variant],
        disabled ? styles.disabled : null,
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      {leftIcon}
      <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  full: { flex: 1 },
  text: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ translateY: 1 }] },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.lime,
  },
  ghost: {
    backgroundColor: colors.softBlue,
  },
  danger: {
    backgroundColor: '#ffe9ec',
  },
});

const textStyles = StyleSheet.create({
  primary: { color: '#ffffff' },
  secondary: { color: '#173d00' },
  ghost: { color: colors.primaryDeep },
  danger: { color: colors.danger },
});

import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function ScreenContainer({ children, style }: Props) {
  return <View style={[styles.base, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: '#f5f9ff',
  },
});

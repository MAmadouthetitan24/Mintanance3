import { View, ViewProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface SeparatorProps extends Omit<ViewProps, 'style'> {
  orientation?: 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
}

export function Separator({ orientation = 'horizontal', style, ...props }: SeparatorProps) {
  const styles = StyleSheet.create({
    separator: {
      backgroundColor: '#e5e7eb',
      ...(orientation === 'horizontal'
        ? {
            height: 1,
            width: '100%',
          }
        : {
            width: 1,
            height: '100%',
          }),
    },
  });

  return <View style={[styles.separator, style]} {...props} />;
} 
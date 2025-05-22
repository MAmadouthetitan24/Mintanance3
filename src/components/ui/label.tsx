import { Text, TextProps, StyleSheet, StyleProp, TextStyle } from 'react-native';

interface LabelProps extends Omit<TextProps, 'style'> {
  style?: StyleProp<TextStyle>;
}

export function Label({ children, style, ...props }: LabelProps) {
  const styles = StyleSheet.create({
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: '#000000',
      marginBottom: 4,
    },
  });

  return (
    <Text style={[styles.label, style]} {...props}>
      {children}
    </Text>
  );
} 
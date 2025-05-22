import { View, ViewProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface CardProps extends Omit<ViewProps, 'style'> {
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style, ...props }: CardProps) {
  const styles = StyleSheet.create({
    card: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  });

  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
} 
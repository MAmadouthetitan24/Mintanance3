import { View, Text, ViewProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface BadgeProps extends Omit<ViewProps, 'style'> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'primary' | 'premium' | 'info';
  style?: StyleProp<ViewStyle>;
}

const badgeStyles = {
  default: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
  },
  secondary: {
    backgroundColor: '#6b7280',
    color: '#ffffff',
  },
  destructive: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#000000',
  },
  success: {
    backgroundColor: '#10b981',
    color: '#ffffff',
  },
  primary: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  },
  premium: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
  },
  info: {
    backgroundColor: '#0ea5e9',
    color: '#ffffff',
  },
} as const;

export function Badge({ variant = 'default', children, style, ...props }: BadgeProps) {
  const styles = StyleSheet.create({
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...badgeStyles[variant],
    },
    text: {
      fontSize: 12,
      fontWeight: '500',
      color: badgeStyles[variant].color,
    },
  });

  return (
    <View style={[styles.badge, style]} {...props}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
} 
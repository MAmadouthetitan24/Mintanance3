import { Pressable, PressableProps, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: 'default' | 'destructive' | 'outline' | 'success';
  loading?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const buttonStyles = {
  default: {
    backgroundColor: '#0284c7',
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
    backgroundColor: '#16a34a',
    color: '#ffffff',
  },
} as const;

export function Button({
  variant = 'default',
  loading = false,
  children,
  style,
  ...props
}: ButtonProps) {
  const styles = StyleSheet.create({
    button: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...buttonStyles[variant],
    },
    text: {
      fontSize: 14,
      fontWeight: '500',
      color: buttonStyles[variant].color,
    },
    disabled: {
      opacity: 0.5,
    },
  });

  return (
    <Pressable
      style={[
        styles.button,
        props.disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <View style={{ marginRight: 8 }}>
          {/* Add loading spinner here */}
        </View>
      ) : null}
      <Text style={styles.text}>
        {children}
      </Text>
    </Pressable>
  );
} 
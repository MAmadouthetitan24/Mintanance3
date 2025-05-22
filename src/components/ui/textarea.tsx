import { TextInput, TextInputProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface TextareaProps extends Omit<TextInputProps, 'style'> {
  style?: StyleProp<ViewStyle>;
}

export function Textarea({ style, ...props }: TextareaProps) {
  const styles = StyleSheet.create({
    textarea: {
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 6,
      padding: 12,
      fontSize: 14,
      color: '#000000',
      backgroundColor: '#ffffff',
      textAlignVertical: 'top',
      minHeight: 100,
    },
  });

  return (
    <TextInput
      style={[styles.textarea, style]}
      multiline
      numberOfLines={4}
      {...props}
    />
  );
} 
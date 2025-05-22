import { Image, ImageProps, StyleSheet, StyleProp, ImageStyle, View, Text } from 'react-native';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const AVATAR_SIZES: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 96,
};

interface AvatarProps extends Omit<ImageProps, 'style' | 'source'> {
  size?: number | AvatarSize;
  style?: StyleProp<ImageStyle>;
  src?: string;
  fallback?: string;
}

export function Avatar({ size = 'md', style, src, fallback, ...props }: AvatarProps) {
  const sizeInPixels = typeof size === 'string' ? AVATAR_SIZES[size] : size;
  const fontSize = sizeInPixels * 0.4;

  const styles = StyleSheet.create({
    container: {
      width: sizeInPixels,
      height: sizeInPixels,
      borderRadius: sizeInPixels / 2,
      backgroundColor: '#e5e7eb',
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: sizeInPixels,
      height: sizeInPixels,
    },
    fallbackText: {
      fontSize,
      fontWeight: '500',
      color: '#6b7280',
    },
  });

  if (!src && fallback) {
    return (
      <View style={[styles.container, style]} {...props}>
        <Text style={styles.fallbackText}>{fallback}</Text>
      </View>
    );
  }

  if (!src) {
    // Show a colored circle as a fallback if no image or fallback text is provided
    return (
      <View style={[styles.container, style]} {...props} />
    );
  }

  const source = { uri: src };

  return (
    <Image 
      source={source}
      style={[styles.container, styles.image, style]} 
      {...props} 
    />
  );
} 
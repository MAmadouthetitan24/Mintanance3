import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary, CameraOptions } from 'react-native-image-picker';
import { Button } from '@/components/ui';

interface ImageUploaderProps {
  onImageSelected: (uri: string) => void;
  placeholder?: string;
  initialImage?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  placeholder = 'Upload Image',
  initialImage,
}) => {
  const [imageUri, setImageUri] = useState<string | undefined>(initialImage);

  const options: CameraOptions = {
    mediaType: 'photo',
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.8,
    includeBase64: false,
    saveToPhotos: false,
  };

  const handleImagePick = () => {
    launchCamera(options, (response) => {
      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]?.uri) {
        const uri = response.assets[0].uri;
        setImageUri(uri);
        onImageSelected(uri);
      }
    });
  };

  const handleImageLibrary = () => {
    launchImageLibrary(options, (response) => {
      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]?.uri) {
        const uri = response.assets[0].uri;
        setImageUri(uri);
        onImageSelected(uri);
      }
    });
  };

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.buttonContainer}>
            <Button
              onPress={handleImagePick}
              variant="outline"
              style={styles.button}
            >
              Retake
            </Button>
            <Button
              onPress={handleImageLibrary}
              variant="outline"
              style={styles.button}
            >
              Choose Another
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>{placeholder}</Text>
          <View style={styles.buttonContainer}>
            <Button
              onPress={handleImagePick}
              variant="default"
              style={{ minWidth: 150 }}
            >
              Take Photo
            </Button>
            <Button
              onPress={handleImageLibrary}
              variant="outline"
              style={{ minWidth: 150 }}
            >
              Choose from Library
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    minWidth: 120,
  },
}); 
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface MediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video' | 'document';
  name: string;
  size: number;
  timestamp: number;
  metadata?: {
    beforeAfter?: 'before' | 'after';
    category?: string;
    description?: string;
    projectId?: string;
  };
}

export class MediaService {
  private static instance: MediaService;
  private mediaCache: Map<string, MediaItem>;

  private constructor() {
    this.mediaCache = new Map();
  }

  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  public getMediaCache(): Map<string, MediaItem> {
    return this.mediaCache;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return cameraStatus === 'granted' && libraryStatus === 'granted';
    }
    return true;
  }

  async pickImage(options: ImagePicker.ImagePickerOptions = {}): Promise<MediaItem | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        ...options,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        if (fileInfo.exists) {
          const mediaItem: MediaItem = {
            id: Date.now().toString(),
            uri: asset.uri,
            type: 'image',
            name: asset.uri.split('/').pop() || 'image.jpg',
            size: fileInfo.size || 0,
            timestamp: Date.now(),
          };
          
          this.mediaCache.set(mediaItem.id, mediaItem);
          return mediaItem;
        }
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    }
  }

  async takePhoto(options: ImagePicker.ImagePickerOptions = {}): Promise<MediaItem | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        ...options,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        if (fileInfo.exists) {
          const mediaItem: MediaItem = {
            id: Date.now().toString(),
            uri: asset.uri,
            type: 'image',
            name: asset.uri.split('/').pop() || 'photo.jpg',
            size: fileInfo.size || 0,
            timestamp: Date.now(),
          };
          
          this.mediaCache.set(mediaItem.id, mediaItem);
          return mediaItem;
        }
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  }

  async pickDocument(): Promise<MediaItem | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      const file = result.assets[0];
      return {
        id: file.uri,
        uri: file.uri,
        type: 'document',
        name: file.name,
        size: file.size || 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error picking document:', error);
      return null;
    }
  }

  async optimizeImage(uri: string, options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}): Promise<string> {
    try {
      const { maxWidth = 1280, maxHeight = 1280, quality = 0.8 } = options;
      
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: maxWidth, height: maxHeight } }],
        { compress: quality, format: SaveFormat.JPEG }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return uri;
    }
  }

  async createBeforeAfterPair(beforeUri: string, afterUri: string): Promise<{
    before: MediaItem;
    after: MediaItem;
  } | null> {
    try {
      const beforeMedia = await this.pickImage();
      if (!beforeMedia) return null;

      const afterMedia = await this.pickImage();
      if (!afterMedia) return null;

      beforeMedia.metadata = { ...beforeMedia.metadata, beforeAfter: 'before' };
      afterMedia.metadata = { ...afterMedia.metadata, beforeAfter: 'after' };

      this.mediaCache.set(beforeMedia.id, beforeMedia);
      this.mediaCache.set(afterMedia.id, afterMedia);

      return { before: beforeMedia, after: afterMedia };
    } catch (error) {
      console.error('Error creating before/after pair:', error);
      return null;
    }
  }

  getMediaItem(id: string): MediaItem | undefined {
    return this.mediaCache.get(id);
  }

  async deleteMediaItem(id: string): Promise<boolean> {
    try {
      const mediaItem = this.mediaCache.get(id);
      if (!mediaItem) return false;

      if (Platform.OS !== 'web') {
        await FileSystem.deleteAsync(mediaItem.uri, { idempotent: true });
      }
      
      this.mediaCache.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting media item:', error);
      return false;
    }
  }

  clearCache(): void {
    this.mediaCache.clear();
  }

  async getFileInfo(uri: string): Promise<{ size: number }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      return {
        size: fileInfo.size || 0,
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  }
} 
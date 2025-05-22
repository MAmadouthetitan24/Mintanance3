import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaService, type MediaItem } from '../../services/MediaService';

interface CloudStorageProps {
  projectId: string;
  onFileUploaded?: (file: MediaItem) => void;
  onFileDeleted?: (fileId: string) => void;
}

interface CloudFile extends MediaItem {
  status: 'uploading' | 'uploaded' | 'error';
  progress?: number;
}

export const CloudStorage: React.FC<CloudStorageProps> = ({
  projectId,
  onFileUploaded,
  onFileDeleted,
}) => {
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mediaService = MediaService.getInstance();

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      // In a real app, you would fetch files from your cloud storage service
      // For now, we'll use the media service cache
      const cachedFiles = Array.from(mediaService.getMediaCache().values())
        .filter((item): item is MediaItem => item.metadata?.projectId === projectId)
        .map(file => ({ ...file, status: 'uploaded' as const }));
      setFiles(cachedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      Alert.alert('Error', 'Failed to load files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async () => {
    try {
      const file = await mediaService.pickDocument();
      if (file) {
        const cloudFile: CloudFile = {
          ...file,
          status: 'uploading',
          progress: 0,
          metadata: {
            ...file.metadata,
            projectId,
          },
        };

        setFiles(prev => [...prev, cloudFile]);

        // Simulate file upload progress
        const uploadInterval = setInterval(() => {
          setFiles(prev =>
            prev.map(f =>
              f.id === cloudFile.id
                ? {
                    ...f,
                    progress: Math.min((f.progress || 0) + 10, 100),
                  }
                : f
            )
          );
        }, 500);

        // Simulate upload completion
        setTimeout(() => {
          clearInterval(uploadInterval);
          setFiles(prev =>
            prev.map(f =>
              f.id === cloudFile.id
                ? {
                    ...f,
                    status: 'uploaded',
                    progress: 100,
                  }
                : f
            )
          );

          if (onFileUploaded) {
            onFileUploaded(cloudFile);
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const success = await mediaService.deleteMediaItem(fileId);
      if (success) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
        if (onFileDeleted) {
          onFileDeleted(fileId);
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      Alert.alert('Error', 'Failed to delete file. Please try again.');
    }
  };

  const renderFileItem = ({ item }: { item: CloudFile }) => (
    <View style={styles.fileItem}>
      <View style={styles.fileInfo}>
        <Ionicons
          name={getFileIcon(item.name)}
          size={24}
          color="#666"
        />
        <View style={styles.fileDetails}>
          <Text style={styles.fileName}>{item.name}</Text>
          <Text style={styles.fileMeta}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.status === 'uploading' && (
        <View style={styles.uploadProgress}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.progressText}>{item.progress}%</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteFile(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  const getFileIcon = (fileName: string): keyof typeof Ionicons.glyphMap => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'document-text';
      case 'doc':
      case 'docx':
        return 'document';
      case 'xls':
      case 'xlsx':
        return 'grid';
      case 'ppt':
      case 'pptx':
        return 'easel';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image';
      default:
        return 'document';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading files...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.fileList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cloud-upload-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No files uploaded yet</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleUploadFile}
      >
        <Ionicons name="cloud-upload" size={24} color="#fff" />
        <Text style={styles.uploadButtonText}>Upload File</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  fileList: {
    padding: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 12,
    color: '#666',
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 
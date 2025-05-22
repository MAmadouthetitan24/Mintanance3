import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { MediaService, type MediaItem } from '../../services/MediaService';

interface DocumentManagerProps {
  jobId: string;
  onDocumentAdded?: (document: MediaItem) => void;
  onDocumentRemoved?: (documentId: string) => void;
}

interface DocumentCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'contract', name: 'Contract', icon: 'document-text' },
  { id: 'permit', name: 'Permit', icon: 'shield-checkmark' },
  { id: 'invoice', name: 'Invoice', icon: 'receipt' },
  { id: 'other', name: 'Other', icon: 'folder' },
];

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  jobId,
  onDocumentAdded,
  onDocumentRemoved,
}) => {
  const [documents, setDocuments] = useState<MediaItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const mediaService = MediaService.getInstance();

  useEffect(() => {
    loadDocuments();
  }, [jobId]);

  const loadDocuments = async () => {
    // In a real app, you would fetch documents from your backend
    // For now, we'll use the media service cache
    const cachedDocuments = Array.from(mediaService.getMediaCache().values())
      .filter((item): item is MediaItem => item.type === 'document');
    setDocuments(cachedDocuments);
  };

  const handleAddDocument = async () => {
    try {
      const document = await mediaService.pickDocument();
      if (document) {
        setDocuments(prev => [...prev, document]);
        if (onDocumentAdded) {
          onDocumentAdded(document);
        }
      }
    } catch (error) {
      console.error('Error adding document:', error);
      Alert.alert('Error', 'Failed to add document. Please try again.');
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      const success = await mediaService.deleteMediaItem(documentId);
      if (success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        if (onDocumentRemoved) {
          onDocumentRemoved(documentId);
        }
      }
    } catch (error) {
      console.error('Error removing document:', error);
      Alert.alert('Error', 'Failed to remove document. Please try again.');
    }
  };

  const handleShareDocument = async (document: MediaItem) => {
    try {
      if (Platform.OS === 'web') {
        // For web, create a download link
        const link = document.uri;
        window.open(link, '_blank');
      } else {
        // For mobile, use the file system API
        const fileInfo = await FileSystem.getInfoAsync(document.uri);
        if (fileInfo.exists) {
          // You would typically implement a custom sharing solution here
          // For now, we'll just show an alert
          Alert.alert('Info', 'Sharing functionality will be implemented in the next version');
        } else {
          Alert.alert('Error', 'Document file not found');
        }
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      Alert.alert('Error', 'Failed to share document. Please try again.');
    }
  };

  const filteredDocuments = selectedCategory === 'all'
    ? documents
    : documents.filter(doc => doc.metadata?.category === selectedCategory);

  const renderDocumentItem = ({ item }: { item: MediaItem }) => (
    <View style={styles.documentItem}>
      <View style={styles.documentInfo}>
        <Ionicons
          name={DOCUMENT_CATEGORIES.find(cat => cat.id === item.metadata?.category)?.icon || 'document'}
          size={24}
          color="#666"
        />
        <View style={styles.documentDetails}>
          <Text style={styles.documentName}>{item.name}</Text>
          <Text style={styles.documentMeta}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.documentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShareDocument(item)}
        >
          <Ionicons name="share-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRemoveDocument(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.categories}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'all' && styles.categoryButtonActive,
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text
            style={[
              styles.categoryText,
              selectedCategory === 'all' && styles.categoryTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {DOCUMENT_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon}
              size={20}
              color={selectedCategory === category.id ? '#007AFF' : '#666'}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredDocuments}
        renderItem={renderDocumentItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.documentList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No documents found</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddDocument}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Document</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  categories: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  categoryButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  categoryText: {
    marginLeft: 4,
    color: '#666',
  },
  categoryTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  documentList: {
    padding: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: '#666',
  },
  documentActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 
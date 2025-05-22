import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwnMessage,
}) => {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Icon name="check" size={16} color="#9CA3AF" />;
      case 'delivered':
        return <Icon name="check-all" size={16} color="#9CA3AF" />;
      case 'read':
        return <Icon name="check-all" size={16} color="#007AFF" />;
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        <Text
          style={[
            styles.text,
            isOwnMessage ? styles.ownText : styles.otherText,
          ]}
        >
          {message.text}
        </Text>
        <View style={styles.metadata}>
          <Text style={styles.timestamp}>
            {format(new Date(message.timestamp), 'HH:mm')}
          </Text>
          {isOwnMessage && getStatusIcon()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 20,
    padding: 12,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    backgroundColor: '#E5E7EB',
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#1F2937',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
}); 
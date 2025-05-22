import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button } from '@/components/ui';
// import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(true);
  // const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { jobId, contractorId } = route.params;

  // useEffect(() => {
  //   connectToSocket();
  //   loadMessages();
  //   return () => {
  //     if (socketRef.current) {
  //       socketRef.current.disconnect();
  //     }
  //   };
  // }, []);

  // const connectToSocket = () => { /* socket.io code commented out */ };

  const loadMessages = async () => {
    try {
      // Fetch previous messages from your API
      const response = await fetch(
        `/api/jobs/${jobId}/messages?contractorId=${contractorId}`
      );
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() /* || !socketRef.current */) return;

    const message: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: 'currentUserId', // Replace with actual user ID
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    setMessages(prev => [...prev, message]);
    setInputText('');

    // socketRef.current.emit('message', message, (ack: { status: string }) => {
    //   if (ack.status === 'success') {
    //     setMessages(prev =>
    //       prev.map(msg =>
    //         msg.id === message.id ? { ...msg, status: 'sent' } : msg
    //       )
    //     );
    //   }
    // });
  };

  // const markMessageAsRead = (messageId: string) => { /* socket.io code commented out */ };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isOwnMessage = message.senderId === 'currentUserId';

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.messageText}>{message.text}</Text>
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>
            {format(new Date(message.timestamp), 'HH:mm')}
          </Text>
          {isOwnMessage && (
            <Text style={styles.status}>
              {message.status === 'sending' && '🕒'}
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {connecting && (
        <View style={styles.connectingBanner}>
          <Text style={styles.connectingText}>Connecting to chat...</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <Button
          onPress={sendMessage}
          disabled={!inputText.trim() || connecting}
        >
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingBanner: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    alignItems: 'center',
  },
  connectingText: {
    color: '#92400E',
    fontSize: 14,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  status: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    marginRight: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 16,
  },
}); 
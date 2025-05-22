import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui';
import { ChatMessage } from './ChatMessage';
import { API_URL } from '../../config';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatRoomProps {
  jobId: string;
  userId: string;
  recipientId: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  jobId,
  userId,
  recipientId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  // const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // useEffect(() => {
  //   // Initialize socket connection
  //   socketRef.current = io(API_URL, {
  //     query: {
  //       jobId,
  //       userId,
  //     },
  //   });

  //   // Listen for incoming messages
  //   socketRef.current.on('message', (message: Message) => {
  //     setMessages(prev => [...prev, message]);
  //     flatListRef.current?.scrollToEnd();
  //   });

  //   // Listen for message status updates
  //   socketRef.current.on('messageStatus', ({ messageId, status }) => {
  //     setMessages(prev =>
  //       prev.map(msg =>
  //         msg.id === messageId ? { ...msg, status } : msg
  //       )
  //     );
  //   });

  //   return () => {
  //     socketRef.current?.disconnect();
  //   };
  // }, [jobId, userId]);

  const sendMessage = () => {
    // if (!newMessage.trim() || !socketRef.current) return;

    const message: Partial<Message> = {
      text: newMessage.trim(),
      senderId: userId,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    // socketRef.current.emit('sendMessage', {
    //   ...message,
    //   recipientId,
    //   jobId,
    // });

    setNewMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ChatMessage
            message={item}
            isOwnMessage={item.senderId === userId}
          />
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <Button
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  messageList: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 12,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    maxHeight: 100,
  },
}); 
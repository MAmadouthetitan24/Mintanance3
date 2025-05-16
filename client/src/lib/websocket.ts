import { useEffect, useState } from 'react';

// WebSocket connection singleton
let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
const listeners = new Map<string, Set<(data: any) => void>>();

// Connect to WebSocket server
export function connectWebSocket(userId: string) {
  if (socket?.readyState === WebSocket.OPEN) {
    // Already connected, just authenticate
    authenticateWebSocket(userId);
    return;
  }
  
  // Close existing connection if any
  if (socket) {
    socket.close();
  }
  
  // Clear any pending reconnect
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  try {
    // Determine WebSocket protocol and URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Create new WebSocket connection
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      // Authenticate after connection is established
      authenticateWebSocket(userId);
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Dispatch message to all registered listeners of this type
        const messageType = data.type || 'unknown';
        const messageListeners = listeners.get(messageType);
        
        if (messageListeners) {
          messageListeners.forEach((listener) => {
            try {
              listener(data);
            } catch (error) {
              console.error('Error in message listener:', error);
            }
          });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected, reconnecting in 5 seconds...');
      // Schedule reconnect
      reconnectTimer = window.setTimeout(() => {
        connectWebSocket(userId);
      }, 5000);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Close will be called automatically after error
    };
  } catch (error) {
    console.error('Failed to connect to WebSocket:', error);
  }
}

// Authenticate with the WebSocket server
function authenticateWebSocket(userId: string) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'auth',
      userId
    }));
  }
}

// Send a message through WebSocket
export function sendWebSocketMessage(message: any) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
    return true;
  }
  return false;
}

// Add a listener for a specific message type
export function addWebSocketListener(type: string, callback: (data: any) => void) {
  if (!listeners.has(type)) {
    listeners.set(type, new Set());
  }
  listeners.get(type)!.add(callback);
  
  // Return function to remove this listener
  return () => {
    const typeListeners = listeners.get(type);
    if (typeListeners) {
      typeListeners.delete(callback);
      if (typeListeners.size === 0) {
        listeners.delete(type);
      }
    }
  };
}

// Hook to connect to WebSocket and handle lifecycle
export function useWebSocket(userId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (!userId) return;
    
    // Connect when component mounts
    connectWebSocket(userId);
    
    // Setup status listener
    const originalOnOpen = socket!.onopen;
    const originalOnClose = socket!.onclose;
    
    socket!.onopen = (event) => {
      setIsConnected(true);
      if (originalOnOpen) originalOnOpen.call(socket, event);
    };
    
    socket!.onclose = (event) => {
      setIsConnected(false);
      if (originalOnClose) originalOnClose.call(socket, event);
    };
    
    // Clean up on unmount
    return () => {
      // No need to disconnect if other components may be using it
      // Just clean up our event listeners
    };
  }, [userId]);
  
  return { isConnected };
}

// Hook for listening to specific WebSocket message types
export function useWebSocketListener<T = any>(type: string, callback: (data: T) => void) {
  useEffect(() => {
    // Register listener when component mounts
    const removeListener = addWebSocketListener(type, callback);
    
    // Clean up on unmount
    return removeListener;
  }, [type, callback]);
}
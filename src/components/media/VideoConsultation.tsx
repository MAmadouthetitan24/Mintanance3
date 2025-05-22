import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  RTCView,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';
import { MediaService } from '../../services/MediaService';

interface VideoConsultationProps {
  roomId: string;
  userId: string;
  onEndCall?: () => void;
}

export const VideoConsultation: React.FC<VideoConsultationProps> = ({
  roomId,
  userId,
  onEndCall,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const mediaService = MediaService.getInstance();

  useEffect(() => {
    requestPermissions();
    initializeWebRTC();
    return () => {
      cleanup();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Camera and microphone permissions granted');
        } else {
          console.log('Camera and microphone permissions denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const initializeWebRTC = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { min: 640 },
          height: { min: 480 },
          frameRate: { min: 30 },
          facingMode: 'user',
        },
      });

      setLocalStream(stream);

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnection.current = pc;

      stream.getTracks().forEach((track: MediaStreamTrack) => {
        pc.addTrack(track, stream);
      });

      // @ts-ignore - The types are not properly defined in react-native-webrtc
      pc.ontrack = (event: any) => {
        setRemoteStream(event.streams[0]);
      };

      // @ts-ignore - The types are not properly defined in react-native-webrtc
      pc.onicecandidate = (event: any) => {
        if (event.candidate) {
          // Send the ICE candidate to the signaling server
          sendIceCandidate(event.candidate);
        }
      };

      // Handle incoming ICE candidates
      // This would typically come from your signaling server
      // pc.addIceCandidate(new RTCIceCandidate(candidate));

      // Create and send offer if this is the initiator
      if (isInitiator()) {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        // Send the offer to the signaling server
        sendOffer(offer);
      }
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
    }
  };

  const isInitiator = () => {
    // Implement your logic to determine if this user is the initiator
    return true;
  };

  const sendOffer = async (offer: RTCSessionDescription) => {
    // Implement your signaling server communication here
    console.log('Sending offer:', offer);
  };

  const sendIceCandidate = async (candidate: RTCIceCandidate) => {
    // Implement your signaling server communication here
    console.log('Sending ICE candidate:', candidate);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const endCall = () => {
    cleanup();
    if (onEndCall) {
      onEndCall();
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {remoteStream && (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        )}
        {localStream && (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
          />
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Text style={styles.controlButtonText}>
            {isMuted ? 'Unmute' : 'Mute'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
          onPress={toggleCamera}
        >
          <Text style={styles.controlButtonText}>
            {isCameraOff ? 'Camera On' : 'Camera Off'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={endCall}
        >
          <Text style={[styles.controlButtonText, styles.endCallText]}>
            End Call
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
  },
  localVideo: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 100,
    height: 150,
    backgroundColor: '#2c3e50',
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    padding: 15,
    borderRadius: 30,
    backgroundColor: '#34495e',
    marginHorizontal: 10,
  },
  controlButtonActive: {
    backgroundColor: '#e74c3c',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  endCallButton: {
    backgroundColor: '#e74c3c',
  },
  endCallText: {
    fontWeight: 'bold',
  },
}); 
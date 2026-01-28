import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function VideoCall() {
  const { contactId, contactName } = useLocalSearchParams<{
    contactId: string;
    contactName: string;
  }>();
  const router = useRouter();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simular conexión
    const timeout = setTimeout(() => setIsConnected(true), 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Remote Video Area */}
      <View style={styles.remoteVideoContainer}>
        {!isConnected ? (
          <View style={styles.connectingContainer}>
            <Text style={styles.connectingText}>Conectando...</Text>
            <Text style={styles.contactName}>{contactName}</Text>
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>📹</Text>
            <Text style={styles.videoLabel}>{contactName}</Text>
          </View>
        )}
      </View>

      {/* Local Video Preview */}
      {isVideoEnabled && (
        <View style={styles.localVideoContainer}>
          <View style={styles.localVideoPlaceholder}>
            <Text style={styles.localVideoText}>Tú</Text>
          </View>
        </View>
      )}

      {/* Call Info */}
      {isConnected && (
        <View style={styles.callInfo}>
          <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
          <View style={styles.qualityIndicator}>
            <View style={[styles.qualityDot, { backgroundColor: '#4ade80' }]} />
            <Text style={styles.qualityText}>Excelente</Text>
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
          <Text style={styles.controlLabel}>{isMuted ? 'Activar' : 'Silenciar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
          onPress={() => setIsVideoEnabled(!isVideoEnabled)}
        >
          <Text style={styles.controlIcon}>{isVideoEnabled ? '📹' : '🚫'}</Text>
          <Text style={styles.controlLabel}>{isVideoEnabled ? 'Cámara' : 'Sin cámara'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={handleEndCall}>
          <Text style={styles.controlIcon}>📞</Text>
          <Text style={[styles.controlLabel, { color: '#fff' }]}>Colgar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlIcon}>🔄</Text>
          <Text style={styles.controlLabel}>Rotar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlIcon}>📺</Text>
          <Text style={styles.controlLabel}>Compartir</Text>
        </TouchableOpacity>
      </View>

      {/* WebRTC Status */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          🔒 Cifrado E2E • WebRTC • React Native
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingContainer: {
    alignItems: 'center',
  },
  connectingText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
  },
  contactName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  videoPlaceholder: {
    width: width * 0.9,
    height: height * 0.6,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    fontSize: 80,
  },
  videoLabel: {
    fontSize: 18,
    color: '#fff',
    marginTop: 10,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0066ff',
  },
  localVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoText: {
    color: '#fff',
    fontSize: 16,
  },
  callInfo: {
    position: 'absolute',
    top: 60,
    left: 20,
    alignItems: 'flex-start',
  },
  callDuration: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  qualityText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 75,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
  },
  controlButtonActive: {
    backgroundColor: '#dc2626',
  },
  endCallButton: {
    backgroundColor: '#dc2626',
  },
  controlIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  controlLabel: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
  },
  statusBar: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    color: '#666',
  },
});

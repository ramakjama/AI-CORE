import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function VideoCalls() {
  const router = useRouter();

  const contacts = [
    { id: '1', name: 'Juan Pérez', status: 'online', avatar: '👨' },
    { id: '2', name: 'María García', status: 'online', avatar: '👩' },
    { id: '3', name: 'Carlos López', status: 'offline', avatar: '👨' },
    { id: '4', name: 'Ana Martínez', status: 'online', avatar: '👩' },
  ];

  const handleStartCall = (contactId: string, contactName: string) => {
    router.push({
      pathname: '/video-call',
      params: { contactId, contactName },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Videollamadas</Text>
        <Text style={styles.subtitle}>Conecta con tu equipo</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disponibles para llamar</Text>
        {contacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            style={styles.contactCard}
            onPress={() => handleStartCall(contact.id, contact.name)}
            disabled={contact.status === 'offline'}
          >
            <View style={styles.contactInfo}>
              <Text style={styles.avatar}>{contact.avatar}</Text>
              <View>
                <Text style={styles.contactName}>{contact.name}</Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: contact.status === 'online' ? '#4ade80' : '#94a3b8' },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {contact.status === 'online' ? 'En línea' : 'No disponible'}
                  </Text>
                </View>
              </View>
            </View>
            {contact.status === 'online' && (
              <View style={styles.callButton}>
                <Text style={styles.callButtonText}>📹 Llamar</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🎥 WebRTC Video Calls</Text>
        <Text style={styles.infoText}>
          Sistema de videollamadas peer-to-peer con:
        </Text>
        <Text style={styles.infoFeature}>• Audio y video en tiempo real</Text>
        <Text style={styles.infoFeature}>• Compartir pantalla</Text>
        <Text style={styles.infoFeature}>• Multi-participante</Text>
        <Text style={styles.infoFeature}>• Cifrado end-to-end</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#0066ff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 5,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  contactCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    fontSize: 40,
    marginRight: 15,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  callButton: {
    backgroundColor: '#0066ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  infoFeature: {
    fontSize: 14,
    color: '#333',
    marginVertical: 3,
  },
});

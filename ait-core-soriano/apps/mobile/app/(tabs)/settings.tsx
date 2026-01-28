import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoAnswer, setAutoAnswer] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
        <Text style={styles.subtitle}>Ajusta tu experiencia</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Notificaciones</Text>
            <Text style={styles.settingDescription}>Recibir alertas de llamadas</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#ccc', true: '#0066ff' }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Modo Oscuro</Text>
            <Text style={styles.settingDescription}>Tema oscuro de la app</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#ccc', true: '#0066ff' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Videollamadas</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-respuesta</Text>
            <Text style={styles.settingDescription}>Contestar automáticamente</Text>
          </View>
          <Switch
            value={autoAnswer}
            onValueChange={setAutoAnswer}
            trackColor={{ false: '#ccc', true: '#0066ff' }}
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📱 AIT-CORE Mobile v1.0.0</Text>
        <Text style={styles.infoText}>Sistema ERP-OS con IA</Text>
        <Text style={styles.infoText}>© 2026 AIN TECH</Text>
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
    backgroundColor: '#ffffff',
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    padding: 15,
    paddingBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
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
    marginVertical: 2,
  },
});

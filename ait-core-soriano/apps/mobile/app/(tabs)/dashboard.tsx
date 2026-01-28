import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function Dashboard() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Bienvenido a AIT-CORE Mobile</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Resumen de Hoy</Text>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Pólizas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Siniestros</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Leads</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎥 Videollamadas Recientes</Text>
        <Text style={styles.emptyText}>No hay videollamadas recientes</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📞 Llamadas VoIP</Text>
        <Text style={styles.emptyText}>Sistema de telefonía listo</Text>
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
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066ff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

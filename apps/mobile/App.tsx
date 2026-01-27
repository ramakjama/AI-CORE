import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface Agent {
  name: string;
  status: string;
}

interface PlatformStatus {
  platform: string;
  version: string;
  modules: number;
  agents: number;
  databases: number;
  status: string;
}

export default function App() {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [agents, setAgents] = useState<Record<string, Agent>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:4000/status').then(r => r.json()),
      fetch('http://localhost:4000/agents').then(r => r.json()),
    ])
      .then(([statusData, agentsData]) => {
        setStatus(statusData);
        setAgents(agentsData.agents || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando AI-CORE...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.header}>
          <Text style={styles.title}>AI-CORE Mobile</Text>
          <Text style={styles.subtitle}>Sistema Operativo de Business Intelligence</Text>
        </View>

        {status ? (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Modulos" value={status.modules.toString()} />
              <StatCard label="Agentes" value={status.agents.toString()} />
              <StatCard label="Databases" value={status.databases.toString()} />
              <StatCard
                label="Estado"
                value={status.status}
                highlight={status.status === 'running'}
              />
            </View>

            <Text style={styles.sectionTitle}>Agentes Disponibles</Text>
            <View style={styles.agentsList}>
              {Object.entries(agents).map(([key, agent]) => (
                <TouchableOpacity key={key} style={styles.agentCard}>
                  <View style={styles.agentStatus} />
                  <Text style={styles.agentName}>{agent.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No se pudo conectar con el servidor</Text>
            <Text style={styles.errorSubtext}>Verifica que el servidor este corriendo</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    width: '47%',
  },
  statCardHighlight: {
    backgroundColor: '#065F46',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  agentsList: {
    gap: 10,
  },
  agentCard: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 12,
  },
  agentName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  errorSubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
});

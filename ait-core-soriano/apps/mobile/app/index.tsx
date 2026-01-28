import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AIT-CORE Mobile</Text>
      <Text style={styles.subtitle}>Sistema ERP-OS con IA</Text>

      <Link href="/(tabs)/dashboard" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Entrar al Dashboard</Text>
        </TouchableOpacity>
      </Link>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#0066ff',
    fontSize: 18,
    fontWeight: '600',
  },
});

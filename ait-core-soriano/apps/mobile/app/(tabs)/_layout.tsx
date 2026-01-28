import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0066ff',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#666' : '#999',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
        },
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="video-calls"
        options={{
          title: 'Videollamadas',
          tabBarLabel: 'Llamadas',
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contactos',
          tabBarLabel: 'Contactos',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuración',
          tabBarLabel: 'Ajustes',
        }}
      />
    </Tabs>
  );
}

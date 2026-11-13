import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import EstadoBackendScreen from './screens/EstadoBackendScreen';
import { colores } from './theme';

const Stack = createNativeStackNavigator();

// Etapa 0: una sola pantalla para verificar la conexión con el back-end.
// Las tabs y el resto de las pantallas llegan en la Etapa 5.
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer documentTitle={{ formatter: () => 'AI Ticket It' }}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colores.primario },
            headerTintColor: colores.sobrePrimario,
          }}
        >
          <Stack.Screen
            name="EstadoBackend"
            component={EstadoBackendScreen}
            options={{ title: 'AI Ticket It' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

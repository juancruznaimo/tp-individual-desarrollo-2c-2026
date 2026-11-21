import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Icono from '../components/Icono';
import { useUsuario } from '../context/UsuarioContext';
import ChatScreen from '../screens/compras/ChatScreen';
import DetalleCompraScreen from '../screens/compras/DetalleCompraScreen';
import MisComprasScreen from '../screens/compras/MisComprasScreen';
import DetalleEventoScreen from '../screens/explorar/DetalleEventoScreen';
import ExplorarScreen from '../screens/explorar/ExplorarScreen';
import ReseniasOrganizadorScreen from '../screens/explorar/ReseniasOrganizadorScreen';
import PerfilScreen from '../screens/perfil/PerfilScreen';
import { MisEventosScreen } from '../screens/Provisoria';
import SeleccionUsuarioScreen from '../screens/SeleccionUsuarioScreen';
import { colores } from '../theme';

const Raiz = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const ExplorarStack = createNativeStackNavigator();
const ComprasStack = createNativeStackNavigator();
const EventosStack = createNativeStackNavigator();

const opcionesHeader = {
  headerStyle: { backgroundColor: colores.superficie },
  headerTintColor: colores.primario,
  headerTitleStyle: { color: colores.texto, fontWeight: '700' },
  headerShadowVisible: true,
};

/** URLs de cada pantalla: el botón "atrás" del navegador funciona y se puede recargar. */
const linking = {
  prefixes: [typeof window !== 'undefined' ? window.location.origin : ''],
  config: {
    screens: {
      SeleccionUsuario: 'ingresar',
      App: {
        screens: {
          ExplorarTab: {
            // Al entrar por URL a un detalle, debajo queda el listado (y aparece "volver").
            initialRouteName: 'Explorar',
            screens: {
              Explorar: '',
              DetalleEvento: 'eventos/:id',
              ReseniasOrganizador: 'organizadores/:id/resenias',
            },
          },
          MisComprasTab: {
            initialRouteName: 'MisCompras',
            screens: {
              MisCompras: 'compras',
              DetalleCompra: 'compras/:id',
              Chat: 'compras/:id/chat',
            },
          },
          MisEventosTab: { screens: { MisEventos: 'mis-eventos' } },
          PerfilTab: 'perfil',
        },
      },
    },
  },
};

function ExplorarNavigator() {
  return (
    <ExplorarStack.Navigator screenOptions={opcionesHeader}>
      <ExplorarStack.Screen
        name="Explorar"
        component={ExplorarScreen}
        options={{ title: 'Explorar' }}
      />
      <ExplorarStack.Screen
        name="DetalleEvento"
        component={DetalleEventoScreen}
        options={{ title: 'Evento' }}
      />
      <ExplorarStack.Screen
        name="ReseniasOrganizador"
        component={ReseniasOrganizadorScreen}
        options={{ title: 'Reseñas del organizador' }}
      />
    </ExplorarStack.Navigator>
  );
}

function ComprasNavigator() {
  return (
    <ComprasStack.Navigator screenOptions={opcionesHeader}>
      <ComprasStack.Screen
        name="MisCompras"
        component={MisComprasScreen}
        options={{ title: 'Mis compras' }}
      />
      <ComprasStack.Screen
        name="DetalleCompra"
        component={DetalleCompraScreen}
        options={{ title: 'Compra' }}
      />
      <ComprasStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
    </ComprasStack.Navigator>
  );
}

function EventosNavigator() {
  return (
    <EventosStack.Navigator screenOptions={opcionesHeader}>
      <EventosStack.Screen
        name="MisEventos"
        component={MisEventosScreen}
        options={{ title: 'Mis eventos' }}
      />
    </EventosStack.Navigator>
  );
}

const iconoTab = (nombre) =>
  function IconoTab({ color, focused }) {
    return <Icono nombre={nombre} color={color} tamanio={focused ? 26 : 24} />;
  };

function TabsNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSecundario,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { minHeight: 60 },
      }}
    >
      <Tabs.Screen
        name="ExplorarTab"
        component={ExplorarNavigator}
        options={{ title: 'Explorar', tabBarIcon: iconoTab('explorar') }}
      />
      <Tabs.Screen
        name="MisComprasTab"
        component={ComprasNavigator}
        options={{ title: 'Mis compras', tabBarIcon: iconoTab('ticket') }}
      />
      <Tabs.Screen
        name="MisEventosTab"
        component={EventosNavigator}
        options={{ title: 'Mis eventos', tabBarIcon: iconoTab('calendario') }}
      />
      <Tabs.Screen
        name="PerfilTab"
        component={PerfilScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: iconoTab('usuario'),
          headerShown: true,
          ...opcionesHeader,
        }}
      />
    </Tabs.Navigator>
  );
}

export default function Navegacion() {
  const { usuario } = useUsuario();

  return (
    <NavigationContainer
      linking={linking}
      documentTitle={{
        formatter: (opciones, ruta) =>
          `${opciones?.title ?? ruta?.name ?? 'Inicio'} · AI Ticket It`,
      }}
    >
      <Raiz.Navigator screenOptions={{ headerShown: false }}>
        {usuario ? (
          <Raiz.Screen name="App" component={TabsNavigator} />
        ) : (
          <Raiz.Screen name="SeleccionUsuario" component={SeleccionUsuarioScreen} />
        )}
      </Raiz.Navigator>
    </NavigationContainer>
  );
}

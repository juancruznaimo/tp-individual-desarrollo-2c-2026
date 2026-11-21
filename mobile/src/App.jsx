import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import BannerConexion from './components/BannerConexion';
import { UsuarioProvider } from './context/UsuarioContext';
import Navegacion from './navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <UsuarioProvider>
        <View style={styles.raiz}>
          <BannerConexion />
          <View style={styles.raiz}>
            <Navegacion />
          </View>
        </View>
      </UsuarioProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
});

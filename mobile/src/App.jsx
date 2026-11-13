import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UsuarioProvider } from './context/UsuarioContext';
import Navegacion from './navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <UsuarioProvider>
        <Navegacion />
      </UsuarioProvider>
    </SafeAreaProvider>
  );
}

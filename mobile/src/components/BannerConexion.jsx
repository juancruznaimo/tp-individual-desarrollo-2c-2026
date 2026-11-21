import { useEffect, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { estaSinConexion, suscribirConexion } from '../api/client';
import { obtenerHealth } from '../api/endpoints';
import { colores, espaciado, radios } from '../theme';
import Icono from './Icono';

const INTERVALO_REINTENTO_MS = 5000;

export default function BannerConexion() {
  const sinConexion = useSyncExternalStore(suscribirConexion, estaSinConexion);
  const insets = useSafeAreaInsets();
  const [probando, setProbando] = useState(false);

  useEffect(() => {
    if (!sinConexion) return undefined;
    const id = setInterval(() => obtenerHealth().catch(() => {}), INTERVALO_REINTENTO_MS);
    return () => clearInterval(id);
  }, [sinConexion]);

  if (!sinConexion) return null;

  const reintentar = () => {
    setProbando(true);
    obtenerHealth()
      .catch(() => {})
      .finally(() => setProbando(false));
  };

  return (
    <View
      style={[styles.banner, { paddingTop: insets.top + espaciado.sm }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Icono nombre="sin-conexion" tamanio={18} color={colores.sobrePrimario} />
      <Text style={styles.texto}>
        Sin conexión con el servidor. Lo que ves puede no estar actualizado.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar conexión"
        onPress={reintentar}
        disabled={probando}
        style={styles.boton}
      >
        {probando ? (
          <ActivityIndicator size="small" color={colores.error} />
        ) : (
          <Text style={styles.textoBoton}>Reintentar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
    paddingBottom: espaciado.sm,
    backgroundColor: colores.error,
  },
  texto: { flex: 1, fontSize: 14, fontWeight: '500', color: colores.sobrePrimario },
  boton: {
    minWidth: 96,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaciado.md,
    borderRadius: radios.pill,
    backgroundColor: colores.sobrePrimario,
  },
  textoBoton: { fontSize: 14, fontWeight: '700', color: colores.error },
});

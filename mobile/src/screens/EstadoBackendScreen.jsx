import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { obtenerHealth } from '../api/sistema';
import { ANCHO_MAXIMO, colores, espaciado } from '../theme';

// Pantalla temporal de la Etapa 0: verifica que el front-end llega al back-end.
export default function EstadoBackendScreen() {
  const [estado, setEstado] = useState({ cargando: true, ok: false, mensaje: '' });

  // Cada vez que cambia `intento` se vuelve a consultar.
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true; // evita actualizar el estado si la pantalla se desmontó
    obtenerHealth().then(
      ({ status }) =>
        vigente && setEstado({ cargando: false, ok: status === 'ok', mensaje: 'Back-end OK' }),
      (error) => vigente && setEstado({ cargando: false, ok: false, mensaje: error.message }),
    );
    return () => {
      vigente = false;
    };
  }, [intento]);

  const verificar = () => {
    setEstado({ cargando: true, ok: false, mensaje: '' });
    setIntento((n) => n + 1);
  };

  return (
    <View style={styles.pantalla}>
      <View style={styles.tarjeta}>
        <Text style={styles.titulo}>Estado del back-end</Text>

        {estado.cargando ? (
          <ActivityIndicator color={colores.primario} size="large" />
        ) : (
          <Text
            accessibilityRole="status"
            style={[styles.estado, { color: estado.ok ? colores.exito : colores.error }]}
          >
            {estado.ok ? '✓ ' : '✕ '}
            {estado.mensaje}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={estado.cargando}
          onPress={verificar}
          style={({ pressed }) => [styles.boton, pressed && styles.botonPresionado]}
        >
          <Text style={styles.textoBoton}>Volver a verificar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.md,
    backgroundColor: colores.fondo,
  },
  tarjeta: {
    width: '100%',
    maxWidth: ANCHO_MAXIMO,
    alignItems: 'center',
    gap: espaciado.md,
    padding: espaciado.lg,
    borderRadius: 16,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  titulo: { fontSize: 18, fontWeight: '600', color: colores.texto },
  estado: { fontSize: 20, fontWeight: '700' },
  boton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: espaciado.lg,
    borderRadius: 12,
    backgroundColor: colores.primario,
  },
  botonPresionado: { opacity: 0.8 },
  textoBoton: { fontSize: 16, fontWeight: '600', color: colores.sobrePrimario },
});

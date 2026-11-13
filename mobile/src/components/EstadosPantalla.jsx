import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colores, espaciado } from '../theme';
import Boton from './Boton';
import Icono from './Icono';

export function Loading({ mensaje = 'Cargando…' }) {
  return (
    <View style={styles.centro} accessibilityRole="progressbar" accessibilityLabel={mensaje}>
      <ActivityIndicator size="large" color={colores.primario} />
    </View>
  );
}

/** Error de carga con botón para reintentar. Distingue la falta de conexión. */
export function ErrorView({ error, onReintentar }) {
  const sinConexion = error?.esDeConexion;
  return (
    <View style={styles.centro}>
      <Icono
        nombre={sinConexion ? 'sin-conexion' : 'alerta'}
        tamanio={40}
        color={colores.textoSecundario}
      />
      <Text style={styles.titulo}>
        {sinConexion ? 'Sin conexión con el servidor' : 'No pudimos cargar esta pantalla'}
      </Text>
      {!sinConexion && error?.message && <Text style={styles.detalle}>{error.message}</Text>}
      {onReintentar && <Boton titulo="Reintentar" variante="secundario" onPress={onReintentar} />}
    </View>
  );
}

export function EmptyView({ icono = 'ticket', titulo, detalle, accion }) {
  return (
    <View style={styles.centro}>
      <Icono nombre={icono} tamanio={40} color={colores.textoSecundario} />
      <Text style={styles.titulo}>{titulo}</Text>
      {detalle && <Text style={styles.detalle}>{detalle}</Text>}
      {accion}
    </View>
  );
}

/** Mensaje de error en línea (ej. al fallar una compra). */
export function MensajeError({ children }) {
  if (!children) return null;
  return (
    <View style={styles.mensajeError} accessibilityRole="alert">
      <Icono nombre="alerta" tamanio={18} color={colores.error} />
      <Text style={styles.textoError}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.md,
    padding: espaciado.xl,
    minHeight: 240,
  },
  titulo: { fontSize: 17, fontWeight: '600', color: colores.texto, textAlign: 'center' },
  detalle: { fontSize: 15, color: colores.textoSecundario, textAlign: 'center' },
  mensajeError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.sm,
    padding: espaciado.md,
    borderRadius: 12,
    backgroundColor: colores.errorSuave,
  },
  textoError: { flex: 1, fontSize: 15, color: colores.error },
});

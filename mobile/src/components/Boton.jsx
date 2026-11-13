import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, radios } from '../theme';
import Icono from './Icono';

const VARIANTES = {
  primario: { fondo: colores.primario, texto: colores.sobrePrimario, borde: colores.primario },
  secundario: { fondo: colores.superficie, texto: colores.primario, borde: colores.primario },
  peligro: { fondo: colores.superficie, texto: colores.error, borde: colores.error },
  texto: { fondo: 'transparent', texto: colores.primario, borde: 'transparent' },
};

export default function Boton({
  titulo,
  onPress,
  variante = 'primario',
  icono,
  cargando = false,
  deshabilitado = false,
  estilo,
  etiquetaAccesible,
}) {
  const v = VARIANTES[variante];
  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiquetaAccesible ?? titulo}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.boton,
        { backgroundColor: v.fondo, borderColor: v.borde },
        (pressed || hovered) && !inactivo && styles.presionado,
        inactivo && styles.inactivo,
        estilo,
      ]}
    >
      <View style={styles.contenido}>
        {cargando ? (
          <ActivityIndicator color={v.texto} size="small" />
        ) : (
          icono && <Icono nombre={icono} color={v.texto} tamanio={18} />
        )}
        <Text style={[styles.texto, { color: v.texto }]}>{titulo}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: espaciado.lg,
    borderRadius: radios.md,
    borderWidth: 1.5,
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.sm,
  },
  texto: { fontSize: 16, fontWeight: '600' },
  presionado: { opacity: 0.85 },
  inactivo: { opacity: 0.5 },
});

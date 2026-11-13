import { Pressable, StyleSheet, Text } from 'react-native';

import { colores, espaciado, radios } from '../theme';
import Icono from './Icono';

/** Chip seleccionable (categorías, filtros de estado, orden). */
export default function Chip({ etiqueta, seleccionado = false, onPress, icono }) {
  const color = seleccionado ? colores.sobrePrimario : colores.texto;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionado }}
      onPress={onPress}
      style={({ hovered }) => [
        styles.chip,
        seleccionado && styles.seleccionado,
        hovered && !seleccionado && styles.hover,
      ]}
    >
      {icono && <Icono nombre={icono} tamanio={16} color={color} />}
      <Text style={[styles.texto, { color }]}>{etiqueta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.xs,
    paddingHorizontal: espaciado.md,
    borderRadius: radios.pill,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  seleccionado: { backgroundColor: colores.primario, borderColor: colores.primario },
  hover: { borderColor: colores.primario },
  texto: { fontSize: 15, fontWeight: '500' },
});

import { StyleSheet, Text, View } from 'react-native';

import { espaciado, estadosCompra, radios } from '../theme';
import Icono from './Icono';

const ICONO_POR_ESTADO = {
  PENDIENTE: 'reloj',
  CONFIRMADA: 'check',
  UTILIZADA: 'ticket',
  CANCELADA: 'cerrar',
  REEMBOLSADA: 'devolucion',
};

/** Chip del estado de una compra: color + ícono + texto (el color nunca es la única señal). */
export default function EstadoBadge({ estado, grande = false }) {
  const { etiqueta, color, fondo } = estadosCompra[estado];
  return (
    <View
      style={[styles.badge, grande && styles.grande, { backgroundColor: fondo }]}
      accessibilityLabel={`Estado: ${etiqueta}`}
    >
      <Icono nombre={ICONO_POR_ESTADO[estado]} tamanio={grande ? 18 : 14} color={color} />
      <Text style={[styles.texto, grande && styles.textoGrande, { color }]}>{etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espaciado.xs,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 4,
    borderRadius: radios.pill,
  },
  grande: { paddingHorizontal: espaciado.md, paddingVertical: espaciado.sm },
  texto: { fontSize: 13, fontWeight: '600' },
  textoGrande: { fontSize: 16 },
});

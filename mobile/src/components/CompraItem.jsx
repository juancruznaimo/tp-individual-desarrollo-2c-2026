import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, radios } from '../theme';
import {
  formatearFechaEvento,
  formatearPrecio,
  nombreCompleto,
  textoDiasRestantes,
} from '../utils/formato';
import EstadoBadge from './EstadoBadge';
import Icono from './Icono';
import Imagen from './Imagen';

export default function CompraItem({ compra, onPress, mostrarComprador = false }) {
  const dias = textoDiasRestantes(compra.diasRestantes);
  const titulo = mostrarComprador ? nombreCompleto(compra.comprador) : compra.evento.nombre;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${titulo}. ${compra.tipoEntrada.nombre} por ${compra.cantidad}. ${dias ?? ''}`}
      onPress={onPress}
      style={({ pressed, hovered }) => [styles.tarjeta, (pressed || hovered) && styles.activa]}
    >
      {!mostrarComprador && (
        <Imagen uri={compra.evento.imagen} estilo={styles.imagen} tamanioIcono={24} />
      )}
      <View style={styles.cuerpo}>
        <Text style={styles.titulo} numberOfLines={2}>
          {titulo}
        </Text>
        {!mostrarComprador && (
          <View style={styles.fila}>
            <Icono nombre="calendario" tamanio={14} color={colores.textoSecundario} />
            <Text style={styles.secundario}>{formatearFechaEvento(compra.evento.fecha)}</Text>
          </View>
        )}
        <Text style={styles.secundario}>
          {compra.tipoEntrada.nombre} × {compra.cantidad} ·{' '}
          <Text style={styles.total}>{formatearPrecio(compra.total)}</Text>
        </Text>
        <View style={[styles.fila, styles.estados]}>
          <EstadoBadge estado={compra.estado} />
          {dias && (
            <View style={styles.dias}>
              <Text style={styles.textoDias}>{dias}</Text>
            </View>
          )}
          {compra.cantidadMensajes > 0 && (
            <View
              style={styles.mensajes}
              accessibilityLabel={`${compra.cantidadMensajes} mensajes`}
            >
              <Icono nombre="mensaje" tamanio={14} color={colores.textoSecundario} />
              <Text style={styles.secundarioChico}>{compra.cantidadMensajes}</Text>
            </View>
          )}
        </View>
      </View>
      <Icono nombre="chevron-derecha" color={colores.textoSecundario} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.md,
    padding: espaciado.md,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  activa: { borderColor: colores.primario },
  imagen: { width: 72, height: 72, borderRadius: radios.md },
  cuerpo: { flex: 1, gap: 4 },
  titulo: { fontSize: 16, fontWeight: '700', color: colores.texto },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secundario: { fontSize: 14, color: colores.textoSecundario },
  secundarioChico: { fontSize: 13, color: colores.textoSecundario },
  total: { fontWeight: '700', color: colores.texto },
  estados: { flexWrap: 'wrap', marginTop: 2 },
  dias: {
    paddingHorizontal: espaciado.sm,
    paddingVertical: 4,
    borderRadius: radios.pill,
    backgroundColor: colores.primario,
  },
  textoDias: { fontSize: 13, fontWeight: '700', color: colores.sobrePrimario },
  mensajes: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});

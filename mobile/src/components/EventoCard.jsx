import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, espaciado, radios } from '../theme';
import { formatearFechaEvento, formatearPrecio } from '../utils/formato';
import { PuntajeOrganizador } from './Estrellas';
import Icono from './Icono';
import Imagen from './Imagen';

/** Tarjeta de evento para listados (Explorar, favoritos). Recibe un EventoResumen. */
export default function EventoCard({ evento, onPress }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${evento.nombre}, ${formatearFechaEvento(evento.fecha)}`}
      onPress={onPress}
      style={({ pressed, hovered }) => [styles.tarjeta, (pressed || hovered) && styles.activa]}
    >
      <View style={styles.imagenContenedor}>
        <Imagen uri={evento.imagen} estilo={styles.imagen} />
        <View style={styles.categoria}>
          <Text style={styles.textoCategoria}>{evento.categoria.nombre}</Text>
        </View>
        {evento.agotado && (
          <View style={styles.agotado}>
            <Text style={styles.textoAgotado}>Agotado</Text>
          </View>
        )}
      </View>

      <View style={styles.cuerpo}>
        <Text style={styles.nombre} numberOfLines={2}>
          {evento.nombre}
        </Text>
        <View style={styles.fila}>
          <Icono nombre="calendario" tamanio={14} color={colores.textoSecundario} />
          <Text style={styles.secundario}>{formatearFechaEvento(evento.fecha)}</Text>
        </View>
        <View style={styles.fila}>
          <Icono nombre="ubicacion" tamanio={14} color={colores.textoSecundario} />
          <Text style={styles.secundario} numberOfLines={1}>
            {evento.lugar}
          </Text>
        </View>
        <View style={[styles.fila, styles.pie]}>
          <PuntajeOrganizador
            puntaje={evento.organizador.puntaje}
            cantidadResenias={evento.organizador.cantidadResenias}
          />
          <Text style={styles.precio}>
            <Text style={styles.desde}>desde </Text>
            {formatearPrecio(evento.precioDesde)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  activa: { borderColor: colores.primario },
  imagenContenedor: { aspectRatio: 16 / 9, backgroundColor: colores.borde },
  imagen: { width: '100%', height: '100%' },
  categoria: {
    position: 'absolute',
    top: espaciado.sm,
    left: espaciado.sm,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 4,
    borderRadius: radios.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  textoCategoria: { fontSize: 12, fontWeight: '600', color: colores.texto },
  agotado: {
    position: 'absolute',
    top: espaciado.sm,
    right: espaciado.sm,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 4,
    borderRadius: radios.pill,
    backgroundColor: colores.error,
  },
  textoAgotado: { fontSize: 12, fontWeight: '700', color: colores.sobrePrimario },
  cuerpo: { padding: espaciado.md, gap: 6 },
  nombre: { fontSize: 17, fontWeight: '700', color: colores.texto },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secundario: { flex: 1, fontSize: 14, color: colores.textoSecundario },
  pie: { justifyContent: 'space-between', marginTop: 4 },
  precio: { fontSize: 16, fontWeight: '700', color: colores.primario },
  desde: { fontSize: 13, fontWeight: '400', color: colores.textoSecundario },
});

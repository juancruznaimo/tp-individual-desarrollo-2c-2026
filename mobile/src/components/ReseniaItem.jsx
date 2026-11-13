import { StyleSheet, Text, View } from 'react-native';

import { colores, espaciado } from '../theme';
import { formatearFechaLarga, nombreCompleto } from '../utils/formato';
import { Estrellas } from './Estrellas';

/** Una reseña (CU-10): evento, estrellas, comentario, autor y fecha. */
export default function ReseniaItem({ resenia, mostrarEvento = true }) {
  return (
    <View style={styles.resenia}>
      <View style={styles.fila}>
        <Estrellas valor={resenia.puntuacion} />
        <Text style={styles.puntuacion}>{resenia.puntuacion.toFixed(1)}</Text>
      </View>
      {mostrarEvento && <Text style={styles.evento}>{resenia.evento.nombre}</Text>}
      <Text style={styles.detalle}>{resenia.detalle}</Text>
      <Text style={styles.autor}>
        {nombreCompleto(resenia.comprador)} · {formatearFechaLarga(resenia.creadaEn)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  resenia: {
    gap: espaciado.xs,
    paddingVertical: espaciado.md,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espaciado.sm },
  puntuacion: { fontSize: 14, fontWeight: '700', color: colores.texto },
  evento: { fontSize: 14, fontWeight: '600', color: colores.primario },
  detalle: { fontSize: 15, lineHeight: 21, color: colores.texto },
  autor: { fontSize: 13, color: colores.textoSecundario },
});

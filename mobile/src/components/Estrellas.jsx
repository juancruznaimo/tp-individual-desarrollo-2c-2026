import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colores, espaciado } from '../theme';
import { formatearPuntaje } from '../utils/formato';
import Icono from './Icono';

/** Una estrella llena, vacía o media (la media se dibuja sobre una vacía). */
function Estrella({ tipo, tamanio }) {
  if (tipo === 'media') {
    return (
      <View style={{ width: tamanio, height: tamanio }}>
        <Icono nombre="estrella" tamanio={tamanio} color={colores.borde} />
        <View style={StyleSheet.absoluteFill}>
          <Icono
            nombre="media-estrella"
            tamanio={tamanio}
            color={colores.estrella}
            relleno={colores.estrella}
          />
        </View>
      </View>
    );
  }
  const llena = tipo === 'llena';
  return (
    <Icono
      nombre="estrella"
      tamanio={tamanio}
      color={llena ? colores.estrella : colores.borde}
      relleno={llena ? colores.estrella : 'none'}
    />
  );
}

const tipoDeEstrella = (valor, n) => {
  if (valor >= n) return 'llena';
  if (valor >= n - 0.5) return 'media';
  return 'vacia';
};

/** Estrellas de solo lectura (admite medias estrellas). */
export function Estrellas({ valor, tamanio = 16 }) {
  return (
    <View
      style={styles.fila}
      accessibilityRole="image"
      accessibilityLabel={`${valor} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Estrella key={n} tipo={tipoDeEstrella(valor, n)} tamanio={tamanio} />
      ))}
    </View>
  );
}

/** "★ 4.5 · 12 reseñas" o "Sin reseñas". */
export function PuntajeOrganizador({ puntaje, cantidadResenias }) {
  return (
    <View style={styles.fila}>
      <Icono
        nombre="estrella"
        tamanio={14}
        color={colores.estrella}
        relleno={puntaje === null ? 'none' : colores.estrella}
      />
      <Text style={styles.puntaje}>
        {formatearPuntaje(puntaje)}
        {puntaje !== null && (
          <Text style={styles.cantidad}>
            {' '}
            · {cantidadResenias} {cantidadResenias === 1 ? 'reseña' : 'reseñas'}
          </Text>
        )}
      </Text>
    </View>
  );
}

/** Selector de puntuación de 1 a 5 en pasos de 0.5 (toque en la mitad izquierda = media). */
export function SelectorEstrellas({ valor, onCambio, tamanio = 36 }) {
  return (
    <View style={styles.fila} accessibilityRole="adjustable" accessibilityLabel="Puntuación">
      {[1, 2, 3, 4, 5].map((n) => {
        return (
          <View key={n} style={{ width: tamanio, height: tamanio }}>
            <Estrella tipo={tipoDeEstrella(valor, n)} tamanio={tamanio} />
            <View style={styles.zonas}>
              <Pressable
                accessibilityLabel={`${n - 0.5} estrellas`}
                style={styles.zona}
                onPress={() => onCambio(n - 0.5)}
              />
              <Pressable
                accessibilityLabel={`${n} estrellas`}
                style={styles.zona}
                onPress={() => onCambio(n)}
              />
            </View>
          </View>
        );
      })}
      <Text style={styles.valorSeleccionado}>{valor ? valor.toFixed(1) : '–'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  puntaje: { fontSize: 14, fontWeight: '600', color: colores.texto, marginLeft: 2 },
  cantidad: { fontWeight: '400', color: colores.textoSecundario },
  zonas: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  zona: { flex: 1 },
  valorSeleccionado: {
    marginLeft: espaciado.sm,
    fontSize: 18,
    fontWeight: '700',
    color: colores.texto,
  },
});

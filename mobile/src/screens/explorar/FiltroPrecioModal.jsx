import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Boton from '../../components/Boton';
import { MensajeError } from '../../components/EstadosPantalla';
import Icono from '../../components/Icono';
import { ANCHO_MAXIMO, colores, espaciado, radios } from '../../theme';

const aNumero = (texto) => (texto.trim() === '' ? undefined : Number(texto));

/** Bottom sheet con el rango de precio (precioMin / precioMax). */
export default function FiltroPrecioModal({ visible, valor, onAplicar, onCerrar }) {
  const [min, setMin] = useState(valor.min?.toString() ?? '');
  const [max, setMax] = useState(valor.max?.toString() ?? '');

  const nMin = aNumero(min);
  const nMax = aNumero(max);
  let error = null;
  if (
    (nMin !== undefined && (Number.isNaN(nMin) || nMin < 0)) ||
    (nMax !== undefined && (Number.isNaN(nMax) || nMax < 0))
  ) {
    error = 'Ingresá montos válidos (números mayores o iguales a 0).';
  } else if (nMin !== undefined && nMax !== undefined && nMin > nMax) {
    error = 'El mínimo no puede ser mayor que el máximo.';
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar} accessibilityLabel="Cerrar" />
      <View style={styles.hoja}>
        <View style={styles.encabezado}>
          <Text accessibilityRole="header" style={styles.titulo}>
            Rango de precio
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={onCerrar}
            style={styles.cerrar}
          >
            <Icono nombre="cerrar" color={colores.texto} />
          </Pressable>
        </View>
        <Text style={styles.ayuda}>
          Se muestran los eventos con al menos un tipo de entrada dentro del rango.
        </Text>

        <View style={styles.campos}>
          <View style={styles.campo}>
            <Text style={styles.etiqueta}>Mínimo ($)</Text>
            <TextInput
              value={min}
              onChangeText={setMin}
              inputMode="numeric"
              placeholder="0"
              placeholderTextColor={colores.textoSecundario}
              style={styles.input}
              accessibilityLabel="Precio mínimo"
            />
          </View>
          <View style={styles.campo}>
            <Text style={styles.etiqueta}>Máximo ($)</Text>
            <TextInput
              value={max}
              onChangeText={setMax}
              inputMode="numeric"
              placeholder="Sin límite"
              placeholderTextColor={colores.textoSecundario}
              style={styles.input}
              accessibilityLabel="Precio máximo"
            />
          </View>
        </View>

        <MensajeError>{error}</MensajeError>

        <View style={styles.acciones}>
          <Boton
            titulo="Limpiar"
            variante="secundario"
            estilo={styles.boton}
            onPress={() => onAplicar({ min: undefined, max: undefined })}
          />
          <Boton
            titulo="Aplicar"
            estilo={styles.boton}
            deshabilitado={Boolean(error)}
            onPress={() => onAplicar({ min: nMin, max: nMax })}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  hoja: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    maxWidth: ANCHO_MAXIMO,
    alignSelf: 'center',
    marginHorizontal: 'auto',
    gap: espaciado.md,
    padding: espaciado.lg,
    paddingBottom: espaciado.xl,
    borderTopLeftRadius: radios.lg,
    borderTopRightRadius: radios.lg,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 20, fontWeight: '700', color: colores.texto },
  cerrar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ayuda: { fontSize: 14, color: colores.textoSecundario },
  campos: { flexDirection: 'row', gap: espaciado.md },
  campo: { flex: 1, gap: espaciado.xs },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto },
  input: {
    minHeight: 48,
    paddingHorizontal: espaciado.md,
    fontSize: 16,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colores.borde,
    color: colores.texto,
  },
  acciones: { flexDirection: 'row', gap: espaciado.md },
  boton: { flex: 1 },
});

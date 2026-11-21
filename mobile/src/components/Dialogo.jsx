import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ANCHO_MAXIMO, colores, espaciado, radios } from '../theme';
import Icono from './Icono';

export default function Dialogo({ visible = true, titulo, onCerrar, children, acciones }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} accessibilityLabel="Cerrar" />
        <View style={styles.caja} accessibilityRole="dialog" aria-modal accessibilityLabel={titulo}>
          <View style={styles.encabezado}>
            <Text accessibilityRole="header" style={styles.titulo}>
              {titulo}
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
          <ScrollView contentContainerStyle={styles.cuerpo}>{children}</ScrollView>
          {acciones && <View style={styles.acciones}>{acciones}</View>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  caja: {
    width: '100%',
    maxWidth: ANCHO_MAXIMO - espaciado.md * 2,
    maxHeight: '90%',
    gap: espaciado.md,
    padding: espaciado.lg,
    borderRadius: radios.lg,
    backgroundColor: colores.superficie,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaciado.sm,
  },
  titulo: { flex: 1, fontSize: 20, fontWeight: '700', color: colores.texto },
  cerrar: {
    width: 44,
    height: 44,
    marginRight: -espaciado.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: { gap: espaciado.md },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.sm },
});

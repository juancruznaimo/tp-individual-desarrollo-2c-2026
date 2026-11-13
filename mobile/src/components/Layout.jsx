import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ANCHO_MAXIMO, colores, espaciado, radios } from '../theme';

/** Centra el contenido con un ancho máximo en pantallas anchas (mobile-first). */
export function Contenedor({ children, anchoMaximo = ANCHO_MAXIMO, estilo }) {
  return <View style={[styles.contenedor, { maxWidth: anchoMaximo }, estilo]}>{children}</View>;
}

/** Pantalla con scroll vertical y contenido centrado. */
export function PantallaScroll({ children, anchoMaximo }) {
  return (
    <ScrollView style={styles.pantalla} contentContainerStyle={styles.scroll}>
      <Contenedor anchoMaximo={anchoMaximo}>{children}</Contenedor>
    </ScrollView>
  );
}

export function Tarjeta({ children, estilo }) {
  return <View style={[styles.tarjeta, estilo]}>{children}</View>;
}

export function TituloSeccion({ children, accion }) {
  return (
    <View style={styles.tituloFila}>
      <Text accessibilityRole="header" style={styles.titulo}>
        {children}
      </Text>
      {accion}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  scroll: { paddingVertical: espaciado.md },
  contenedor: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: espaciado.md,
    gap: espaciado.md,
  },
  tarjeta: {
    padding: espaciado.md,
    gap: espaciado.sm,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  tituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaciado.sm,
  },
  titulo: { fontSize: 18, fontWeight: '700', color: colores.texto },
});

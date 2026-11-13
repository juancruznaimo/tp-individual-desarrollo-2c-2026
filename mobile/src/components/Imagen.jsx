import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { colores } from '../theme';
import Icono from './Icono';

/**
 * Imagen remota con reemplazo: si no hay URL o falla la carga (sin internet, URL rota),
 * muestra un ícono en lugar de un recuadro vacío.
 */
export default function Imagen({ uri, estilo, etiqueta, tamanioIcono = 32 }) {
  const [fallo, setFallo] = useState(false);

  if (!uri || fallo) {
    return (
      <View style={[estilo, styles.reemplazo]} accessibilityLabel={etiqueta}>
        <Icono nombre="ticket" tamanio={tamanioIcono} color={colores.textoSecundario} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={estilo}
      resizeMode="cover"
      accessibilityLabel={etiqueta}
      onError={() => setFallo(true)}
    />
  );
}

const styles = StyleSheet.create({
  reemplazo: { alignItems: 'center', justifyContent: 'center', backgroundColor: colores.borde },
});

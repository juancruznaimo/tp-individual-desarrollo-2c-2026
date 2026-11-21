import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colores, espaciado, radios } from '../theme';
import Icono from './Icono';

export function Campo({ etiqueta, error, ayuda, children, estilo }) {
  return (
    <View style={[styles.campo, estilo]}>
      {etiqueta && <Text style={styles.etiqueta}>{etiqueta}</Text>}
      {children}
      {error ? (
        <View style={styles.error} accessibilityRole="alert">
          <Icono nombre="alerta" tamanio={14} color={colores.error} />
          <Text style={styles.textoError}>{error}</Text>
        </View>
      ) : (
        ayuda && <Text style={styles.ayuda}>{ayuda}</Text>
      )}
    </View>
  );
}

export function CampoTexto({ etiqueta, error, ayuda, estilo, multiline, ...props }) {
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda} estilo={estilo}>
      <TextInput
        accessibilityLabel={etiqueta ?? props.placeholder}
        aria-invalid={Boolean(error)}
        placeholderTextColor={colores.textoSecundario}
        multiline={multiline}
        style={[
          estilosInput.input,
          multiline && estilosInput.multilinea,
          error && estilosInput.conError,
        ]}
        {...props}
      />
    </Campo>
  );
}

export const estilosInput = StyleSheet.create({
  input: {
    minHeight: 48,
    paddingHorizontal: espaciado.md,
    paddingVertical: 10,
    fontSize: 16,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
    color: colores.texto,
  },
  multilinea: { minHeight: 110, textAlignVertical: 'top' },
  conError: { borderColor: colores.error },
});

const styles = StyleSheet.create({
  campo: { gap: espaciado.xs },
  etiqueta: { fontSize: 15, fontWeight: '600', color: colores.texto },
  ayuda: { fontSize: 13, color: colores.textoSecundario },
  error: { flexDirection: 'row', alignItems: 'center', gap: espaciado.xs },
  textoError: { flex: 1, fontSize: 13, color: colores.error },
});

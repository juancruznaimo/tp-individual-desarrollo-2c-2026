import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { reseniarEvento } from '../../api/endpoints';
import Boton from '../../components/Boton';
import Dialogo from '../../components/Dialogo';
import { MensajeError } from '../../components/EstadosPantalla';
import { SelectorEstrellas } from '../../components/Estrellas';
import { colores, espaciado, radios } from '../../theme';

const LARGO_MAXIMO = 1000;

export default function ReseniaModal({ evento, onCerrar, onReseniado }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const valido = puntuacion >= 1 && detalle.trim().length > 0;

  const enviar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const resenia = await reseniarEvento(evento.id, { puntuacion, detalle: detalle.trim() });
      onReseniado(resenia);
    } catch (e) {
      setError(e.detalles?.map((d) => d.mensaje).join('. ') || e.message);
      setEnviando(false);
    }
  };

  return (
    <Dialogo
      titulo="Calificar evento"
      onCerrar={onCerrar}
      acciones={
        <>
          <Boton titulo="Cancelar" variante="secundario" onPress={onCerrar} estilo={styles.boton} />
          <Boton
            titulo="Publicar"
            onPress={enviar}
            cargando={enviando}
            deshabilitado={!valido}
            estilo={styles.boton}
          />
        </>
      }
    >
      <Text style={styles.evento}>{evento.nombre}</Text>
      <Text style={styles.etiqueta}>¿Cómo fue tu experiencia?</Text>
      <SelectorEstrellas valor={puntuacion} onCambio={setPuntuacion} />
      <Text style={styles.etiqueta}>Comentario</Text>
      <TextInput
        value={detalle}
        onChangeText={setDetalle}
        multiline
        maxLength={LARGO_MAXIMO}
        placeholder="Contá qué te pareció el evento, el lugar, la organización…"
        placeholderTextColor={colores.textoSecundario}
        style={styles.input}
        accessibilityLabel="Comentario"
      />
      <Text style={styles.contador}>
        {detalle.length}/{LARGO_MAXIMO}
      </Text>
      <Text style={styles.ayuda}>Tu reseña se va a ver en los eventos del organizador.</Text>
      <MensajeError>{error}</MensajeError>
    </Dialogo>
  );
}

const styles = StyleSheet.create({
  evento: { fontSize: 16, fontWeight: '600', color: colores.primario },
  etiqueta: { fontSize: 15, fontWeight: '600', color: colores.texto },
  input: {
    minHeight: 110,
    padding: espaciado.md,
    fontSize: 16,
    textAlignVertical: 'top',
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colores.borde,
    color: colores.texto,
  },
  contador: {
    marginTop: -espaciado.sm,
    fontSize: 13,
    color: colores.textoSecundario,
    textAlign: 'right',
  },
  ayuda: { fontSize: 14, color: colores.textoSecundario },
  boton: { flex: 1 },
});

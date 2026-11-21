import { useLayoutEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { obtenerCompra } from '../../api/endpoints';
import { EmptyView, ErrorView, Loading, MensajeError } from '../../components/EstadosPantalla';
import Icono from '../../components/Icono';
import { useApi } from '../../hooks/useApi';
import { useMensajes } from '../../hooks/useMensajes';
import { ANCHO_MAXIMO, colores, espaciado, radios } from '../../theme';
import { formatearFechaYHora, nombreCompleto } from '../../utils/formato';

const LARGO_MAXIMO = 1000;

export default function ChatScreen({ route, navigation }) {
  const { id } = route.params;
  const { data: compra } = useApi(() => obtenerCompra(id), id);
  const { mensajes, error, enviar, reintentar } = useMensajes(id);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const lista = useRef(null);

  const otro = compra
    ? compra.rol === 'COMPRADOR'
      ? compra.evento.organizador
      : compra.comprador
    : null;

  const tituloChat = otro ? nombreCompleto(otro) : null;

  useLayoutEffect(() => {
    if (tituloChat) navigation.setOptions({ title: tituloChat });
  }, [navigation, tituloChat]);

  if (!mensajes && error) return <ErrorView error={error} onReintentar={reintentar} />;
  if (!mensajes) return <Loading />;

  const limpio = texto.trim();
  const puedeEnviar = limpio.length > 0 && !enviando;

  const confirmar = async () => {
    if (!puedeEnviar) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await enviar(limpio);
      setTexto('');
    } catch (e) {
      setErrorEnvio(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.pantalla}>
      {compra && (
        <View style={styles.contexto}>
          <Text style={styles.contextoTexto} numberOfLines={1}>
            {compra.rol === 'COMPRADOR' ? 'Organizador' : 'Comprador'} · {compra.evento.nombre}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.avisoConexion}>
          <MensajeError>
            {error.esDeConexion
              ? 'Sin conexión: los mensajes nuevos van a aparecer cuando vuelva.'
              : error.message}
          </MensajeError>
        </View>
      )}

      <FlatList
        ref={lista}
        data={mensajes}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <Burbuja mensaje={item} />}
        style={styles.lista}
        contentContainerStyle={styles.contenidoLista}
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <EmptyView
            icono="mensaje"
            titulo="Todavía no hay mensajes"
            detalle={
              compra?.rol === 'ORGANIZADOR'
                ? 'Escribile al comprador por cualquier consulta sobre su compra.'
                : 'Consultá al organizador sobre el evento, el acceso o cambios de fecha.'
            }
          />
        }
      />

      <View style={styles.barra}>
        <View style={styles.barraContenido}>
          <MensajeError>{errorEnvio}</MensajeError>
          <View style={styles.fila}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Escribí un mensaje…"
              placeholderTextColor={colores.textoSecundario}
              multiline
              maxLength={LARGO_MAXIMO}
              style={styles.input}
              accessibilityLabel="Mensaje"
              onKeyPress={(e) => {
                if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                  e.preventDefault();
                  confirmar();
                }
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar"
              accessibilityState={{ disabled: !puedeEnviar, busy: enviando }}
              disabled={!puedeEnviar}
              onPress={confirmar}
              style={[styles.enviar, !puedeEnviar && styles.enviarInactivo]}
            >
              <Icono nombre="enviar" color={colores.sobrePrimario} />
            </Pressable>
          </View>
          {texto.length > LARGO_MAXIMO * 0.9 && (
            <Text style={styles.contador}>
              {texto.length}/{LARGO_MAXIMO}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function Burbuja({ mensaje }) {
  const mio = mensaje.esMio;
  return (
    <View style={[styles.filaBurbuja, mio ? styles.derecha : styles.izquierda]}>
      <View style={[styles.burbuja, mio ? styles.burbujaMia : styles.burbujaOtro]}>
        <Text style={[styles.textoBurbuja, mio && styles.textoMio]}>{mensaje.mensaje}</Text>
        <Text style={[styles.hora, mio && styles.horaMia]}>
          {formatearFechaYHora(mensaje.enviado)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contexto: {
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  contextoTexto: {
    width: '100%',
    maxWidth: ANCHO_MAXIMO,
    alignSelf: 'center',
    fontSize: 14,
    color: colores.textoSecundario,
  },
  avisoConexion: { padding: espaciado.sm },
  lista: { flex: 1 },
  contenidoLista: {
    flexGrow: 1,
    width: '100%',
    maxWidth: ANCHO_MAXIMO,
    alignSelf: 'center',
    gap: espaciado.sm,
    padding: espaciado.md,
  },
  filaBurbuja: { flexDirection: 'row' },
  derecha: { justifyContent: 'flex-end' },
  izquierda: { justifyContent: 'flex-start' },
  burbuja: {
    maxWidth: '80%',
    gap: 2,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    borderRadius: radios.lg,
  },
  burbujaMia: { borderBottomRightRadius: radios.sm, backgroundColor: colores.primario },
  burbujaOtro: {
    borderBottomLeftRadius: radios.sm,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  textoBurbuja: { fontSize: 16, lineHeight: 22, color: colores.texto },
  textoMio: { color: colores.sobrePrimario },
  hora: { alignSelf: 'flex-end', fontSize: 12, color: colores.textoSecundario },
  horaMia: { color: 'rgba(255,255,255,0.8)' },
  barra: {
    padding: espaciado.sm,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  barraContenido: { width: '100%', maxWidth: ANCHO_MAXIMO, alignSelf: 'center', gap: espaciado.xs },
  fila: { flexDirection: 'row', alignItems: 'flex-end', gap: espaciado.sm },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: espaciado.md,
    paddingVertical: 10,
    fontSize: 16,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: colores.borde,
    color: colores.texto,
  },
  enviar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radios.pill,
    backgroundColor: colores.primario,
  },
  enviarInactivo: { opacity: 0.4 },
  contador: { fontSize: 12, color: colores.textoSecundario, textAlign: 'right' },
});

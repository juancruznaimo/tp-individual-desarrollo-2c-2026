import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { misEventos } from '../../api/endpoints';
import Boton from '../../components/Boton';
import { EmptyView, ErrorView, Loading } from '../../components/EstadosPantalla';
import Icono from '../../components/Icono';
import Imagen from '../../components/Imagen';
import { PantallaScroll, TituloSeccion } from '../../components/Layout';
import { useApi } from '../../hooks/useApi';
import { useRecargarAlVolver } from '../../hooks/varios';
import { colores, espaciado, estadosCompra, radios } from '../../theme';
import { formatearFechaEvento } from '../../utils/formato';

const ESTADOS = ['PENDIENTE', 'CONFIRMADA', 'UTILIZADA', 'CANCELADA', 'REEMBOLSADA'];

export default function MisEventosScreen({ navigation, route }) {
  const { data: eventos, error, cargando, recargar } = useApi(() => misEventos());
  useRecargarAlVolver(recargar);
  const creado = route.params?.creado;

  useEffect(() => {
    if (!creado) return undefined;
    const id = setTimeout(() => navigation.setParams({ creado: undefined }), 6000);
    return () => clearTimeout(id);
  }, [creado, navigation]);

  const crear = () => navigation.navigate('CrearEvento');

  if (cargando && !eventos) return <Loading />;
  if (error && !eventos) return <ErrorView error={error} onReintentar={recargar} />;

  const proximos = eventos.filter((e) => !e.yaOcurrio);
  const pasados = eventos.filter((e) => e.yaOcurrio).reverse();
  const abrir = (evento) =>
    navigation.navigate('ComprasDelEvento', { id: evento.id, nombre: evento.nombre });

  return (
    <View style={styles.pantalla}>
      {eventos.length === 0 ? (
        <EmptyView
          icono="calendario"
          titulo="Todavía no publicaste eventos"
          detalle="Creá tu primer evento con sus tipos de entrada, precios y cupos."
          accion={<Boton titulo="Crear evento" icono="mas" onPress={crear} />}
        />
      ) : (
        <PantallaScroll>
          {creado && (
            <View style={styles.aviso} accessibilityRole="alert">
              <Icono nombre="check" color={colores.exito} />
              <Text style={styles.avisoTexto}>«{creado}» ya está publicado.</Text>
            </View>
          )}
          <Grupo titulo="Próximos" eventos={proximos} onAbrir={abrir} />
          <Grupo titulo="Finalizados" eventos={pasados} onAbrir={abrir} />
          <View style={styles.espacioFab} />
        </PantallaScroll>
      )}

      {eventos.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crear evento"
          onPress={crear}
          style={({ pressed, hovered }) => [styles.fab, (pressed || hovered) && styles.fabActivo]}
        >
          <Icono nombre="mas" tamanio={28} color={colores.sobrePrimario} />
        </Pressable>
      )}
    </View>
  );
}

function Grupo({ titulo, eventos, onAbrir }) {
  if (eventos.length === 0) return null;
  return (
    <View style={styles.grupo}>
      <TituloSeccion>{titulo}</TituloSeccion>
      {eventos.map((e) => (
        <EventoOrganizador key={e.id} evento={e} onPress={() => onAbrir(e)} />
      ))}
    </View>
  );
}

function EventoOrganizador({ evento, onPress }) {
  const conCompras = ESTADOS.filter((estado) => evento.comprasPorEstado[estado] > 0);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${evento.nombre}. Ver compras`}
      onPress={onPress}
      style={({ pressed, hovered }) => [styles.tarjeta, (pressed || hovered) && styles.activa]}
    >
      <View style={styles.filaTarjeta}>
        <Imagen uri={evento.imagen} estilo={styles.imagen} tamanioIcono={24} />
        <View style={styles.cuerpo}>
          <Text style={styles.nombre} numberOfLines={2}>
            {evento.nombre}
          </Text>
          <View style={styles.fila}>
            <Icono nombre="calendario" tamanio={14} color={colores.textoSecundario} />
            <Text style={styles.secundario}>{formatearFechaEvento(evento.fecha)}</Text>
          </View>
          {evento.agotado && <Text style={styles.agotado}>Agotado</Text>}
        </View>
        <Icono nombre="chevron-derecha" color={colores.textoSecundario} />
      </View>
      <View style={styles.contadores}>
        {conCompras.length === 0 ? (
          <Text style={styles.secundario}>Sin compras todavía</Text>
        ) : (
          conCompras.map((estado) => {
            const { etiqueta, color, fondo } = estadosCompra[estado];
            return (
              <View key={estado} style={[styles.contador, { backgroundColor: fondo }]}>
                <Text style={[styles.textoContador, { color }]}>
                  {evento.comprasPorEstado[estado]} {etiqueta.toLowerCase()}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  grupo: { gap: espaciado.sm },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    padding: espaciado.md,
    borderRadius: radios.md,
    backgroundColor: estadosCompra.CONFIRMADA.fondo,
  },
  avisoTexto: { flex: 1, fontSize: 15, color: colores.texto },
  tarjeta: {
    gap: espaciado.sm,
    padding: espaciado.md,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  activa: { borderColor: colores.primario },
  filaTarjeta: { flexDirection: 'row', alignItems: 'center', gap: espaciado.md },
  imagen: { width: 64, height: 64, borderRadius: radios.md },
  cuerpo: { flex: 1, gap: 4 },
  nombre: { fontSize: 16, fontWeight: '700', color: colores.texto },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secundario: { fontSize: 14, color: colores.textoSecundario },
  agotado: { fontSize: 13, fontWeight: '700', color: colores.error },
  contadores: { flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.xs },
  contador: { paddingHorizontal: espaciado.sm, paddingVertical: 4, borderRadius: radios.pill },
  textoContador: { fontSize: 13, fontWeight: '600' },
  espacioFab: { height: 72 },
  fab: {
    position: 'absolute',
    right: espaciado.lg,
    bottom: espaciado.lg,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radios.pill,
    backgroundColor: colores.primario,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabActivo: { opacity: 0.9 },
});

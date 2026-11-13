import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { buscarEventos, listarCategorias } from '../../api/endpoints';
import Boton from '../../components/Boton';
import Chip from '../../components/Chip';
import { EmptyView, ErrorView, Loading } from '../../components/EstadosPantalla';
import EventoCard from '../../components/EventoCard';
import Icono from '../../components/Icono';
import { useApi } from '../../hooks/useApi';
import { usePaginado } from '../../hooks/usePaginado';
import { useDebounce, useEsAncho, useRecargarAlVolver } from '../../hooks/varios';
import { ANCHO_MAXIMO, ANCHO_MAXIMO_GRILLA, colores, espaciado, radios } from '../../theme';
import { formatearPrecio } from '../../utils/formato';
import FiltroPrecioModal from './FiltroPrecioModal';

const POR_PAGINA = 12;

const ORDENES = [
  {
    valor: 'fecha',
    etiqueta: 'Fecha',
    asc: 'Más próximos',
    desc: 'Más lejanos',
    porDefecto: 'asc',
  },
  {
    valor: 'precio',
    etiqueta: 'Precio',
    asc: 'Menor precio',
    desc: 'Mayor precio',
    porDefecto: 'asc',
  },
  {
    valor: 'puntaje',
    etiqueta: 'Puntaje',
    asc: 'Peor puntaje',
    desc: 'Mejor puntaje',
    porDefecto: 'desc',
  },
];

function textoRango({ min, max }) {
  if (min === undefined && max === undefined) return 'Rango de precio';
  if (max === undefined) return `Desde ${formatearPrecio(min)}`;
  if (min === undefined) return `Hasta ${formatearPrecio(max)}`;
  return `${formatearPrecio(min)} – ${formatearPrecio(max)}`;
}

/** CU-03 y CU-11: búsqueda textual, categorías, orden y rango de precio. */
export default function ExplorarScreen({ navigation }) {
  const esAncho = useEsAncho();
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState(null);
  const [orden, setOrden] = useState('fecha');
  const [direccion, setDireccion] = useState(null); // null = la de por defecto del orden
  const [precio, setPrecio] = useState({ min: undefined, max: undefined });
  const [modalPrecio, setModalPrecio] = useState(false);

  const q = useDebounce(texto.trim(), 400);
  const configOrden = ORDENES.find((o) => o.valor === orden);
  const direccionEfectiva = direccion ?? configOrden.porDefecto;

  const filtros = {
    q,
    categoria,
    orden,
    direccion: direccionEfectiva,
    precioMin: precio.min,
    precioMax: precio.max,
  };
  const clave = JSON.stringify(filtros);
  const cargarPagina = useCallback(
    (page) => buscarEventos({ ...JSON.parse(clave), page, limit: POR_PAGINA }),
    [clave],
  );
  const eventos = usePaginado(cargarPagina, clave);
  const categorias = useApi(listarCategorias, 'categorias');
  useRecargarAlVolver(eventos.recargar);

  const columnas = esAncho ? 2 : 1;
  const anchoContenido = esAncho ? ANCHO_MAXIMO_GRILLA : ANCHO_MAXIMO;

  const elegirOrden = (valor) => {
    setOrden(valor);
    setDireccion(null);
  };

  const filtrosActivos = Boolean(
    q || categoria || precio.min !== undefined || precio.max !== undefined,
  );

  return (
    <View style={styles.pantalla}>
      {/* Barra de filtros fija arriba */}
      <View style={styles.barra}>
        <View style={[styles.barraInterior, { maxWidth: anchoContenido }]}>
          <View style={styles.buscador}>
            <Icono nombre="buscar" color={colores.textoSecundario} />
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Buscar eventos, artistas, lugares…"
              placeholderTextColor={colores.textoSecundario}
              style={styles.inputBuscar}
              inputMode="search"
              enterKeyHint="search"
              accessibilityLabel="Buscar eventos"
            />
            {texto !== '' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Borrar búsqueda"
                onPress={() => setTexto('')}
                style={styles.borrar}
              >
                <Icono nombre="cerrar" tamanio={18} color={colores.textoSecundario} />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            <Chip etiqueta="Todas" seleccionado={!categoria} onPress={() => setCategoria(null)} />
            {(categorias.data ?? []).map((c) => (
              <Chip
                key={c.id}
                etiqueta={c.nombre}
                seleccionado={categoria === c.id}
                onPress={() => setCategoria(categoria === c.id ? null : c.id)}
              />
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {ORDENES.map((o) => (
              <Chip
                key={o.valor}
                etiqueta={o.etiqueta}
                seleccionado={orden === o.valor}
                onPress={() => elegirOrden(o.valor)}
              />
            ))}
            <Chip
              icono="ordenar"
              etiqueta={configOrden[direccionEfectiva]}
              onPress={() => setDireccion(direccionEfectiva === 'asc' ? 'desc' : 'asc')}
            />
            <Chip
              icono="filtros"
              etiqueta={textoRango(precio)}
              seleccionado={precio.min !== undefined || precio.max !== undefined}
              onPress={() => setModalPrecio(true)}
            />
          </ScrollView>
        </View>
      </View>

      {eventos.cargando && eventos.items.length === 0 ? (
        <Loading />
      ) : eventos.error ? (
        <ErrorView error={eventos.error} onReintentar={eventos.recargar} />
      ) : (
        <FlatList
          key={columnas}
          numColumns={columnas}
          data={eventos.items}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <View style={styles.celda}>
              <EventoCard
                evento={item}
                onPress={() => navigation.navigate('DetalleEvento', { id: item.id })}
              />
            </View>
          )}
          style={styles.lista}
          contentContainerStyle={[styles.contenidoLista, { maxWidth: anchoContenido }]}
          columnWrapperStyle={columnas > 1 ? styles.filaGrilla : undefined}
          onEndReached={eventos.cargarMas}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View style={styles.resumen}>
              <Text style={styles.cantidad} accessibilityLiveRegion="polite">
                {eventos.total} {eventos.total === 1 ? 'evento' : 'eventos'}
              </Text>
              {eventos.cargando && <ActivityIndicator size="small" color={colores.primario} />}
            </View>
          }
          ListEmptyComponent={
            <EmptyView
              icono="buscar"
              titulo={q ? `No encontramos eventos para «${q}»` : 'No hay eventos con estos filtros'}
              detalle="Probá con otras palabras o quitá algún filtro."
              accion={
                filtrosActivos && (
                  <Boton
                    titulo="Quitar filtros"
                    variante="secundario"
                    onPress={() => {
                      setTexto('');
                      setCategoria(null);
                      setPrecio({ min: undefined, max: undefined });
                    }}
                  />
                )
              }
            />
          }
          ListFooterComponent={
            eventos.hayMas ? (
              <Boton
                titulo="Ver más eventos"
                variante="texto"
                cargando={eventos.cargandoMas}
                onPress={eventos.cargarMas}
              />
            ) : null
          }
        />
      )}

      {modalPrecio && (
        <FiltroPrecioModal
          visible
          valor={precio}
          onCerrar={() => setModalPrecio(false)}
          onAplicar={(rango) => {
            setPrecio(rango);
            setModalPrecio(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  barra: {
    paddingTop: espaciado.md,
    paddingBottom: espaciado.sm,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  barraInterior: { width: '100%', alignSelf: 'center', gap: espaciado.sm },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    marginHorizontal: espaciado.md,
    paddingHorizontal: espaciado.md,
    minHeight: 48,
    borderRadius: radios.md,
    backgroundColor: colores.fondo,
  },
  inputBuscar: { flex: 1, minWidth: 0, fontSize: 16, color: colores.texto, paddingVertical: 12 },
  borrar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: espaciado.sm, paddingHorizontal: espaciado.md },
  lista: { flex: 1 },
  contenidoLista: {
    width: '100%',
    alignSelf: 'center',
    padding: espaciado.md,
    gap: espaciado.md,
  },
  filaGrilla: { gap: espaciado.md },
  celda: { flex: 1 },
  resumen: { flexDirection: 'row', alignItems: 'center', gap: espaciado.sm },
  cantidad: { fontSize: 14, color: colores.textoSecundario },
});

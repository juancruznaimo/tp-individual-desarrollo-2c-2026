import { useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { comprasDeEvento } from '../../api/endpoints';
import CompraItem from '../../components/CompraItem';
import { EmptyView, ErrorView, Loading } from '../../components/EstadosPantalla';
import Icono from '../../components/Icono';
import { PantallaScroll, Tarjeta, TituloSeccion } from '../../components/Layout';
import { useApi } from '../../hooks/useApi';
import { useRecargarAlVolver } from '../../hooks/varios';
import { colores, espaciado, estadosCompra, radios } from '../../theme';
import { formatearFechaEvento, formatearPrecio } from '../../utils/formato';

const ESTADOS = ['PENDIENTE', 'CONFIRMADA', 'UTILIZADA', 'CANCELADA', 'REEMBOLSADA'];

export default function ComprasDelEventoScreen({ route, navigation }) {
  const { id } = route.params;
  const { data, error, cargando, recargar } = useApi(() => comprasDeEvento(id), id);
  useRecargarAlVolver(recargar);
  const [filtro, setFiltro] = useState(null);

  const nombre = data?.evento.nombre ?? route.params.nombre;
  useLayoutEffect(() => {
    if (nombre) navigation.setOptions({ title: nombre });
  }, [navigation, nombre]);

  if (cargando && !data) return <Loading />;
  if (error && !data) return <ErrorView error={error} onReintentar={recargar} />;

  const compras = filtro ? data.compras.filter((c) => c.estado === filtro) : data.compras;
  const totalCompras = data.compras.length;

  return (
    <PantallaScroll>
      <Pressable
        accessibilityRole="link"
        onPress={() =>
          navigation.navigate('ExplorarTab', {
            screen: 'DetalleEvento',
            params: { id: data.evento.id },
            initial: false,
          })
        }
        style={styles.fila}
      >
        <Icono nombre="calendario" tamanio={16} color={colores.textoSecundario} />
        <Text style={styles.secundario}>{formatearFechaEvento(data.evento.fecha)}</Text>
        <Text style={styles.verEvento}>Ver evento</Text>
      </Pressable>

      <View style={styles.seccion}>
        <TituloSeccion>Disponibilidad</TituloSeccion>
        {data.disponibilidad.map((tipo) => (
          <Disponibilidad key={tipo.tipoEntradaId} tipo={tipo} />
        ))}
      </View>

      <View style={styles.seccion}>
        <TituloSeccion>Compras</TituloSeccion>
        <View style={styles.contadores} accessibilityRole="radiogroup">
          <Contador
            etiqueta="Todas"
            cantidad={totalCompras}
            seleccionado={filtro === null}
            onPress={() => setFiltro(null)}
          />
          {ESTADOS.map((estado) => (
            <Contador
              key={estado}
              estado={estado}
              etiqueta={estadosCompra[estado].etiqueta}
              cantidad={data.resumenPorEstado[estado]}
              seleccionado={filtro === estado}
              onPress={() => setFiltro(filtro === estado ? null : estado)}
            />
          ))}
        </View>

        {compras.length === 0 ? (
          <EmptyView
            icono="ticket"
            titulo={totalCompras === 0 ? 'Todavía no hay compras' : 'No hay compras en este estado'}
            detalle={
              totalCompras === 0 ? 'Cuando alguien compre entradas, vas a verlo acá.' : undefined
            }
          />
        ) : (
          compras.map((c) => (
            <CompraItem
              key={c.id}
              compra={c}
              mostrarComprador
              onPress={() => navigation.navigate('DetalleCompra', { id: c.id })}
            />
          ))
        )}
      </View>
    </PantallaScroll>
  );
}

function Disponibilidad({ tipo }) {
  const proporcion = tipo.cupoTotal > 0 ? tipo.vendidas / tipo.cupoTotal : 0;
  const agotado = tipo.disponibles === 0;
  return (
    <Tarjeta>
      <View style={styles.filaDisponibilidad}>
        <View style={styles.flex}>
          <Text style={styles.nombreTipo}>{tipo.nombre}</Text>
          <Text style={styles.secundario}>{formatearPrecio(tipo.precio)}</Text>
        </View>
        <View style={styles.quedan}>
          <Text style={[styles.numeroQuedan, agotado && styles.textoAgotado]}>
            {agotado ? 'Agotado' : tipo.disponibles.toLocaleString('es-AR')}
          </Text>
          {!agotado && <Text style={styles.secundario}>quedan</Text>}
        </View>
      </View>
      <View
        style={styles.barra}
        accessibilityRole="progressbar"
        accessibilityLabel={`${tipo.vendidas} vendidas de ${tipo.cupoTotal}`}
        accessibilityValue={{ min: 0, max: tipo.cupoTotal, now: tipo.vendidas }}
      >
        <View
          style={[
            styles.relleno,
            { width: `${Math.min(100, proporcion * 100)}%` },
            agotado && styles.rellenoAgotado,
          ]}
        />
      </View>
      <Text style={styles.secundario}>
        {tipo.vendidas.toLocaleString('es-AR')} vendidas de {tipo.cupoTotal.toLocaleString('es-AR')}
      </Text>
    </Tarjeta>
  );
}

function Contador({ estado, etiqueta, cantidad, seleccionado, onPress }) {
  const estilo = estado
    ? estadosCompra[estado]
    : { color: colores.primario, fondo: colores.primarioSuave };
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: seleccionado }}
      accessibilityLabel={`${etiqueta}: ${cantidad}`}
      onPress={onPress}
      style={[
        styles.contador,
        { backgroundColor: estilo.fondo, borderColor: seleccionado ? estilo.color : 'transparent' },
      ]}
    >
      <Text style={[styles.numeroContador, { color: estilo.color }]}>{cantidad}</Text>
      <Text style={[styles.etiquetaContador, { color: estilo.color }]}>{etiqueta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: espaciado.sm, minHeight: 44 },
  secundario: { fontSize: 14, color: colores.textoSecundario },
  verEvento: { marginLeft: 'auto', fontSize: 15, fontWeight: '600', color: colores.primario },
  seccion: { gap: espaciado.sm },
  flex: { flex: 1 },
  filaDisponibilidad: { flexDirection: 'row', alignItems: 'center', gap: espaciado.md },
  nombreTipo: { fontSize: 16, fontWeight: '700', color: colores.texto },
  quedan: { alignItems: 'flex-end' },
  numeroQuedan: { fontSize: 26, fontWeight: '800', color: colores.texto },
  textoAgotado: { fontSize: 18, color: colores.error },
  barra: {
    height: 10,
    overflow: 'hidden',
    borderRadius: radios.pill,
    backgroundColor: colores.borde,
  },
  relleno: { height: '100%', borderRadius: radios.pill, backgroundColor: colores.primario },
  rellenoAgotado: { backgroundColor: colores.error },
  contadores: { flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.sm },
  contador: {
    minWidth: 96,
    minHeight: 44,
    flexGrow: 1,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    borderRadius: radios.md,
    borderWidth: 2,
  },
  numeroContador: { fontSize: 20, fontWeight: '800' },
  etiquetaContador: { fontSize: 13, fontWeight: '600' },
});

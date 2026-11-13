import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { reseniasDeOrganizador } from '../../api/endpoints';
import Boton from '../../components/Boton';
import { EmptyView, ErrorView, Loading } from '../../components/EstadosPantalla';
import { Estrellas } from '../../components/Estrellas';
import { PantallaScroll, Tarjeta } from '../../components/Layout';
import ReseniaItem from '../../components/ReseniaItem';
import { usePaginado } from '../../hooks/usePaginado';
import { colores, espaciado } from '../../theme';

/** CU-10: todas las reseñas de los eventos de un organizador. */
export default function ReseniasOrganizadorScreen({ route }) {
  const { id, nombre } = route.params;
  const cargarPagina = useCallback(
    (page) =>
      reseniasDeOrganizador(id, { page, limit: 10 }).then(
        ({ resenias, puntaje, cantidadResenias }) => ({
          ...resenias,
          extra: { puntaje, cantidadResenias },
        }),
      ),
    [id],
  );
  const lista = usePaginado(cargarPagina, id);

  if (lista.cargando && lista.items.length === 0) return <Loading />;
  if (lista.error) return <ErrorView error={lista.error} onReintentar={lista.recargar} />;

  const { puntaje, cantidadResenias } = lista.extra;

  return (
    <PantallaScroll>
      <Tarjeta estilo={styles.resumen}>
        {nombre && <Text style={styles.nombre}>{nombre}</Text>}
        {puntaje === null ? (
          <Text style={styles.sinPuntaje}>Todavía no tiene reseñas</Text>
        ) : (
          <View style={styles.fila}>
            <Text style={styles.puntaje}>{puntaje.toFixed(1)}</Text>
            <View style={styles.columna}>
              <Estrellas valor={puntaje} tamanio={22} />
              <Text style={styles.cantidad}>
                {cantidadResenias} {cantidadResenias === 1 ? 'reseña' : 'reseñas'}
              </Text>
            </View>
          </View>
        )}
      </Tarjeta>

      {lista.items.length === 0 ? (
        <EmptyView icono="estrella" titulo="Sin reseñas por ahora" />
      ) : (
        <View>
          {lista.items.map((r) => (
            <ReseniaItem key={r.id} resenia={r} />
          ))}
        </View>
      )}

      {lista.hayMas && (
        <Boton
          titulo="Ver más reseñas"
          variante="texto"
          cargando={lista.cargandoMas}
          onPress={lista.cargarMas}
        />
      )}
    </PantallaScroll>
  );
}

const styles = StyleSheet.create({
  resumen: { alignItems: 'center', paddingVertical: espaciado.lg },
  nombre: { fontSize: 18, fontWeight: '700', color: colores.texto },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espaciado.md },
  columna: { gap: espaciado.xs },
  puntaje: { fontSize: 44, fontWeight: '800', color: colores.texto },
  cantidad: { fontSize: 14, color: colores.textoSecundario },
  sinPuntaje: { fontSize: 15, color: colores.textoSecundario },
});

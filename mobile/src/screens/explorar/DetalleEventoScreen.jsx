import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { agregarFavorito, obtenerEvento, quitarFavorito } from '../../api/endpoints';
import Boton from '../../components/Boton';
import { ErrorView, Loading } from '../../components/EstadosPantalla';
import { PuntajeOrganizador } from '../../components/Estrellas';
import Icono from '../../components/Icono';
import Imagen from '../../components/Imagen';
import { PantallaScroll, Tarjeta, TituloSeccion } from '../../components/Layout';
import ReseniaItem from '../../components/ReseniaItem';
import { useApi } from '../../hooks/useApi';
import { useRecargarAlVolver } from '../../hooks/varios';
import { colores, espaciado, radios } from '../../theme';
import { formatearFechaLarga, formatearHora, iniciales, nombreCompleto } from '../../utils/formato';
import SeccionCompra from './SeccionCompra';

/** CU-10, CU-12, CU-13: detalle, reseñas del organizador, favorito y compra. */
export default function DetalleEventoScreen({ route, navigation }) {
  const { id } = route.params;
  const {
    data: evento,
    error,
    cargando,
    recargar,
    actualizar,
  } = useApi(() => obtenerEvento(id), id);
  useRecargarAlVolver(recargar);

  if (cargando && !evento) return <Loading />;
  if (error && !evento) return <ErrorView error={error} onReintentar={recargar} />;

  const alternarFavorito = async () => {
    const nuevo = !evento.esFavorito;
    actualizar((e) => ({ ...e, esFavorito: nuevo })); // optimista
    try {
      await (nuevo ? agregarFavorito(evento.id) : quitarFavorito(evento.id));
    } catch {
      actualizar((e) => ({ ...e, esFavorito: !nuevo }));
    }
  };

  const verReseniasOrganizador = () =>
    navigation.navigate('ReseniasOrganizador', {
      id: evento.organizador.id,
      nombre: nombreCompleto(evento.organizador),
    });

  return (
    <PantallaScroll>
      <Carrusel imagenes={evento.multimedia} />

      <View style={styles.encabezado}>
        <View style={styles.titulos}>
          <Text style={styles.categoria}>{evento.categoria.nombre}</Text>
          <Text accessibilityRole="header" style={styles.nombre}>
            {evento.nombre}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={evento.esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          accessibilityState={{ selected: evento.esFavorito }}
          onPress={alternarFavorito}
          style={styles.favorito}
        >
          <Icono
            nombre="corazon"
            tamanio={26}
            color={evento.esFavorito ? colores.favorito : colores.textoSecundario}
            relleno={evento.esFavorito ? colores.favorito : 'none'}
          />
        </Pressable>
      </View>

      <Tarjeta>
        <Dato icono="calendario" titulo={formatearFechaLarga(evento.fecha)}>
          {formatearHora(evento.fecha)} hs
        </Dato>
        <Dato icono="ubicacion" titulo={evento.lugar} />
      </Tarjeta>

      <Text style={styles.descripcion}>{evento.descripcion}</Text>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Organiza ${nombreCompleto(evento.organizador)}. Ver reseñas`}
        onPress={verReseniasOrganizador}
        style={({ hovered }) => [styles.organizador, hovered && styles.organizadorHover]}
      >
        <View style={styles.avatar}>
          <Text style={styles.iniciales}>{iniciales(evento.organizador)}</Text>
        </View>
        <View style={styles.organizadorDatos}>
          <Text style={styles.organizaLabel}>Organiza</Text>
          <Text style={styles.organizadorNombre}>{nombreCompleto(evento.organizador)}</Text>
          <PuntajeOrganizador
            puntaje={evento.organizador.puntaje}
            cantidadResenias={evento.organizador.cantidadResenias}
          />
        </View>
        <Icono nombre="chevron-derecha" color={colores.textoSecundario} />
      </Pressable>

      {evento.yaOcurrio ? (
        <Aviso>Este evento ya se realizó.</Aviso>
      ) : evento.esOrganizador ? (
        <Aviso>Sos el organizador de este evento.</Aviso>
      ) : (
        <SeccionCompra
          evento={evento}
          onCupoDesactualizado={recargar}
          onCompraRealizada={(compra) =>
            navigation.navigate('MisComprasTab', {
              screen: 'DetalleCompra',
              params: { id: compra.id },
              initial: false,
            })
          }
        />
      )}

      <View>
        <TituloSeccion>Reseñas de eventos anteriores</TituloSeccion>
        {evento.reseniasOrganizador.length === 0 ? (
          <Text style={styles.sinResenias}>
            {nombreCompleto(evento.organizador)} todavía no tiene reseñas.
          </Text>
        ) : (
          <>
            {evento.reseniasOrganizador.map((r) => (
              <ReseniaItem key={r.id} resenia={r} />
            ))}
            {evento.organizador.cantidadResenias > evento.reseniasOrganizador.length && (
              <Boton
                titulo={`Ver las ${evento.organizador.cantidadResenias} reseñas`}
                variante="texto"
                onPress={verReseniasOrganizador}
              />
            )}
          </>
        )}
      </View>
    </PantallaScroll>
  );
}

function Dato({ icono, titulo, children }) {
  return (
    <View style={styles.dato}>
      <Icono nombre={icono} color={colores.primario} />
      <View style={styles.datoTextos}>
        <Text style={styles.datoTitulo}>{titulo}</Text>
        {children && <Text style={styles.datoDetalle}>{children}</Text>}
      </View>
    </View>
  );
}

function Aviso({ children }) {
  return (
    <View style={styles.aviso}>
      <Icono nombre="alerta" color={colores.textoSecundario} />
      <Text style={styles.avisoTexto}>{children}</Text>
    </View>
  );
}

/** Carrusel horizontal de imágenes con indicador de posición. */
function Carrusel({ imagenes }) {
  const [ancho, setAncho] = useState(0);
  const [actual, setActual] = useState(0);

  if (imagenes.length === 0) {
    return (
      <View style={[styles.carrusel, styles.sinImagen]}>
        <Icono nombre="ticket" tamanio={48} color={colores.textoSecundario} />
      </View>
    );
  }

  return (
    <View style={styles.carrusel} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={64}
          onScroll={(e) => setActual(Math.round(e.nativeEvent.contentOffset.x / ancho))}
        >
          {imagenes.map((uri, i) => (
            <Imagen
              key={uri}
              uri={uri}
              estilo={{ width: ancho, height: '100%' }}
              etiqueta={`Imagen ${i + 1} de ${imagenes.length}`}
              tamanioIcono={48}
            />
          ))}
        </ScrollView>
      )}
      {imagenes.length > 1 && (
        <View style={styles.puntos}>
          {imagenes.map((uri, i) => (
            <View key={uri} style={[styles.punto, i === actual && styles.puntoActual]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carrusel: {
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderRadius: radios.lg,
    backgroundColor: colores.borde,
  },
  sinImagen: { alignItems: 'center', justifyContent: 'center' },
  puntos: {
    position: 'absolute',
    bottom: espaciado.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)' },
  puntoActual: { backgroundColor: '#fff' },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espaciado.sm },
  titulos: { flex: 1, gap: espaciado.xs },
  categoria: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.primario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nombre: { fontSize: 26, fontWeight: '800', color: colores.texto },
  favorito: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  dato: { flexDirection: 'row', alignItems: 'flex-start', gap: espaciado.md },
  datoTextos: { flex: 1, gap: 2 },
  datoTitulo: { fontSize: 16, fontWeight: '600', color: colores.texto },
  datoDetalle: { fontSize: 14, color: colores.textoSecundario },
  descripcion: { fontSize: 16, lineHeight: 24, color: colores.texto },
  organizador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.md,
    padding: espaciado.md,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  organizadorHover: { borderColor: colores.primario },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radios.pill,
    backgroundColor: colores.primarioSuave,
  },
  iniciales: { fontSize: 17, fontWeight: '700', color: colores.primario },
  organizadorDatos: { flex: 1, gap: 2 },
  organizaLabel: { fontSize: 13, color: colores.textoSecundario },
  organizadorNombre: { fontSize: 16, fontWeight: '600', color: colores.texto },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    padding: espaciado.md,
    borderRadius: radios.md,
    backgroundColor: colores.borde,
  },
  avisoTexto: { flex: 1, fontSize: 15, color: colores.texto },
  sinResenias: { fontSize: 15, color: colores.textoSecundario, paddingVertical: espaciado.sm },
});

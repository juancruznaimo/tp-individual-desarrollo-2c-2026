import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  cancelarCompra,
  marcarCompraUtilizada,
  obtenerCompra,
  pagarCompra,
} from '../../api/endpoints';
import Boton from '../../components/Boton';
import Dialogo from '../../components/Dialogo';
import EstadoBadge from '../../components/EstadoBadge';
import { ErrorView, Loading, MensajeError } from '../../components/EstadosPantalla';
import Icono from '../../components/Icono';
import { PantallaScroll, Tarjeta, TituloSeccion } from '../../components/Layout';
import { useApi } from '../../hooks/useApi';
import { useRecargarAlVolver } from '../../hooks/varios';
import { colores, espaciado, estadosCompra, radios } from '../../theme';
import {
  formatearFechaEvento,
  formatearFechaYHora,
  formatearPrecio,
  nombreCompleto,
  textoDiasRestantes,
} from '../../utils/formato';
import ReseniaModal from './ReseniaModal';

const OPERACIONES = {
  PAGAR: pagarCompra,
  CANCELAR: cancelarCompra,
  MARCAR_UTILIZADA: marcarCompraUtilizada,
};

export default function DetalleCompraScreen({ route, navigation }) {
  const { id } = route.params;
  const {
    data: compra,
    error,
    cargando,
    recargar,
    actualizar,
  } = useApi(() => obtenerCompra(id), id);
  useRecargarAlVolver(recargar);

  const [dialogo, setDialogo] = useState(null);
  const [ejecutando, setEjecutando] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);
  const [aviso, setAviso] = useState(null);

  if (cargando && !compra) return <Loading />;
  if (error && !compra) return <ErrorView error={error} onReintentar={recargar} />;

  const puede = (accion) => compra.acciones.includes(accion);
  const esOrganizador = compra.rol === 'ORGANIZADOR';
  const dias = textoDiasRestantes(compra.diasRestantes);

  const ejecutar = async (accion, mensajeOk) => {
    setEjecutando(accion);
    setErrorAccion(null);
    setAviso(null);
    try {
      const actualizada = await OPERACIONES[accion](compra.id);
      actualizar(() => actualizada);
      setAviso(mensajeOk(actualizada));
    } catch (e) {
      setErrorAccion(e.message);
      recargar();
    } finally {
      setEjecutando(null);
      setDialogo(null);
    }
  };

  const verEvento = () =>
    navigation.navigate('ExplorarTab', {
      screen: 'DetalleEvento',
      params: { id: compra.evento.id },
      initial: false,
    });

  return (
    <PantallaScroll>
      <Tarjeta>
        <Pressable accessibilityRole="link" onPress={verEvento}>
          <Text accessibilityRole="header" style={styles.evento}>
            {compra.evento.nombre}
          </Text>
        </Pressable>
        <View style={styles.fila}>
          <Icono nombre="calendario" tamanio={16} color={colores.textoSecundario} />
          <Text style={styles.secundario}>{formatearFechaEvento(compra.evento.fecha)}</Text>
        </View>
        <View style={styles.fila}>
          <Icono nombre="ubicacion" tamanio={16} color={colores.textoSecundario} />
          <Text style={styles.secundario}>{compra.evento.lugar}</Text>
        </View>
        {esOrganizador && (
          <View style={styles.fila}>
            <Icono nombre="usuario" tamanio={16} color={colores.textoSecundario} />
            <Text style={styles.secundario}>Comprador: {nombreCompleto(compra.comprador)}</Text>
          </View>
        )}
        <View style={[styles.fila, styles.estado]}>
          <EstadoBadge estado={compra.estado} grande />
          {dias && <Text style={styles.dias}>{dias}</Text>}
        </View>
      </Tarjeta>

      {compra.estado === 'PENDIENTE' && !esOrganizador && (
        <View style={styles.avisoPendiente} accessibilityRole="alert">
          <Icono nombre="reloj" color={colores.advertencia} />
          <Text style={styles.avisoTexto}>
            Tus entradas están reservadas. Pagá la compra para confirmarlas.
          </Text>
        </View>
      )}

      {aviso && (
        <View style={styles.avisoOk} accessibilityRole="alert">
          <Icono nombre="check" color={colores.exito} />
          <Text style={styles.avisoTexto}>{aviso}</Text>
        </View>
      )}
      <MensajeError>{errorAccion}</MensajeError>

      <Acciones
        puede={puede}
        ejecutando={ejecutando}
        onPagar={() =>
          ejecutar('PAGAR', (c) => `¡Pago registrado! ${textoDiasRestantes(c.diasRestantes)}.`)
        }
        onCancelar={() => setDialogo('CANCELAR')}
        onMarcarUtilizada={() => setDialogo('MARCAR_UTILIZADA')}
        onReseniar={() => setDialogo('RESENIAR')}
      />

      <Boton
        titulo={
          compra.cantidadMensajes > 0
            ? `Chat · ${compra.cantidadMensajes} ${compra.cantidadMensajes === 1 ? 'mensaje' : 'mensajes'}`
            : esOrganizador
              ? 'Chat con el comprador'
              : 'Chat con el organizador'
        }
        icono="mensaje"
        variante="secundario"
        onPress={() => navigation.navigate('Chat', { id: compra.id })}
      />

      <Tarjeta>
        <Linea etiqueta="Tipo de entrada" valor={compra.tipoEntrada.nombre} />
        <Linea etiqueta="Cantidad" valor={compra.cantidad} />
        <Linea etiqueta="Precio unitario" valor={formatearPrecio(compra.tipoEntrada.precio)} />
        <View style={styles.separador} />
        <Linea etiqueta="Total" valor={formatearPrecio(compra.total)} destacado />
      </Tarjeta>

      <View style={styles.seccion}>
        <TituloSeccion>Historial</TituloSeccion>
        <Historial historial={compra.historial} />
      </View>

      {dialogo === 'CANCELAR' && (
        <Dialogo
          titulo="¿Cancelar la compra?"
          onCerrar={() => setDialogo(null)}
          acciones={
            <>
              <Boton
                titulo="Volver"
                variante="secundario"
                estilo={styles.botonFlex}
                onPress={() => setDialogo(null)}
              />
              <Boton
                titulo="Sí, cancelar"
                variante="peligro"
                estilo={styles.botonFlex}
                cargando={ejecutando === 'CANCELAR'}
                onPress={() =>
                  ejecutar('CANCELAR', (c) =>
                    c.estado === 'REEMBOLSADA'
                      ? `Compra cancelada. Te reintegramos ${formatearPrecio(c.total)}.`
                      : 'Compra cancelada.',
                  )
                }
              />
            </>
          }
        >
          <Text style={styles.textoDialogo}>
            {compra.estado === 'CONFIRMADA'
              ? `Se liberan tus ${compra.cantidad} entradas y te reintegramos ${formatearPrecio(compra.total)}. La compra queda reembolsada.`
              : `Se liberan las ${compra.cantidad} entradas reservadas. Como todavía no pagaste, no hay nada que reintegrar.`}
          </Text>
          <Text style={styles.textoDialogo}>Esta acción no se puede deshacer.</Text>
        </Dialogo>
      )}

      {dialogo === 'MARCAR_UTILIZADA' && (
        <Dialogo
          titulo="¿Marcar como utilizada?"
          onCerrar={() => setDialogo(null)}
          acciones={
            <>
              <Boton
                titulo="Volver"
                variante="secundario"
                estilo={styles.botonFlex}
                onPress={() => setDialogo(null)}
              />
              <Boton
                titulo="Marcar utilizada"
                estilo={styles.botonFlex}
                cargando={ejecutando === 'MARCAR_UTILIZADA'}
                onPress={() =>
                  ejecutar('MARCAR_UTILIZADA', () => 'La compra quedó marcada como utilizada.')
                }
              />
            </>
          }
        >
          <Text style={styles.textoDialogo}>
            Confirmá que {nombreCompleto(compra.comprador)} ingresó al evento con sus{' '}
            {compra.cantidad} entradas. Después ya no se puede cancelar.
          </Text>
        </Dialogo>
      )}

      {dialogo === 'RESENIAR' && (
        <ReseniaModal
          evento={compra.evento}
          onCerrar={() => setDialogo(null)}
          onReseniado={() => {
            setDialogo(null);
            setAviso('¡Gracias! Tu reseña ya se ve en los eventos del organizador.');
            recargar();
          }}
        />
      )}
    </PantallaScroll>
  );
}

function Acciones({ puede, ejecutando, onPagar, onCancelar, onMarcarUtilizada, onReseniar }) {
  const hayAlguna = ['PAGAR', 'MARCAR_UTILIZADA', 'RESENIAR', 'CANCELAR'].some(puede);
  if (!hayAlguna) return null;
  return (
    <View style={styles.acciones}>
      {puede('PAGAR') && (
        <Boton titulo="Pagar" icono="check" cargando={ejecutando === 'PAGAR'} onPress={onPagar} />
      )}
      {puede('MARCAR_UTILIZADA') && (
        <Boton titulo="Marcar como utilizada" icono="ticket" onPress={onMarcarUtilizada} />
      )}
      {puede('RESENIAR') && (
        <Boton titulo="Calificar evento" icono="estrella" onPress={onReseniar} />
      )}
      {puede('CANCELAR') && (
        <Boton titulo="Cancelar compra" icono="cerrar" variante="peligro" onPress={onCancelar} />
      )}
    </View>
  );
}

function Historial({ historial }) {
  return (
    <View accessibilityRole="list">
      {historial.map((cambio, i) => {
        const { etiqueta, color } = estadosCompra[cambio.estado];
        const ultimo = i === historial.length - 1;
        return (
          <View
            key={`${cambio.estado}-${cambio.fechaHora}`}
            style={styles.paso}
            accessibilityRole="listitem"
          >
            <View style={styles.guia}>
              <View
                style={[styles.punto, { backgroundColor: color }, ultimo && styles.puntoActual]}
              />
              {!ultimo && <View style={styles.linea} />}
            </View>
            <View style={styles.pasoTexto}>
              <Text style={[styles.pasoEstado, { color }]}>{etiqueta}</Text>
              <Text style={styles.pasoDetalle}>
                {formatearFechaYHora(cambio.fechaHora)}
                {cambio.quien ? ` · ${nombreCompleto(cambio.quien)}` : ' · Automático'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Linea({ etiqueta, valor, destacado = false }) {
  return (
    <View style={styles.lineaResumen}>
      <Text style={[styles.etiqueta, destacado && styles.destacado]}>{etiqueta}</Text>
      <Text style={[styles.valor, destacado && styles.destacado]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  evento: { fontSize: 20, fontWeight: '800', color: colores.texto },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espaciado.sm },
  secundario: { flex: 1, fontSize: 15, color: colores.textoSecundario },
  estado: { marginTop: espaciado.sm, flexWrap: 'wrap' },
  dias: { fontSize: 16, fontWeight: '700', color: colores.exito },
  avisoPendiente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    padding: espaciado.md,
    borderRadius: radios.md,
    backgroundColor: estadosCompra.PENDIENTE.fondo,
  },
  avisoOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    padding: espaciado.md,
    borderRadius: radios.md,
    backgroundColor: estadosCompra.CONFIRMADA.fondo,
  },
  avisoTexto: { flex: 1, fontSize: 15, color: colores.texto },
  acciones: { gap: espaciado.sm },
  seccion: { gap: espaciado.sm },
  lineaResumen: { flexDirection: 'row', justifyContent: 'space-between', gap: espaciado.md },
  etiqueta: { fontSize: 15, color: colores.textoSecundario },
  valor: { fontSize: 15, fontWeight: '600', color: colores.texto },
  separador: { height: 1, backgroundColor: colores.borde },
  destacado: { fontSize: 18, fontWeight: '800', color: colores.texto },
  textoDialogo: { fontSize: 16, lineHeight: 22, color: colores.texto },
  botonFlex: { flex: 1 },
  paso: { flexDirection: 'row', gap: espaciado.md },
  guia: { width: 14, alignItems: 'center' },
  punto: { width: 12, height: 12, marginTop: 4, borderRadius: radios.pill },
  puntoActual: { width: 14, height: 14, borderWidth: 3, borderColor: colores.superficie },
  linea: { flex: 1, width: 2, backgroundColor: colores.borde },
  pasoTexto: { flex: 1, gap: 2, paddingBottom: espaciado.md },
  pasoEstado: { fontSize: 15, fontWeight: '700' },
  pasoDetalle: { fontSize: 14, color: colores.textoSecundario },
});

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { comprar } from '../../api/endpoints';
import Boton from '../../components/Boton';
import { MensajeError } from '../../components/EstadosPantalla';
import Icono from '../../components/Icono';
import { TituloSeccion } from '../../components/Layout';
import { colores, espaciado, radios } from '../../theme';
import { formatearPrecio } from '../../utils/formato';

/** Igual que CANTIDAD_MAXIMA_POR_COMPRA del back-end. */
const MAXIMO_POR_COMPRA = 10;

/**
 * CU-12: elegir tipo de entrada y cantidad sin superar el cupo. El stepper se limita a
 * min(cupo, 10), así que desde la UI no se puede pedir de más; si igual el cupo cambió
 * (otra persona compró), el back-end responde SIN_CUPO y se recarga el evento.
 */
export default function SeccionCompra({ evento, onCompraRealizada, onCupoDesactualizado }) {
  const [tipoId, setTipoId] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const tipo = evento.tiposEntrada.find((t) => t.id === tipoId && t.cupo > 0) ?? null;
  const maximo = tipo ? Math.min(tipo.cupo, MAXIMO_POR_COMPRA) : 1;
  // Si el cupo bajó al recargar, la cantidad elegida se ajusta sola.
  const cantidadEfectiva = Math.min(cantidad, maximo);

  const elegirTipo = (id) => {
    setTipoId(id);
    setCantidad(1);
    setError(null);
  };

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const compra = await comprar({
        eventoId: evento.id,
        tipoEntradaId: tipo.id,
        cantidad: cantidadEfectiva,
      });
      onCompraRealizada(compra);
    } catch (e) {
      setError(e.message);
      if (e.codigo === 'SIN_CUPO') onCupoDesactualizado();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.seccion}>
      <TituloSeccion>Entradas</TituloSeccion>

      <View accessibilityRole="radiogroup" style={styles.tipos}>
        {evento.tiposEntrada.map((t) => {
          const agotado = t.cupo === 0;
          const seleccionado = tipo?.id === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: seleccionado, disabled: agotado }}
              accessibilityLabel={`${t.nombre}, ${formatearPrecio(t.precio)}${agotado ? ', agotado' : ''}`}
              disabled={agotado}
              onPress={() => elegirTipo(t.id)}
              style={({ hovered }) => [
                styles.tipo,
                seleccionado && styles.tipoSeleccionado,
                hovered && !agotado && !seleccionado && styles.tipoHover,
                agotado && styles.tipoAgotado,
              ]}
            >
              <View style={[styles.radio, seleccionado && styles.radioSeleccionado]}>
                {seleccionado && <View style={styles.radioPunto} />}
              </View>
              <View style={styles.tipoInfo}>
                <Text style={styles.tipoNombre}>{t.nombre}</Text>
                {t.descripcion !== '' && (
                  <Text style={styles.tipoDescripcion}>{t.descripcion}</Text>
                )}
                <Text style={[styles.cupo, agotado && styles.cupoAgotado]}>
                  {agotado
                    ? 'Agotado'
                    : t.cupo <= 10
                      ? `¡Últimas ${t.cupo}!`
                      : `${t.cupo.toLocaleString('es-AR')} disponibles`}
                </Text>
              </View>
              <Text style={styles.tipoPrecio}>{formatearPrecio(t.precio)}</Text>
            </Pressable>
          );
        })}
      </View>

      {tipo && (
        <View style={styles.resumen}>
          <View style={styles.filaCantidad}>
            <Text style={styles.etiqueta}>Cantidad</Text>
            <View style={styles.stepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar una entrada"
                disabled={cantidadEfectiva <= 1}
                onPress={() => setCantidad(cantidadEfectiva - 1)}
                style={[styles.paso, cantidadEfectiva <= 1 && styles.pasoInactivo]}
              >
                <Icono nombre="menos" color={colores.primario} />
              </Pressable>
              <Text style={styles.cantidad} accessibilityLiveRegion="polite">
                {cantidadEfectiva}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Agregar una entrada"
                disabled={cantidadEfectiva >= maximo}
                onPress={() => setCantidad(cantidadEfectiva + 1)}
                style={[styles.paso, cantidadEfectiva >= maximo && styles.pasoInactivo]}
              >
                <Icono nombre="mas" color={colores.primario} />
              </Pressable>
            </View>
          </View>
          {cantidadEfectiva >= maximo && (
            <Text style={styles.limite}>
              {maximo === MAXIMO_POR_COMPRA
                ? `Máximo ${MAXIMO_POR_COMPRA} entradas por compra`
                : `No quedan más entradas de tipo ${tipo.nombre}`}
            </Text>
          )}
          <View style={styles.filaTotal}>
            <Text style={styles.etiqueta}>Total</Text>
            <Text style={styles.total}>{formatearPrecio(tipo.precio * cantidadEfectiva)}</Text>
          </View>
          <MensajeError>{error}</MensajeError>
          <Boton
            titulo={`Comprar ${cantidadEfectiva} ${cantidadEfectiva === 1 ? 'entrada' : 'entradas'}`}
            icono="ticket"
            cargando={enviando}
            onPress={confirmar}
          />
        </View>
      )}
      {!tipo && <MensajeError>{error}</MensajeError>}
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: espaciado.md },
  tipos: { gap: espaciado.sm },
  tipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.md,
    padding: espaciado.md,
    minHeight: 64,
    borderRadius: radios.md,
    borderWidth: 1.5,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  tipoSeleccionado: { borderColor: colores.primario, backgroundColor: colores.primarioSuave },
  tipoHover: { borderColor: colores.primario },
  tipoAgotado: { opacity: 0.55 },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radios.pill,
    borderWidth: 2,
    borderColor: colores.textoSecundario,
  },
  radioSeleccionado: { borderColor: colores.primario },
  radioPunto: {
    width: 10,
    height: 10,
    borderRadius: radios.pill,
    backgroundColor: colores.primario,
  },
  tipoInfo: { flex: 1, gap: 2 },
  tipoNombre: { fontSize: 16, fontWeight: '600', color: colores.texto },
  tipoDescripcion: { fontSize: 14, color: colores.textoSecundario },
  cupo: { fontSize: 13, color: colores.exito, fontWeight: '500' },
  cupoAgotado: { color: colores.error },
  tipoPrecio: { fontSize: 16, fontWeight: '700', color: colores.texto },
  resumen: {
    gap: espaciado.md,
    padding: espaciado.md,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  filaCantidad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  etiqueta: { fontSize: 16, color: colores.texto },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: espaciado.md },
  paso: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colores.primario,
  },
  pasoInactivo: { opacity: 0.35 },
  cantidad: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colores.texto,
  },
  limite: { fontSize: 13, color: colores.advertencia, textAlign: 'right' },
  filaTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: espaciado.sm,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
  },
  total: { fontSize: 22, fontWeight: '800', color: colores.texto },
});

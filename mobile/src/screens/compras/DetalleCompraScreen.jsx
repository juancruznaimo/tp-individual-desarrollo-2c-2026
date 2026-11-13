import { StyleSheet, Text, View } from 'react-native';

import { obtenerCompra } from '../../api/endpoints';
import EstadoBadge from '../../components/EstadoBadge';
import { ErrorView, Loading } from '../../components/EstadosPantalla';
import Icono from '../../components/Icono';
import { PantallaScroll, Tarjeta } from '../../components/Layout';
import { useApi } from '../../hooks/useApi';
import { useRecargarAlVolver } from '../../hooks/varios';
import { colores, espaciado } from '../../theme';
import { formatearFechaEvento, formatearPrecio, textoDiasRestantes } from '../../utils/formato';

/**
 * Detalle de una compra. En la Etapa 5 muestra el resumen después de comprar;
 * la Etapa 6 suma el historial, las acciones (pagar, cancelar, reseñar) y el chat.
 */
export default function DetalleCompraScreen({ route }) {
  const { id } = route.params;
  const { data: compra, error, cargando, recargar } = useApi(() => obtenerCompra(id), id);
  useRecargarAlVolver(recargar);

  if (cargando && !compra) return <Loading />;
  if (error && !compra) return <ErrorView error={error} onReintentar={recargar} />;

  const dias = textoDiasRestantes(compra.diasRestantes);

  return (
    <PantallaScroll>
      <Tarjeta>
        <Text accessibilityRole="header" style={styles.evento}>
          {compra.evento.nombre}
        </Text>
        <View style={styles.fila}>
          <Icono nombre="calendario" tamanio={16} color={colores.textoSecundario} />
          <Text style={styles.secundario}>{formatearFechaEvento(compra.evento.fecha)}</Text>
        </View>
        <View style={styles.fila}>
          <Icono nombre="ubicacion" tamanio={16} color={colores.textoSecundario} />
          <Text style={styles.secundario}>{compra.evento.lugar}</Text>
        </View>
        <View style={[styles.fila, styles.estado]}>
          <EstadoBadge estado={compra.estado} grande />
          {dias && <Text style={styles.dias}>{dias}</Text>}
        </View>
      </Tarjeta>

      {compra.estado === 'PENDIENTE' && (
        <View style={styles.aviso} accessibilityRole="alert">
          <Icono nombre="reloj" color={colores.advertencia} />
          <Text style={styles.avisoTexto}>
            Tus entradas están reservadas. Pagá la compra para confirmarlas.
          </Text>
        </View>
      )}

      <Tarjeta>
        <Linea etiqueta="Tipo de entrada" valor={compra.tipoEntrada.nombre} />
        <Linea etiqueta="Cantidad" valor={compra.cantidad} />
        <Linea etiqueta="Precio unitario" valor={formatearPrecio(compra.tipoEntrada.precio)} />
        <View style={styles.separador} />
        <Linea etiqueta="Total" valor={formatearPrecio(compra.total)} destacado />
      </Tarjeta>
    </PantallaScroll>
  );
}

function Linea({ etiqueta, valor, destacado = false }) {
  return (
    <View style={styles.linea}>
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
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    padding: espaciado.md,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
  },
  avisoTexto: { flex: 1, fontSize: 15, color: colores.texto },
  linea: { flexDirection: 'row', justifyContent: 'space-between', gap: espaciado.md },
  etiqueta: { fontSize: 15, color: colores.textoSecundario },
  valor: { fontSize: 15, fontWeight: '600', color: colores.texto },
  separador: { height: 1, backgroundColor: colores.borde },
  destacado: { fontSize: 18, fontWeight: '800', color: colores.texto },
});

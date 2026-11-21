import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { misCompras } from '../../api/endpoints';
import Boton from '../../components/Boton';
import Chip from '../../components/Chip';
import CompraItem from '../../components/CompraItem';
import { EmptyView, ErrorView, Loading } from '../../components/EstadosPantalla';
import { PantallaScroll, TituloSeccion } from '../../components/Layout';
import { useApi } from '../../hooks/useApi';
import { useRecargarAlVolver } from '../../hooks/varios';
import { colores, espaciado } from '../../theme';

const FILTROS = [
  { valor: 'TODAS', etiqueta: 'Todas', estados: null },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes', estados: ['PENDIENTE'] },
  { valor: 'CONFIRMADA', etiqueta: 'Confirmadas', estados: ['CONFIRMADA'] },
  { valor: 'UTILIZADA', etiqueta: 'Utilizadas', estados: ['UTILIZADA'] },
  { valor: 'CANCELADA', etiqueta: 'Canceladas', estados: ['CANCELADA', 'REEMBOLSADA'] },
];

export default function MisComprasScreen({ navigation }) {
  const [filtro, setFiltro] = useState('TODAS');
  const { data, error, cargando, recargar } = useApi(() =>
    misCompras().then((compras) => ({ compras, ahora: Date.now() })),
  );
  useRecargarAlVolver(recargar);

  if (cargando && !data) return <Loading />;
  if (error && !data) return <ErrorView error={error} onReintentar={recargar} />;

  const { compras, ahora } = data;
  const { estados } = FILTROS.find((f) => f.valor === filtro);
  const filtradas = compras.filter((c) => !estados || estados.includes(c.estado));

  const proximas = filtradas.filter((c) => new Date(c.evento.fecha).getTime() > ahora);
  const pasadas = filtradas.filter((c) => new Date(c.evento.fecha).getTime() <= ahora).reverse();

  const abrir = (compra) => navigation.navigate('DetalleCompra', { id: compra.id });
  const contar = (f) =>
    f.estados ? compras.filter((c) => f.estados.includes(c.estado)).length : compras.length;

  return (
    <View style={styles.pantalla}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.barraChips}
        contentContainerStyle={styles.chips}
      >
        {FILTROS.map((f) => (
          <Chip
            key={f.valor}
            etiqueta={`${f.etiqueta} (${contar(f)})`}
            seleccionado={filtro === f.valor}
            onPress={() => setFiltro(f.valor)}
          />
        ))}
      </ScrollView>

      {compras.length === 0 ? (
        <EmptyView
          icono="ticket"
          titulo="Todavía no compraste entradas"
          detalle="Cuando compres, vas a poder seguir el estado de tus compras desde acá."
          accion={
            <Boton
              titulo="Explorar eventos"
              icono="explorar"
              onPress={() => navigation.navigate('ExplorarTab', { screen: 'Explorar' })}
            />
          }
        />
      ) : filtradas.length === 0 ? (
        <EmptyView
          icono="ticket"
          titulo="No tenés compras en este estado"
          accion={
            <Boton titulo="Ver todas" variante="secundario" onPress={() => setFiltro('TODAS')} />
          }
        />
      ) : (
        <PantallaScroll>
          <Grupo titulo="Próximos" compras={proximas} onAbrir={abrir} />
          <Grupo titulo="Pasados" compras={pasadas} onAbrir={abrir} />
        </PantallaScroll>
      )}
    </View>
  );
}

function Grupo({ titulo, compras, onAbrir }) {
  if (compras.length === 0) return null;
  return (
    <View style={styles.grupo}>
      <TituloSeccion>{titulo}</TituloSeccion>
      {compras.map((c) => (
        <CompraItem key={c.id} compra={c} onPress={() => onAbrir(c)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  barraChips: { flexGrow: 0 },
  chips: { gap: espaciado.sm, paddingHorizontal: espaciado.md, paddingTop: espaciado.md },
  grupo: { gap: espaciado.sm },
});

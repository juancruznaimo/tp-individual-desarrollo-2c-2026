import { StyleSheet, Text, View } from 'react-native';

import { listarFavoritos } from '../../api/endpoints';
import Boton from '../../components/Boton';
import { EmptyView, ErrorView, Loading } from '../../components/EstadosPantalla';
import EventoCard from '../../components/EventoCard';
import { PantallaScroll, Tarjeta, TituloSeccion } from '../../components/Layout';
import { useUsuario } from '../../context/UsuarioContext';
import { useApi } from '../../hooks/useApi';
import { useRecargarAlVolver } from '../../hooks/varios';
import { colores, espaciado, radios } from '../../theme';
import { iniciales, nombreCompleto } from '../../utils/formato';

export default function PerfilScreen({ navigation }) {
  const { usuario, salir } = useUsuario();
  const favoritos = useApi(() => listarFavoritos(), usuario.id);
  useRecargarAlVolver(favoritos.recargar);

  const abrirEvento = (evento) =>
    navigation.navigate('ExplorarTab', {
      screen: 'DetalleEvento',
      params: { id: evento.id },
      initial: false,
    });

  return (
    <PantallaScroll>
      <Tarjeta estilo={styles.tarjeta}>
        <View style={styles.avatar}>
          <Text style={styles.iniciales}>{iniciales(usuario)}</Text>
        </View>
        <Text accessibilityRole="header" style={styles.nombre}>
          {nombreCompleto(usuario)}
        </Text>
        <Text style={styles.email}>{usuario.email}</Text>
      </Tarjeta>

      <View style={styles.seccion}>
        <TituloSeccion>Favoritos</TituloSeccion>
        <Favoritos
          {...favoritos}
          onAbrir={abrirEvento}
          onExplorar={() => navigation.navigate('ExplorarTab', { screen: 'Explorar' })}
        />
      </View>

      <Boton titulo="Cambiar de usuario" icono="salir" variante="secundario" onPress={salir} />
    </PantallaScroll>
  );
}

function Favoritos({ data, error, cargando, recargar, onAbrir, onExplorar }) {
  if (cargando && !data) return <Loading />;
  if (error && !data) return <ErrorView error={error} onReintentar={recargar} />;
  if (data.length === 0) {
    return (
      <EmptyView
        icono="corazon"
        titulo="Todavía no guardaste eventos"
        detalle="Tocá el corazón en un evento para encontrarlo rápido desde acá."
        accion={<Boton titulo="Explorar eventos" variante="secundario" onPress={onExplorar} />}
      />
    );
  }
  return data.map((evento) => (
    <EventoCard key={evento.id} evento={evento} onPress={() => onAbrir(evento)} />
  ));
}

const styles = StyleSheet.create({
  seccion: { gap: espaciado.md },
  tarjeta: { alignItems: 'center', paddingVertical: espaciado.lg },
  avatar: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radios.pill,
    backgroundColor: colores.primarioSuave,
  },
  iniciales: { fontSize: 26, fontWeight: '700', color: colores.primario },
  nombre: { fontSize: 22, fontWeight: '700', color: colores.texto },
  email: { fontSize: 15, color: colores.textoSecundario },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { listarUsuarios } from '../api/endpoints';
import { ErrorView, Loading } from '../components/EstadosPantalla';
import Icono from '../components/Icono';
import { PantallaScroll } from '../components/Layout';
import { useUsuario } from '../context/UsuarioContext';
import { useApi } from '../hooks/useApi';
import { colores, espaciado, radios } from '../theme';
import { iniciales, nombreCompleto } from '../utils/formato';

/** Autenticación simulada: se elige uno de los usuarios del seed. */
export default function SeleccionUsuarioScreen() {
  const { ingresar } = useUsuario();
  const { data: usuarios, error, cargando, recargar } = useApi(listarUsuarios, 'usuarios');

  return (
    <PantallaScroll>
      <View style={styles.encabezado}>
        <View style={styles.logo}>
          <Icono nombre="ticket" tamanio={36} color={colores.sobrePrimario} />
        </View>
        <Text accessibilityRole="header" style={styles.titulo}>
          AI Ticket It
        </Text>
        <Text style={styles.subtitulo}>Elegí con qué usuario querés ingresar</Text>
      </View>

      {cargando && <Loading />}
      {error && <ErrorView error={error} onReintentar={recargar} />}

      {!cargando &&
        !error &&
        usuarios.map((usuario) => (
          <Pressable
            key={usuario.id}
            accessibilityRole="button"
            accessibilityLabel={`Ingresar como ${nombreCompleto(usuario)}`}
            onPress={() => ingresar(usuario)}
            style={({ pressed, hovered }) => [
              styles.usuario,
              (pressed || hovered) && styles.activo,
            ]}
          >
            <View style={styles.avatar}>
              <Text style={styles.iniciales}>{iniciales(usuario)}</Text>
            </View>
            <View style={styles.datos}>
              <Text style={styles.nombre}>{nombreCompleto(usuario)}</Text>
              <Text style={styles.email}>{usuario.email}</Text>
            </View>
            <Icono nombre="chevron-derecha" color={colores.textoSecundario} />
          </Pressable>
        ))}
    </PantallaScroll>
  );
}

const styles = StyleSheet.create({
  encabezado: { alignItems: 'center', gap: espaciado.sm, paddingVertical: espaciado.xl },
  logo: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radios.lg,
    backgroundColor: colores.primario,
  },
  titulo: { fontSize: 28, fontWeight: '800', color: colores.texto },
  subtitulo: { fontSize: 16, color: colores.textoSecundario, textAlign: 'center' },
  usuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.md,
    padding: espaciado.md,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  activo: { borderColor: colores.primario },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radios.pill,
    backgroundColor: colores.primarioSuave,
  },
  iniciales: { fontSize: 17, fontWeight: '700', color: colores.primario },
  datos: { flex: 1, gap: 2 },
  nombre: { fontSize: 17, fontWeight: '600', color: colores.texto },
  email: { fontSize: 14, color: colores.textoSecundario },
});

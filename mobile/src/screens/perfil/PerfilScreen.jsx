import { StyleSheet, Text, View } from 'react-native';

import Boton from '../../components/Boton';
import { PantallaScroll, Tarjeta } from '../../components/Layout';
import { useUsuario } from '../../context/UsuarioContext';
import { colores, espaciado, radios } from '../../theme';
import { iniciales, nombreCompleto } from '../../utils/formato';

/** Datos del usuario y cambio de usuario. La Etapa 6 suma la lista de favoritos. */
export default function PerfilScreen() {
  const { usuario, salir } = useUsuario();

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
      <Boton titulo="Cambiar de usuario" icono="salir" variante="secundario" onPress={salir} />
    </PantallaScroll>
  );
}

const styles = StyleSheet.create({
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

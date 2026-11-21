import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { crearEvento, listarCategorias } from '../../api/endpoints';
import Boton from '../../components/Boton';
import { Campo, CampoTexto } from '../../components/Campo';
import Chip from '../../components/Chip';
import DateTimeInput from '../../components/DateTimeInput';
import { ErrorView, Loading, MensajeError } from '../../components/EstadosPantalla';
import Icono from '../../components/Icono';
import { PantallaScroll, Tarjeta, TituloSeccion } from '../../components/Layout';
import { useApi } from '../../hooks/useApi';
import { colores, espaciado } from '../../theme';
import {
  armarEvento,
  erroresDelBackend,
  MAXIMO_IMAGENES,
  validarEvento,
} from '../../utils/validacionEvento';

const aFechaLocal = (ms) => {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

const tipoVacio = (clave) => ({ clave, nombre: '', descripcion: '', precio: '', cupo: '' });

export default function CrearEventoScreen({ navigation }) {
  const categorias = useApi(() => listarCategorias());
  const [ahora] = useState(() => Date.now());
  const siguienteClave = useRef(1);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    categoriaId: null,
    fecha: '',
    lugar: '',
    multimedia: [],
    tiposEntrada: [tipoVacio(0)],
  });
  const [intentado, setIntentado] = useState(false);
  const [erroresServidor, setErroresServidor] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (categorias.cargando && !categorias.data) return <Loading />;
  if (categorias.error && !categorias.data) {
    return <ErrorView error={categorias.error} onReintentar={categorias.recargar} />;
  }

  const erroresCliente = validarEvento(form, ahora);
  const errores = intentado ? { ...erroresServidor, ...erroresCliente } : erroresServidor;
  const cantidadErrores = Object.keys(errores).length;

  const cambiar = (cambios) => {
    setForm((f) => ({ ...f, ...cambios }));
    setErroresServidor({});
    setErrorGeneral(null);
  };

  const cambiarTipo = (i, cambios) =>
    cambiar({
      tiposEntrada: form.tiposEntrada.map((t, j) => (j === i ? { ...t, ...cambios } : t)),
    });

  const agregarTipo = () =>
    cambiar({ tiposEntrada: [...form.tiposEntrada, tipoVacio(siguienteClave.current++)] });

  const quitarTipo = (i) => cambiar({ tiposEntrada: form.tiposEntrada.filter((_, j) => j !== i) });

  const cambiarImagen = (i, url) =>
    cambiar({ multimedia: form.multimedia.map((u, j) => (j === i ? url : u)) });

  const publicar = async () => {
    setIntentado(true);
    if (Object.keys(erroresCliente).length > 0) return;
    setEnviando(true);
    try {
      const evento = await crearEvento(armarEvento(form));
      navigation.popTo('MisEventos', { creado: evento.nombre });
    } catch (e) {
      if (e.detalles?.length) setErroresServidor(erroresDelBackend(e.detalles));
      setErrorGeneral(e.message);
      setEnviando(false);
    }
  };

  return (
    <PantallaScroll>
      <Tarjeta estilo={styles.seccion}>
        <TituloSeccion>Datos del evento</TituloSeccion>
        <CampoTexto
          etiqueta="Nombre"
          value={form.nombre}
          onChangeText={(nombre) => cambiar({ nombre })}
          placeholder="Ej.: Los Piojos en River"
          maxLength={120}
          error={errores.nombre}
        />
        <CampoTexto
          etiqueta="Descripción"
          value={form.descripcion}
          onChangeText={(descripcion) => cambiar({ descripcion })}
          placeholder="Contá de qué se trata, quiénes participan, horarios…"
          multiline
          maxLength={2000}
          error={errores.descripcion}
        />
        <Campo etiqueta="Categoría" error={errores.categoriaId}>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {categorias.data.map((c) => (
              <Chip
                key={c.id}
                etiqueta={c.nombre}
                seleccionado={form.categoriaId === c.id}
                onPress={() => cambiar({ categoriaId: c.id })}
              />
            ))}
          </View>
        </Campo>
        <Campo etiqueta="Fecha y hora" error={errores.fecha}>
          <DateTimeInput
            etiqueta="Fecha y hora"
            valor={form.fecha}
            min={aFechaLocal(ahora)}
            onCambio={(fecha) => cambiar({ fecha })}
            error={errores.fecha}
          />
        </Campo>
        <CampoTexto
          etiqueta="Lugar"
          value={form.lugar}
          onChangeText={(lugar) => cambiar({ lugar })}
          placeholder="Ej.: Estadio Monumental, CABA"
          maxLength={200}
          error={errores.lugar}
        />
      </Tarjeta>

      <Tarjeta estilo={styles.seccion}>
        <TituloSeccion>Imágenes</TituloSeccion>
        <Text style={styles.ayuda}>
          URLs de imágenes (http o https). La primera es la portada. Opcional.
        </Text>
        {form.multimedia.map((url, i) => (
          <View key={i} style={styles.filaImagen}>
            <CampoTexto
              estilo={styles.flex}
              value={url}
              onChangeText={(u) => cambiarImagen(i, u)}
              placeholder="https://…"
              inputMode="url"
              autoCapitalize="none"
              accessibilityLabel={`URL de la imagen ${i + 1}`}
              error={errores[`multimedia[${i}]`]}
            />
            <BotonQuitar
              etiqueta={`Quitar la imagen ${i + 1}`}
              onPress={() => cambiar({ multimedia: form.multimedia.filter((_, j) => j !== i) })}
            />
          </View>
        ))}
        <MensajeError>{errores.multimedia}</MensajeError>
        {form.multimedia.length < MAXIMO_IMAGENES && (
          <Boton
            titulo="Agregar imagen"
            icono="imagen"
            variante="texto"
            onPress={() => cambiar({ multimedia: [...form.multimedia, ''] })}
          />
        )}
      </Tarjeta>

      <View style={styles.seccion}>
        <TituloSeccion>Tipos de entrada</TituloSeccion>
        {form.tiposEntrada.map((tipo, i) => {
          const campo = (nombre) => errores[`tiposEntrada[${i}].${nombre}`];
          return (
            <Tarjeta key={tipo.clave} estilo={styles.seccion}>
              <View style={styles.encabezadoTipo}>
                <Text style={styles.tituloTipo}>Tipo {i + 1}</Text>
                {form.tiposEntrada.length > 1 && (
                  <BotonQuitar etiqueta={`Quitar el tipo ${i + 1}`} onPress={() => quitarTipo(i)} />
                )}
              </View>
              <CampoTexto
                etiqueta="Nombre"
                value={tipo.nombre}
                onChangeText={(nombre) => cambiarTipo(i, { nombre })}
                placeholder="Ej.: General, Platea, VIP"
                maxLength={60}
                error={campo('nombre')}
              />
              <CampoTexto
                etiqueta="Descripción (opcional)"
                value={tipo.descripcion}
                onChangeText={(descripcion) => cambiarTipo(i, { descripcion })}
                placeholder="Ej.: De pie, cerca del escenario"
                maxLength={300}
                error={campo('descripcion')}
              />
              <View style={styles.filaNumeros}>
                <CampoTexto
                  estilo={styles.flex}
                  etiqueta="Precio ($)"
                  value={tipo.precio}
                  onChangeText={(precio) => cambiarTipo(i, { precio })}
                  placeholder="0 = gratis"
                  inputMode="decimal"
                  error={campo('precio')}
                />
                <CampoTexto
                  estilo={styles.flex}
                  etiqueta="Cupo"
                  value={tipo.cupo}
                  onChangeText={(cupo) => cambiarTipo(i, { cupo })}
                  placeholder="Ej.: 500"
                  inputMode="numeric"
                  error={campo('cupo')}
                />
              </View>
            </Tarjeta>
          );
        })}
        <MensajeError>{errores.tiposEntrada}</MensajeError>
        <Boton
          titulo="Agregar tipo de entrada"
          icono="mas"
          variante="secundario"
          onPress={agregarTipo}
        />
      </View>

      {intentado && cantidadErrores > 0 && (
        <MensajeError>
          {errorGeneral ??
            `Revisá ${cantidadErrores === 1 ? 'el campo marcado' : `los ${cantidadErrores} campos marcados`}.`}
        </MensajeError>
      )}
      {cantidadErrores === 0 && <MensajeError>{errorGeneral}</MensajeError>}
      <Boton titulo="Publicar evento" icono="check" cargando={enviando} onPress={publicar} />
    </PantallaScroll>
  );
}

function BotonQuitar({ etiqueta, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={({ hovered }) => [styles.quitar, hovered && styles.quitarHover]}
    >
      <Icono nombre="eliminar" color={colores.error} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: espaciado.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.sm },
  ayuda: { fontSize: 14, color: colores.textoSecundario },
  filaImagen: { flexDirection: 'row', alignItems: 'flex-start', gap: espaciado.sm },
  flex: { flex: 1 },
  encabezadoTipo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tituloTipo: { fontSize: 16, fontWeight: '700', color: colores.texto },
  filaNumeros: { flexDirection: 'row', gap: espaciado.md },
  quitar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  quitarHover: { backgroundColor: colores.errorSuave },
});

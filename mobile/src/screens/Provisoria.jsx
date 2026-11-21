import { EmptyView } from '../components/EstadosPantalla';

/** Pantalla provisoria para las secciones que se implementan en etapas posteriores. */
export function crearPantallaProvisoria({ icono, titulo, etapa }) {
  return function PantallaProvisoria() {
    return <EmptyView icono={icono} titulo={titulo} detalle={`Se implementa en la ${etapa}.`} />;
  };
}

export const MisEventosScreen = crearPantallaProvisoria({
  icono: 'calendario',
  titulo: 'Mis eventos',
  etapa: 'Etapa 7',
});

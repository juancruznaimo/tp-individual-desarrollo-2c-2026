import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { enviarMensaje, listarMensajes } from '../api/endpoints';

export const INTERVALO_POLLING_MS = 5000;

const pestaniaVisible = () =>
  typeof document === 'undefined' || document.visibilityState === 'visible';

function unir(actuales, nuevos) {
  const ids = new Set(actuales.map((m) => m.id));
  const agregados = nuevos.filter((m) => !ids.has(m.id));
  if (agregados.length === 0) return actuales;
  return [...actuales, ...agregados].sort((a, b) => a.enviado.localeCompare(b.enviado));
}

export function useMensajes(compraId) {
  const [mensajes, setMensajes] = useState(null);
  const [error, setError] = useState(null);
  const ultimo = useRef(null);
  const enCurso = useRef(false);

  const recibir = useCallback((nuevos, { avanzarCursor = true } = {}) => {
    if (avanzarCursor && nuevos.length > 0) {
      const masNuevo = nuevos[nuevos.length - 1].enviado;
      if (!ultimo.current || masNuevo > ultimo.current) ultimo.current = masNuevo;
    }
    setMensajes((actuales) => unir(actuales ?? [], nuevos));
  }, []);

  const consultar = useCallback(async () => {
    if (enCurso.current) return;
    enCurso.current = true;
    try {
      recibir(await listarMensajes(compraId, ultimo.current ?? undefined));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      enCurso.current = false;
    }
  }, [compraId, recibir]);

  useFocusEffect(
    useCallback(() => {
      consultar();
      const intervalo = setInterval(() => {
        if (pestaniaVisible()) consultar();
      }, INTERVALO_POLLING_MS);
      const alCambiarVisibilidad = () => {
        if (pestaniaVisible()) consultar();
      };
      document.addEventListener('visibilitychange', alCambiarVisibilidad);
      return () => {
        clearInterval(intervalo);
        document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      };
    }, [consultar]),
  );

  const enviar = useCallback(
    async (texto) => {
      const mensaje = await enviarMensaje(compraId, texto);
      recibir([mensaje], { avanzarCursor: false });
      return mensaje;
    },
    [compraId, recibir],
  );

  const reintentar = useCallback(() => {
    setError(null);
    consultar();
  }, [consultar]);

  return { mensajes, error, enviar, reintentar };
}

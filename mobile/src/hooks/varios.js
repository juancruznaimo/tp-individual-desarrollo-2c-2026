import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { BREAKPOINT_ANCHO } from '../theme';

/** Devuelve `valor` recién cuando dejó de cambiar durante `ms` (búsqueda con debounce). */
export function useDebounce(valor, ms = 400) {
  const [demorado, setDemorado] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setDemorado(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return demorado;
}

/** `true` en pantallas anchas (tablet / escritorio). Se recalcula al rotar o redimensionar. */
export function useEsAncho() {
  const { width } = useWindowDimensions();
  return width >= BREAKPOINT_ANCHO;
}

/**
 * Ejecuta `recargar` cada vez que la pantalla vuelve a tener foco, salvo la primera
 * (en la primera la carga ya la hace useApi). Sirve para ver datos frescos al volver
 * de otra pantalla (ej. el cupo después de comprar).
 */
export function useRecargarAlVolver(recargar) {
  const primeraVez = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) {
        primeraVez.current = false;
        return;
      }
      recargar();
    }, [recargar]),
  );
}

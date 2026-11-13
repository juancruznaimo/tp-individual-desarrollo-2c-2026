import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { setUsuarioActual } from '../api/client';
import { borrar, guardar, leer } from '../utils/storage';

const CLAVE = 'usuario';
const UsuarioContext = createContext(null);

/** El usuario elegido en el selector; se recuerda en localStorage entre visitas. */
function usuarioInicial() {
  const usuario = leer(CLAVE);
  setUsuarioActual(usuario?.id ?? null);
  return usuario;
}

export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(usuarioInicial);

  const ingresar = useCallback((nuevo) => {
    setUsuarioActual(nuevo.id);
    guardar(CLAVE, nuevo);
    setUsuario(nuevo);
  }, []);

  const salir = useCallback(() => {
    setUsuarioActual(null);
    borrar(CLAVE);
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, ingresar, salir }), [usuario, ingresar, salir]);
  return <UsuarioContext.Provider value={valor}>{children}</UsuarioContext.Provider>;
}

export function useUsuario() {
  const contexto = useContext(UsuarioContext);
  if (!contexto) throw new Error('useUsuario debe usarse dentro de <UsuarioProvider>');
  return contexto;
}

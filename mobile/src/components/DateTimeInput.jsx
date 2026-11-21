import { TextInput } from 'react-native';

import { colores } from '../theme';
import { estilosInput } from './Campo';

export default function DateTimeInput({ valor, onCambio, error, etiqueta }) {
  return (
    <TextInput
      value={valor}
      onChangeText={onCambio}
      placeholder="AAAA-MM-DDTHH:MM"
      placeholderTextColor={colores.textoSecundario}
      accessibilityLabel={etiqueta}
      style={[estilosInput.input, error && estilosInput.conError]}
    />
  );
}

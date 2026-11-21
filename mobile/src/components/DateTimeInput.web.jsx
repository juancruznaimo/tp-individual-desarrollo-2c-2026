import { colores, espaciado, radios } from '../theme';

export default function DateTimeInput({ valor, onCambio, min, error, etiqueta }) {
  return (
    <input
      type="datetime-local"
      value={valor}
      min={min}
      aria-label={etiqueta}
      aria-invalid={Boolean(error)}
      onChange={(e) => onCambio(e.target.value)}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        minHeight: 48,
        padding: `0 ${espaciado.md}px`,
        fontSize: 16,
        fontFamily: 'inherit',
        borderRadius: radios.md,
        border: `1px solid ${error ? colores.error : colores.borde}`,
        backgroundColor: colores.superficie,
        color: colores.texto,
      }}
    />
  );
}

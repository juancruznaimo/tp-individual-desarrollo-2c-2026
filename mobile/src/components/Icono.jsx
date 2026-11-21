import {
  ArrowDownUp,
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  CircleAlert,
  Clock,
  Compass,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  RotateCcw,
  Search,
  SendHorizontal,
  SlidersHorizontal,
  Star,
  StarHalf,
  Ticket,
  User,
  WifiOff,
  X,
} from 'lucide-react';

/**
 * Único punto de contacto con la librería de íconos. Se usa `lucide-react` (SVG del
 * navegador) porque `react-native-svg` no compila para web con Vite; si la app pasara
 * a nativo, solo cambia este archivo (por `lucide-react-native`).
 */
const ICONOS = {
  'flecha-atras': ArrowLeft,
  calendario: Calendar,
  check: Check,
  'chevron-derecha': ChevronRight,
  alerta: CircleAlert,
  reloj: Clock,
  explorar: Compass,
  corazon: Heart,
  salir: LogOut,
  ubicacion: MapPin,
  mensaje: MessageCircle,
  menos: Minus,
  mas: Plus,
  devolucion: RotateCcw,
  buscar: Search,
  enviar: SendHorizontal,
  filtros: SlidersHorizontal,
  ordenar: ArrowDownUp,
  estrella: Star,
  'media-estrella': StarHalf,
  ticket: Ticket,
  usuario: User,
  'sin-conexion': WifiOff,
  cerrar: X,
};

export default function Icono({ nombre, tamanio = 20, color = 'currentColor', relleno = 'none' }) {
  const Componente = ICONOS[nombre];
  if (!Componente) return null;
  return (
    <Componente
      size={tamanio}
      color={color}
      fill={relleno}
      strokeWidth={2}
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block' }}
    />
  );
}

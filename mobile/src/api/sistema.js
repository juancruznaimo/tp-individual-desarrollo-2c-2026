import { request } from './client';

export const obtenerHealth = () => request('/health');

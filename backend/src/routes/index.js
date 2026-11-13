import { Router } from 'express';

export function crearRouterApi() {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}

import { Hono } from 'hono';
import { openapiSpec } from './openapi';
import { getSwaggerHtml } from './swagger-ui';

const docs = new Hono();

// GET /docs — Tampilan interaktif Swagger UI
docs.get('/', (c) => {
  return c.html(getSwaggerHtml('/openapi.json'));
});

export { docs as docsRoutes, openapiSpec };


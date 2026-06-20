import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { notFound, errorHandler } from './middleware/error';
import { sanitizeMongo } from './middleware/sanitize';
import { env } from './config/env';

export function createApp(): Application {
  const app = express();

  // Real client IP behind a proxy (drives rate-limit keys); off by default.
  app.set('trust proxy', env.trustProxy);

  app.use(helmet());
  // Never reflect an arbitrary origin together with credentials. The wildcard
  // path only exists in dev (env rejects '*' in production) and runs without
  // credentials; an explicit allowlist enables credentials safely.
  const allowAllOrigins = env.corsOrigin === '*';
  app.use(
    cors({
      origin: allowAllOrigins ? true : env.corsOrigin.split(',').map((o) => o.trim()),
      credentials: !allowAllOrigins,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Strip MongoDB operator keys ($-prefixed / dotted) from all inputs before
  // any handler builds a query — defense-in-depth against NoSQL injection.
  app.use(sanitizeMongo);
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.use('/api/v1', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

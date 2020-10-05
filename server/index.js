import path from 'path';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import Pug from 'pug';
import pointOfView from 'point-of-view';
import dotenv from 'dotenv';
import Rollbar from 'rollbar';
import webpackConfig from '../webpack.config';

dotenv.config();
const { ROLLBAR: accessToken, NODE_NEV: mode = 'development' } = process.env;
const isProduction = mode === 'production';
const isDevelopment = mode === 'development';
const rollbar = new Rollbar({
  accessToken,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

const setUpStaticAssets = (app) => {
  const pathPublic = isProduction
    ? path.join(__dirname, '..', 'public')
    : path.join(__dirname, '..', 'dist', 'public');
  app.register(fastifyStatic, {
    root: pathPublic,
    prefix: '/assets/',
  });
};

const setUpViews = (app) => {
  const { devServer: { host, port } } = webpackConfig;
  const devHost = `http://${host}:${port}`;
  const domain = isDevelopment ? devHost : '';
  app.register(pointOfView, {
    engine: {
      pug: Pug,
    },
    includeViewExtension: true,
    defaultContext: {
      assetsPath: (filename) => `${domain}/assets/${filename}`,
    },
    root: path.join(__dirname, '..', 'server', 'views'),
  });
};

const setUpErrorHandlers = (app) => {
  app.setErrorHandler((err) => {
    rollbar.log(err);
  });
};

export default () => {
  const app = fastify({
    logger: {
      prettyPrint: isDevelopment,
      timestamp: isProduction,
      base: null,
    },
  });
  setUpErrorHandlers(app);
  setUpViews(app);
  setUpStaticAssets(app);
  app.get('/', (req, reply) => {
    reply.view('/index');
  });

  return app;
};

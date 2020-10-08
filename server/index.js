import path from 'path';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import fastifyObjectionjs from 'fastify-objectionjs';
import fastifyMethodOverride from 'fastify-method-override';
import fastifySecureSession from 'fastify-secure-session';
import fastifyFormBody from 'fastify-formbody';
import fastifyFlash from 'fastify-flash';
import Pug from 'pug';
import pointOfView from 'point-of-view';
import dotenv from 'dotenv';
import Rollbar from 'rollbar';
import webpackConfig from '../webpack.config';
import knexConfig from '../knexfile';
import models from './models/index';
import addRoutes from './routes/index';

dotenv.config();
const {
  ROLLBAR: accessToken, NODE_ENV: mode = 'development', SECRET_KEY: secret, SALT: salt,
} = process.env;
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
  app.decorateReply('render', function render(viewPath, locals) {
    this.view(viewPath, { ...locals, reply: this });
  });
};

const setUpErrorHandlers = (app) => {
  app.setErrorHandler((err) => {
    rollbar.log(err);
  });
};

const registerPlugins = (app) => {
  app.register(fastifyObjectionjs, {
    knexConfig: knexConfig[mode],
    models,
  });
  app.register(fastifyMethodOverride);
  app.register(fastifyFormBody);
  app.register(fastifySecureSession, {
    secret,
    salt,
  });
  app.register(fastifyFlash);
};

const addHooks = (app) => {
  app.decorateRequest('currentUser', null);
  app.decorateRequest('signedIn', false);

  app.addHook('preHandler', async (req) => {
    const userId = req.session.get('userId');
    if (userId) {
      req.currentUser = await app.objection.models.user.query().findById(userId);
      req.signedIn = true;
    }
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
  registerPlugins(app);
  addHooks(app);
  addRoutes(app);
  setUpErrorHandlers(app);
  setUpViews(app);
  setUpStaticAssets(app);

  return app;
};

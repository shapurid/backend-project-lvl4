import path from 'path';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import fastifyObjectionjs from 'fastify-objectionjs';
import fastifyMethodOverride from 'fastify-method-override';
import fastifySecureSession from 'fastify-secure-session';
import fastifyFormBody from 'fastify-formbody';
import fastifyFlash from 'fastify-flash';
import fastifySensible from 'fastify-sensible';
import fastifyReverseRoutes from 'fastify-reverse-routes';
import Pug from 'pug';
import pointOfView from 'point-of-view';
import dotenv from 'dotenv';
import Rollbar from 'rollbar';
import i18next from 'i18next';
import getHelpers from './helpers/index';
import ru from './locales/ru';
import webpackConfig from '../webpack.config';
import knexConfig from '../knexfile';
import models from './models/index';
import addRoutes from './routes/index';

dotenv.config();
const {
  ROLLBAR: accessToken,
  NODE_ENV: mode = 'development',
  SECRET_KEY: secret = 'averylogphrasebiggerthanthirtytwochars',
  SALT: salt = 'mq9hDxBVDbspDR6n',
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
  const helpers = getHelpers(app);
  app.register(pointOfView, {
    engine: {
      pug: Pug,
    },
    includeViewExtension: true,
    defaultContext: {
      ...helpers,
      assetsPath: (filename) => `${domain}/assets/${filename}`,
    },
    root: path.join(__dirname, '..', 'server', 'views'),
  });
  app.decorateReply('render', function render(viewPath, locals) {
    this.view(viewPath, { ...locals, reply: this });
  });
};

const setUpErrorHandlers = (app) => {
  app
    .register(fastifySensible)
    .after(() => app.setErrorHandler((err, req, reply) => {
      const { statusCode } = err;
      if (statusCode) {
        reply
          .code(statusCode)
          .render(`/errors/${statusCode}`);
        return reply;
      }
      rollbar.log(err);
      return reply;
    }));
};

const setupLocalization = () => i18next
  .init({
    lng: 'ru',
    fallbackLng: 'en',
    debug: isDevelopment,
    resources: {
      ru,
    },
  });

const registerPlugins = (app) => {
  app.register(fastifyObjectionjs, {
    knexConfig: knexConfig[mode],
    models,
  });
  app.register(fastifyMethodOverride);
  app.register(fastifyFormBody);
  app.register(fastifySecureSession, {
    cookieName: 'session-cookie',
    secret,
    salt,
    cookie: {
      path: '/',
    },
  });
  app.register(fastifyFlash);
  app.register(fastifyReverseRoutes.plugin);
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
    ajv: {
      customOptions: {
        allErrors: true,
      },
    },
  });
  registerPlugins(app);
  setUpErrorHandlers(app);
  setupLocalization();
  setUpViews(app);
  setUpStaticAssets(app);
  addHooks(app);
  addRoutes(app);
  return app;
};

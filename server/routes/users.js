import {
  pick,
  parseInt,
  toPairs,
  fromPairs,
} from 'lodash';
import encrypt from '../lib/secure';
import validationErrorsHandler from '../errors/validationErrorsHandler';
import SchemaError from '../errors/SchemaError';
import AccessDeniedError from '../errors/AccessDeniedError';
import NotFoundError from '../errors/NotFoundError';

export default (app) => {
  app
    .get('/users', async (req, reply) => {
      try {
        const users = await app.objection.models.user.query().select('id', 'firstName', 'lastName', 'email');
        reply.render('/users/index', { users });
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    })
    .get('/users/:id', async (req, reply) => {
      try {
        if (!req.signedIn) {
          throw new AccessDeniedError();
        }
        const routeId = parseInt(req.params.id);
        const user = await app.objection.models.user.query().select('firstName', 'lastName', 'email').findById(routeId);
        if (!user) {
          throw new NotFoundError();
        }
        reply.render('/users/profile', { ...user, errors: {} });
        return reply;
      } catch (error) {
        if (error.status === 403) {
          reply.code(error.status).render('/errors/403');
          return reply;
        }
        if (error.status === 404) {
          reply.code(error.status).render('/errors/404');
          return reply;
        }
        throw new Error(error);
      }
    })
    .get('/users/new', (req, reply) => {
      reply.render('/users/new', { errors: {} });
    })
    .post('/users', {
      schema: {
        body: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: {
              type: 'string',
              minLength: 1,
            },
            lastName: {
              type: 'string',
              minLength: 1,
            },
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              minLength: 3,
            },
          },
        },
      },
      attachValidation: true,
    }, async (req, reply) => {
      try {
        const { validationError, body } = req;
        if (validationError) {
          throw new SchemaError(validationError);
        }
        const user = await app.objection.models.user.fromJson(body);
        const findedUser = await app.objection.models.user.query().findOne({ email: user.email });
        if (findedUser) {
          const data = pick(user, ['firstName', 'lastName']);
          req.flash('danger', 'Пользователь с таким e-mail уже зарегистрирован.');
          reply
            .status(422)
            .render('/users/new', { errors: { email: {}, password: {} }, ...data });
          return reply;
        }
        await app.objection.models.user.query().insert(user);
        req.flash('success', 'Вы успешно зарегистрированы.');
        reply.redirect('/');
        return reply;
      } catch (error) {
        if (error.type === 'ModelValidation' || error.type === 'SchemaError') {
          const validationResult = validationErrorsHandler(error.data, req.body);
          reply.render('/users/new', validationResult);
          return reply;
        }
        throw new Error(error);
      }
    })
    .patch('/users/:id', {
      schema: {
        body: {
          type: 'object',
          required: ['password'],
          properties: {
            firstName: {
              type: 'string',
              minLength: 1,
            },
            lastName: {
              type: 'string',
              minLength: 1,
            },
            email: {
              type: 'string',
              format: 'email',
            },
            newPassword: {
              type: 'string',
              minLength: 3,
            },
            password: {
              type: 'string',
              minLength: 3,
            },
            _method: {
              type: 'string',
            },
          },
        },
      },
      attachValidation: true,
    }, async (req, reply) => {
      try {
        const routeId = parseInt(req.params.id);
        const sessionId = req.session.get('userId');
        const { validationError, body: { password, ...otherBodyData } } = req;
        if (sessionId !== routeId) {
          throw new AccessDeniedError();
        }
        if (validationError) {
          throw new SchemaError(validationError);
        }
        const currentUser = await app.objection.models.user.query().findById(sessionId);
        if (encrypt(password) !== currentUser.passwordDigest) {
          reply.render('/users/profile', { ...currentUser, errors: { password: {} } });
          return reply;
        }
        const filteredBodyData = toPairs(otherBodyData)
          .filter(([key, value]) => (key !== '_method') && (value.length > 0))
          .map(([key, value]) => {
            if (key === 'newPassword') {
              return ['password', value];
            }
            return [key, value];
          });
        const updateObject = fromPairs(filteredBodyData);
        await currentUser.$query().patch(updateObject);
        req.currentUser = currentUser;
        req.flash('info', 'Профиль успешно обновлён.');
        reply.render('/users/profile', { ...currentUser, errors: {} });
        return reply;
      } catch (error) {
        console.log(error);
        if (error.type === 'ModelValidation' || error.type === 'SchemaError') {
          const validationResult = validationErrorsHandler(error.data, req.body);
          reply.render('/users/profile', validationResult);
          return reply;
        }
        if (error.status === 403) {
          reply.render('/errors/403');
          return reply;
        }
        throw new Error(error);
      }
    })
    .delete('/users/:id', async (req, reply) => {
      try {
        const routeId = parseInt(req.params.id);
        const sessionId = req.session.get('userId');
        if (sessionId !== routeId) {
          throw new AccessDeniedError();
        }
        await app.objection.models.user.query().deleteById(sessionId);
        req.session.set('userId', null);
        req.flash('danger', 'Пользователь удален!');
        reply.redirect('/');
        return reply;
      } catch (error) {
        if (error.status === 403) {
          reply.code(error.status).render('/errors/403');
          return reply;
        }
        throw new Error(error);
      }
    });
};

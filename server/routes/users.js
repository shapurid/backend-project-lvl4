import {
  pick,
  parseInt,
  omit,
  pickBy,
  assign,
} from 'lodash';
import SchemaError from '../errors/SchemaError';
import validationErrorsHandler from '../errors/validationErrorsHandler';
import encrypt from '../lib/encrypt';

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
          reply.forbidden();
          return reply;
        }
        const routeId = parseInt(req.params.id);
        const user = await app.objection.models.user.query().select('firstName', 'lastName', 'email').findById(routeId);
        if (!user) {
          reply.notFound();
          return reply;
        }
        reply.render('/users/profile', { ...user, errors: {} });
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    })
    .get('/users/new', (req, reply) => {
      reply.render('/users/new', { errors: {} });
    })
    .post('/users', {
      schema: {
        body: {
          $ref: 'userRegistrationSchema',
        },
      },
      attachValidation: true,
    }, async (req, reply) => {
      const { validationError, body } = req;
      try {
        if (validationError) {
          throw new SchemaError(validationError);
        }
        const user = await app.objection.models.user.fromJson(body);
        const foundedUser = await app.objection.models.user.query().findOne({ email: user.email });
        if (foundedUser) {
          const data = pick(user, ['firstName', 'lastName']);
          req.flash('danger', 'Пользователь с таким e-mail уже зарегистрирован.');
          reply
            .status(422)
            .render('/users/new', { errors: { email: {}, password: {} }, ...data });
          return reply;
        }
        await app.objection.models.user.query().insert(user);
        req.flash('success', 'Вы успешно зарегистрированы.');
        reply.redirect(app.reverse('root'));
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
          $ref: 'userUpdateSchema#',
        },
      },
      attachValidation: true,
    }, async (req, reply) => {
      const { validationError } = req;
      try {
        if (validationError) {
          throw new SchemaError(validationError);
        }
        if (!req.isOwnProfile) {
          reply.forbidden();
          return reply;
        }
        const filteredBody = pickBy(req.body, (el) => el.length > 0);
        const { password, ...otherData } = filteredBody;
        const bodyWithUpdatedPassword = assign(otherData,
          password ? { passwordDigest: encrypt(password) } : {});
        const bodyWithoutMethod = omit(bodyWithUpdatedPassword, '_method');
        const sessionId = req.session.get('userId');
        const currentUser = await app.objection.models.user.query().findById(sessionId);
        await currentUser.$query().patch(bodyWithoutMethod);
        req.currentUser = currentUser;
        req.flash('info', 'Профиль успешно обновлён.');
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (error) {
        if (error.type === 'ModelValidation' || error.type === 'SchemaError') {
          const validationResult = validationErrorsHandler(error.data, req.body);
          reply.render('/users/profile', validationResult);
          return reply;
        }
        throw new Error(error);
      }
    })
    .delete('/users/:id', async (req, reply) => {
      try {
        const sessionId = req.session.get('userId');
        await app.objection.models.user.query().deleteById(sessionId);
        req.session.set('userId', null);
        req.flash('danger', 'Пользователь удален!');
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    });
};

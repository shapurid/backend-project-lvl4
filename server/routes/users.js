import {
  pick,
  parseInt,
  omit,
  pickBy,
} from 'lodash';
import i18next from 'i18next';
import { checkSignedIn, checkProfileOwnership } from '../lib/preHandlers';
import encrypt from '../lib/encrypt';

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      try {
        const users = await app.objection.models.user.query().select('id', 'firstName', 'lastName', 'email');
        reply.render('/users/index', { users });
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    })
    .get('/users/:id', { preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const normalizedRouteId = parseInt(req.params.id);
        const user = await app.objection.models.user.query().select('firstName', 'lastName', 'email').findById(normalizedRouteId);
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
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      reply.render('/users/new', { errors: {} });
    })
    .post('/users', { name: 'createUser' }, async (req, reply) => {
      try {
        const user = await app.objection.models.user.fromJson(req.body);
        const foundUser = await app.objection.models.user.query().findOne({ email: user.email });
        if (foundUser) {
          const data = pick(user, ['firstName', 'lastName']);
          req.flash('danger', i18next.t('flash.users.create.error'));
          reply
            .status(422)
            .render('/users/new', { errors: { email: {}, password: {} }, ...data });
          return reply;
        }
        await app.objection.models.user.query().insert(user);
        req.flash('success', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch ({ data }) {
        reply
          .code(422)
          .render('users/new', { errors: data, ...req.body });
        return reply;
      }
    })
    .patch('/users/:id', { preHandler: checkProfileOwnership }, async (req, reply) => {
      try {
        const filteredBody = pickBy(req.body, (el) => el.length > 0);
        const { password, ...otherData } = filteredBody;
        const pass = password ? { passwordDigest: encrypt(password) } : {};
        const bodyWithUpdatedPassword = { ...otherData, ...pass };
        const bodyWithoutMethod = omit(bodyWithUpdatedPassword, '_method');
        const sessionId = req.session.get('userId');
        const currentUser = await app.objection.models.user.query().findById(sessionId);
        await currentUser.$query().patch(bodyWithoutMethod);
        req.currentUser = currentUser;
        req.flash('success', i18next.t('flash.users.modify.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch ({ data }) {
        reply
          .code(422)
          .render('users/new', { errors: data, ...req.body });
        return reply;
      }
    })
    .delete('/users/:id', { preHandler: checkProfileOwnership }, async (req, reply) => {
      try {
        const sessionId = req.session.get('userId');
        await app.objection.models.user.query().deleteById(sessionId);
        req.session.set('userId', null);
        req.flash('success', i18next.t('flash.users.delete.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    });
};

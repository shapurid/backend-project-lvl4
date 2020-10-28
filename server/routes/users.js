import { pickBy, isEmpty } from 'lodash';
import i18next from 'i18next';
import { checkSignedIn, checkProfileOwnership } from '../lib/preHandlers';
import encrypt from '../lib/encrypt';

export default (app) => {
  app
    .get('/users', { name: 'users', preHandler: checkSignedIn }, async (req, reply) => {
      const users = await app.objection.models.user.query().select('id', 'firstName', 'lastName', 'email');
      reply.render('/users/index', { users });
      return reply;
    })
    .get('/users/:id', { preHandler: checkSignedIn }, async (req, reply) => {
      const user = await app.objection.models.user.query().select('firstName', 'lastName', 'email').findById(req.params.id);
      if (!user) {
        reply.notFound();
        return reply;
      }
      reply.render('/users/profile', { ...user, errors: {} });
      return reply;
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      reply.render('/users/new', { errors: {} });
    })
    .post('/users', { name: 'createUser' }, async (req, reply) => {
      try {
        const user = await app.objection.models.user.fromJson(req.body);
        await app.objection.models.user.query().insert(user);
        req.flash('success', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch ({ data }) {
        const isEmailUniqErr = data.email
          ? data.email.some((el) => el.keyword === 'unique')
          : false;
        if (isEmailUniqErr) {
          req.flash('danger', i18next.t('flash.users.create.error'));
        }
        reply
          .code(422)
          .render('users/new', { errors: data, ...req.body });
        return reply;
      }
    })
    .patch('/users/:id', { preHandler: checkProfileOwnership }, async (req, reply) => {
      try {
        const { _method, ...body } = req.body;
        const filteredBody = pickBy(body, (el) => el.length > 0);
        const { password, ...otherData } = filteredBody;
        const pass = password ? { passwordDigest: encrypt(password) } : {};
        const bodyWithUpdatedPassword = { ...otherData, ...pass };
        const sessionId = req.session.get('userId');
        const currentUser = await app.objection.models.user.query().findById(sessionId);
        await currentUser.$query().patch(bodyWithUpdatedPassword);
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
      const sessionId = req.session.get('userId');
      const taksCreatorOrExecutor = await app
        .objection
        .models
        .task
        .query()
        .where('creatorId', sessionId)
        .orWhere('executorId', sessionId);
      if (!isEmpty(taksCreatorOrExecutor)) {
        req.flash('danger', i18next.t('flash.users.delete.error'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      }
      await app.objection.models.user.query().deleteById(sessionId);
      req.session.set('userId', null);
      req.flash('success', i18next.t('flash.users.delete.success'));
      reply.redirect(app.reverse('root'));
      return reply;
    });
};

import { pickBy, isEmpty } from 'lodash';
import i18next from 'i18next';
import { checkSignedIn, checkProfileOwnership } from '../lib/preHandlers';
import encrypt from '../lib/encrypt';

export default (app) => {
  app
    .get('/users', { name: 'usersIndex', preHandler: checkSignedIn }, async (req, reply) => {
      const users = await app.objection.models.user.query().select('id', 'firstName', 'lastName', 'email');
      reply.render('/users/index', { users });
      return reply;
    })
    .get('/users/:id', { name: 'usersShow', preHandler: checkSignedIn }, async (req, reply) => {
      const user = await app.objection.models.user.query().select('firstName', 'lastName', 'email').findById(req.params.id);
      if (!user) {
        reply.notFound();
        return reply;
      }
      const userForm = { translationPath: 'users.profile' };
      reply.render('/users/profile', { userForm, ...user });
      return reply;
    })
    .get('/users/new', { name: 'usersNew' }, (req, reply) => {
      const registrationForm = { translationPath: 'users.new' };
      reply.render('/users/new', { registrationForm });
    })
    .post('/users', { name: 'usersCreate' }, async (req, reply) => {
      try {
        const user = await app.objection.models.user.fromJson(req.body.form);
        await app.objection.models.user.query().insert(user);
        req.flash('success', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch ({ data }) {
        const registrationForm = { translationPath: 'users.new', ...req.body.form };
        req.flash('danger', i18next.t('flash.users.create.error'));
        reply
          .code(422)
          .render('/users/new', { errors: data, registrationForm });
        return reply;
      }
    })
    .patch('/users/:id', { name: 'usersUpdate', preHandler: checkProfileOwnership }, async (req, reply) => {
      const filteredBody = pickBy(req.body.form, (el) => el.length > 0);
      const { password, ...otherData } = filteredBody;
      const bodyWithUpdatedPassword = {
        ...otherData,
        ...(password ? { passwordDigest: encrypt(password) } : {}),
      };
      const userId = req.session.get('userId');
      try {
        const currentUser = await app.objection.models.user.query().findById(userId);
        await currentUser.$query().patch(bodyWithUpdatedPassword);
        req.currentUser = currentUser;
        req.flash('success', i18next.t('flash.users.modify.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch ({ data }) {
        const currentUser = await app.objection.models.user.query().findById(userId);
        const userForm = { translationPath: 'users.profile', ...req.body.form };
        reply
          .code(422)
          .render('/users/profile', { errors: data, userForm, ...currentUser });
        return reply;
      }
    })
    .delete('/users/:id', { name: 'usersDestroy', preHandler: checkProfileOwnership }, async (req, reply) => {
      const userId = req.session.get('userId');
      const taksCreatorOrExecutor = await app
        .objection
        .models
        .task
        .query()
        .where('creatorId', userId)
        .orWhere('executorId', userId);
      if (!isEmpty(taksCreatorOrExecutor)) {
        req.flash('danger', i18next.t('flash.users.delete.error'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      }
      await app.objection.models.user.query().deleteById(userId);
      req.session.set('userId', null);
      req.flash('success', i18next.t('flash.users.delete.success'));
      reply.redirect(app.reverse('root'));
      return reply;
    });
};

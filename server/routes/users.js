import { pickBy, isEmpty } from 'lodash';
import i18next from 'i18next';
import { checkSignedIn, checkProfileOwnership } from '../lib/auth';
import encrypt from '../lib/encrypt';

export default (app) => {
  app
    .get('/users', { name: 'usersIndex', preHandler: app.auth([checkSignedIn]) }, async (req, reply) => {
      const users = await app.objection.models.user.query().select('id', 'firstName', 'lastName', 'email');
      reply.render('/users/index', { users });
      return reply;
    })
    .get('/users/:id', { name: 'usersShow', preHandler: app.auth([checkSignedIn]) }, async (req, reply) => {
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
    .patch('/users/:id', {
      name: 'usersUpdate',
      preHandler: app.auth([checkSignedIn, checkProfileOwnership], { run: 'all' }),
    }, async (req, reply) => {
      const filteredBody = pickBy(req.body.form, (el) => el.length > 0);
      const { password, ...otherData } = filteredBody;
      const bodyWithUpdatedPassword = {
        ...otherData,
        ...(password ? { passwordDigest: encrypt(password) } : {}),
      };
      try {
        await req.currentUser.$query().patch(bodyWithUpdatedPassword);
        req.flash('success', i18next.t('flash.users.modify.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch ({ data }) {
        const userForm = { translationPath: 'users.profile', ...req.body.form };
        reply
          .code(422)
          .render('/users/profile', { errors: data, userForm, ...req.currentUser });
        return reply;
      }
    })
    .delete('/users/:id', {
      name: 'usersDestroy',
      preHandler: app.auth([checkSignedIn, checkProfileOwnership], { run: 'all' }),
    }, async (req, reply) => {
      const userId = req.session.get('userId');
      const user = await app
        .objection
        .models
        .user
        .query()
        .findById(userId)
        .withGraphJoined('[tasksCreator, tasksExecutor]');
      if (!isEmpty(user.tasksCreator) || !isEmpty(user.tasksExecutor)) {
        req.flash('danger', i18next.t('flash.users.delete.error'));
        reply.redirect(422, app.reverse('tasksIndex'));
        return reply;
      }
      await user.$query().delete();
      req.session.set('userId', null);
      req.flash('success', i18next.t('flash.users.delete.success'));
      reply.redirect(app.reverse('root'));
      return reply;
    });
};

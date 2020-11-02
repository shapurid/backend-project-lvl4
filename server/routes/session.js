import i18next from 'i18next';
import encrypt from '../lib/encrypt';

export default (app) => {
  app
    .get('/session/new', { name: 'newSession' }, (req, reply) => {
      const signInForm = { entityName: 'session.new' };
      reply.render('/session/new', { signInForm });
    })
    .post('/session', { name: 'createSession' }, async (req, reply) => {
      const { email, password } = req.body;
      const foundUser = email && await app.objection.models.user.query().findOne({ email });
      if (!foundUser || (foundUser.passwordDigest !== encrypt(password))) {
        const signInForm = { entityName: 'session.new' };
        req.flash('danger', i18next.t('flash.session.create.error'));
        reply
          .code(422)
          .render('/session/new', { signInForm });
        return reply;
      }
      req.session.set('userId', foundUser.id);
      req.flash('success', i18next.t('flash.session.create.success'));
      reply.redirect(app.reverse('root'));
      return reply;
    })
    .delete('/session', { name: 'deleteSession' }, (req, reply) => {
      req.session.set('userId', null);
      req.flash('success', i18next.t('flash.session.delete.success'));
      reply.redirect(app.reverse('root'));
    });
};

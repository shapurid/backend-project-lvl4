import encrypt from '../lib/encrypt';

export default (app) => {
  app
    .get('/session/new', (req, reply) => {
      reply.render('/session/new');
    })
    .post('/session', async (req, reply) => {
      const { email, password } = req.body;
      try {
        const foundedUser = email && await app.objection.models.user.query().findOne({ email });
        if (!foundedUser || (foundedUser.passwordDigest !== encrypt(password))) {
          req.flash('danger', 'Неправильный e-mail и/или пароль');
          reply
            .code(422)
            .render('/session/new', { email });
          return reply;
        }
        req.session.set('userId', foundedUser.id);
        req.flash('info', 'Вы успешно авторизованы.');
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    })
    .delete('/session', (req, reply) => {
      req.session.set('userId', null);
      req.flash('warning', 'Ждём Вас снова!');
      reply.redirect(app.reverse('root'));
    });
};

import encrypt from '../lib/secure';

export default (app) => {
  app
    .get('/session/new', (req, reply) => {
      reply.render('/session/new');
    })
    .post('/session', async (req, reply) => {
      const { email, password } = req.body;
      const findedUser = await app.objection.models.user.query().findOne({ email });
      if (!findedUser || (findedUser.passwordDigest !== encrypt(password))) {
        reply.code(422);
        req.flash('danger', 'Неправильный e-mail и/или пароль');
        reply.render('/session/new', { email });
        return reply;
      }
      req.session.set('userId', findedUser.id);
      req.flash('info', 'Вы успешно авторизованы.');
      reply.redirect('/');
      return reply;
    })
    .delete('/session', (req, reply) => {
      req.session.set('userId', null);
      req.flash('warning', 'Ждём Вас снова!');
      reply.redirect('/');
    });
};

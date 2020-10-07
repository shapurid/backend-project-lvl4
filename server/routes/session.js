import encrypt from '../lib/secure';

export default (app) => {
  app
    .get('/session/new', (req, reply) => {
      reply.render('/session/new');
    })
    .post('/session', async (req, reply) => {
      const { email, password } = req.body;
      console.log(req.body);
      const findedUser = await app.objection.models.user.query().findOne({ email });
      if (!findedUser || (findedUser.passwordDigest !== encrypt(password))) {
        reply.code(422);
        const error = 'Неправильный логин и/или пароль';
        reply.render('/session/new', { error, email });
        return reply;
      }
      req.session.set('userId', findedUser.id);
      reply.redirect('/');
      return reply;
    })
    .delete('/session', (req, reply) => {
      req.session.set('userId', null);
      reply.redirect('/');
    });
};

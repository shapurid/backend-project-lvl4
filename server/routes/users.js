import { keys, omit } from 'lodash';

export default (app) => {
  app
    .get('/users/new', (req, reply) => {
      reply.render('/users/new', { errors: {} });
    });
  app
    .post('/users', async (req, reply) => {
      try {
        const user = await app.objection.models.user.fromJson(req.body);
        const findedUser = await app.objection.models.user.query().findOne({ email: user.email });
        if (findedUser) {
          req.flash('danger', 'Пользователь с таким e-mail уже зарегистрирован.');
          reply.render('/users/new', { errors: {} });
          return reply;
        }
        await app.objection.models.user.query().insert(user);
        req.flash('success', 'Вы успешно зарегистрированы.');
        reply.redirect('/');
        return reply;
      } catch ({ data }) {
        const validValues = omit(req.body, ['password', ...keys(data)]);
        reply.render('/users/new', { errors: data, ...validValues });
        return reply;
      }
    });
};

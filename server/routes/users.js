import { keys, omit, isEmpty } from 'lodash';

export default (app) => {
  app
    .get('/users/new', (req, reply) => {
      reply.render('/users/new', { errors: {} });
    });
  app
    .post('/users', async (req, reply) => {
      try {
        const user = await app.objection.models.user.fromJson(req.body);
        const findedUser = await app.objection.models.user.query().where('email', req.body.email);
        if (!isEmpty(findedUser)) {
          reply.render('/users/new', { errors: {} });
          return reply;
        }
        await app.objection.models.user.query().insert(user);
        reply.redirect(302, '/');
        return reply;
      } catch ({ data }) {
        const validValues = omit(req.body, ['password', ...keys(data)]);
        reply.render('/users/new', { errors: data, ...validValues });
        return reply;
      }
    });
};

import encrypt from '../lib/encrypt';
import SchemaError from '../errors/SchemaError';
import validationErrorsHandler from '../errors/validationErrorsHandler';

export default (app) => {
  app
    .get('/session/new', (req, reply) => {
      reply.render('/session/new', { errors: {} });
    })
    .post('/session', {
      schema: {
        body: {
          $ref: 'sessionSchema#',
        },
      },
      attachValidation: true,
    }, async (req, reply) => {
      const { validationError, body: { email, password } } = req;
      try {
        if (validationError) {
          throw new SchemaError(validationError);
        }
        const findedUser = await app.objection.models.user.query().findOne({ email });
        if (!findedUser || (findedUser.passwordDigest !== encrypt(password))) {
          reply.code(422);
          req.flash('danger', 'Неправильный e-mail и/или пароль');
          reply.render('/session/new', { errors: { password: {} }, email });
          return reply;
        }
        req.session.set('userId', findedUser.id);
        req.flash('info', 'Вы успешно авторизованы.');
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (error) {
        if (error.type === 'ModelValidation' || error.type === 'SchemaError') {
          const validationResult = validationErrorsHandler(error.data, req.body);
          reply.render('/session/new', validationResult);
          return reply;
        }
        throw new Error(error);
      }
    })
    .delete('/session', (req, reply) => {
      req.session.set('userId', null);
      req.flash('warning', 'Ждём Вас снова!');
      reply.redirect(app.reverse('root'));
    });
};

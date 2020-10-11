import encrypt from '../lib/secure';
import validationErrorsHandler from '../errors/validationErrorsHandler';
import SchemaError from '../errors/SchemaError';

export default (app) => {
  app
    .get('/session/new', (req, reply) => {
      reply.render('/session/new', { errors: {} });
    })
    .post('/session', {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              minLength: 1,
            },
          },
        },
      },
      attachValidation: true,
    }, async (req, reply) => {
      try {
        const { validationError, body: { email, password } } = req;
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
        reply.redirect('/');
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
      reply.redirect('/');
    });
};

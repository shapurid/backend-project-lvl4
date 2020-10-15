import { checkSignedIn } from '../lib/preHandlers';

export default (app) => {
  app
    .get('/taskStatuses', { name: 'taskStatuses', preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const statusList = await app.objection.models.taskStatus.query();
        console.log(statusList);
        reply.render('/taskStatuses/index', { statusList });
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    })
    .get('/taskStatuses/new', { preHandler: checkSignedIn }, (req, reply) => {
      reply.render('/taskStatuses/new', { errors: {} });
      return reply;
    })
    .get('/taskStatuses/:id/edit', { preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const taskName = await app.objection.models.taskStatus.query().findById(req.params.id);
        if (!taskName) {
          reply.notFound();
          return reply;
        }
        reply.render('/taskStatuses/edit', { errors: {}, ...taskName });
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    })
    .post('/taskStatuses', { preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const status = await app.objection.models.taskStatus.fromJson(req.body);
        const foundTaskStatus = await app
          .objection
          .models
          .taskStatus
          .query()
          .findOne({ name: status.name });
        if (foundTaskStatus) {
          req.flash('danger', 'Статус задачи с этим именем уже зарегистрирован');
          reply
            .status(422)
            .render('/taskStatuses/new', { errors: req.body });
          return reply;
        }
        await app.objection.models.taskStatus.query().insert(status);
        req.flash('success', 'Статус задачи успешно зарегистрирован');
        reply.redirect(app.reverse('taskStatuses'));
        return reply;
      } catch ({ data }) {
        reply
          .code(422)
          .render('/taskStatuses/new', { errors: data });
        return reply;
      }
    })
    .patch('/taskStatuses/:id/edit', { preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const { name } = req.body;
        if (!name) {
          reply
            .code(422)
            .render('/taskStatuses/edit', { errors: { name: {} } });
          return reply;
        }
        const status = await app.objection.models.taskStatus.query().findById(req.params.id);
        await status.$query().patch({ name });
        req.flash('info', 'Статус задачи успешно обновлён.');
        reply.redirect(app.reverse('taskStatuses'));
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    })
    .delete('/taskStatuses/:id', { preHandler: checkSignedIn }, async (req, reply) => {
      try {
        await app.objection.models.taskStatus.query().deleteById(req.params.id);
        req.flash('danger', 'Статус задачи удалён!');
        reply.redirect(app.reverse('taskStatuses'));
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    });
};

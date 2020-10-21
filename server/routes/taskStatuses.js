import i18next from 'i18next';
import { checkSignedIn } from '../lib/preHandlers';

export default (app) => {
  app
    .get('/taskStatuses', { name: 'taskStatuses', preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const statusList = await app.objection.models.taskStatus.query();
        reply.render('/taskStatuses/index', { statusList });
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    })
    .get('/taskStatuses/new', { name: 'newTaskStatus', preHandler: checkSignedIn }, (req, reply) => {
      reply.render('/taskStatuses/new', { errors: {} });
      return reply;
    })
    .get('/taskStatuses/:id/edit', { preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const taskStatusName = await app
          .objection
          .models
          .taskStatus
          .query()
          .findById(req.params.id);
        if (!taskStatusName) {
          reply.notFound();
          return reply;
        }
        reply.render('/taskStatuses/edit', { errors: {}, ...taskStatusName });
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
          req.flash('danger', i18next.t('flash.taskStatuses.create.error'));
          reply
            .status(422)
            .render('/taskStatuses/new', { errors: req.body });
          return reply;
        }
        await app.objection.models.taskStatus.query().insert(status);
        req.flash('success', i18next.t('flash.taskStatuses.create.success'));
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
        req.flash('info', i18next.t('flash.taskStatuses.modify.info'));
        reply.redirect(app.reverse('taskStatuses'));
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    })
    .delete('/taskStatuses/:id', { preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const normalizedId = Number.parseInt(req.params.id, 10);
        const relatedTask = await app
          .objection
          .models
          .task
          .query()
          .findOne({ taskStatusId: normalizedId });
        if (relatedTask) {
          req.flash('danger', i18next.t('flash.taskStatuses.delete.error'));
          reply.redirect(app.reverse('taskStatuses'));
          return reply;
        }
        await app.objection.models.taskStatus.query().deleteById(normalizedId);
        req.flash('info', i18next.t('flash.taskStatuses.delete.info'));
        reply.redirect(app.reverse('taskStatuses'));
        return reply;
      } catch (error) {
        throw new Error(error);
      }
    });
};

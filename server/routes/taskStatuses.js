import i18next from 'i18next';
import { checkSignedIn } from '../lib/preHandlers';

export default (app) => {
  app
    .get('/taskStatuses', { name: 'taskStatuses', preHandler: checkSignedIn }, async (req, reply) => {
      const statusList = await app.objection.models.taskStatus.query();
      reply.render('/taskStatuses/index', { statusList });
      return reply;
    })
    .get('/taskStatuses/new', { name: 'newTaskStatus', preHandler: checkSignedIn }, (req, reply) => {
      reply.render('/taskStatuses/new', { errors: {} });
      return reply;
    })
    .get('/taskStatuses/:id/edit', { preHandler: checkSignedIn }, async (req, reply) => {
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
    })
    .post('/taskStatuses', { preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const status = await app.objection.models.taskStatus.fromJson(req.body);
        await app.objection.models.taskStatus.query().insert(status);
        req.flash('success', i18next.t('flash.taskStatuses.create.success'));
        reply.redirect(app.reverse('taskStatuses'));
        return reply;
      } catch ({ data }) {
        const isNameUniqErr = data.name
          ? data.name.some((el) => el.keyword === 'unique')
          : false;
        if (isNameUniqErr) {
          req.flash('danger', i18next.t('flash.taskStatuses.create.error'));
        }
        reply
          .code(422)
          .render('/taskStatuses/new', { errors: data });
        return reply;
      }
    })
    .patch('/taskStatuses/:id/edit', { preHandler: checkSignedIn }, async (req, reply) => {
      const { name } = req.body;
      if (!name) {
        reply
          .code(422)
          .render('/taskStatuses/edit', { errors: { name: {} } });
        return reply;
      }
      const status = await app.objection.models.taskStatus.query().findById(req.params.id);
      await status.$query().patch({ name });
      req.flash('success', i18next.t('flash.taskStatuses.modify.success'));
      reply.redirect(app.reverse('taskStatuses'));
      return reply;
    })
    .delete('/taskStatuses/:id', { preHandler: checkSignedIn }, async (req, reply) => {
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
      req.flash('success', i18next.t('flash.taskStatuses.delete.success'));
      reply.redirect(app.reverse('taskStatuses'));
      return reply;
    });
};

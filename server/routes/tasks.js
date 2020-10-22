import i18next from 'i18next';
import {
  omit,
  isEmpty,
} from 'lodash';
import { checkSignedIn, checkTaskOwnership } from '../lib/preHandlers';
import normalizeBodyForTask from '../lib/normalizeBodyForTask';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preHandler: checkSignedIn }, async (req, reply) => {
      const tasks = await app.objection.models.task.query().withGraphJoined('[taskStatus, creator, executor]');
      reply.render('/tasks/index', { tasks });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preHandler: checkSignedIn }, async (req, reply) => {
      const statuses = await app.objection.models.taskStatus.query();
      if (isEmpty(statuses)) {
        req.flash('danger', i18next.t('flash.tasks.create.error'));
        reply.redirect(app.reverse('taskStatuses'));
        return reply;
      }
      const executors = await app.objection.models.user.query();
      reply.render('/tasks/new', { statuses, executors, errors: {} });
      return reply;
    })
    .get('/tasks/:id/edit', { preHandler: checkSignedIn }, async (req, reply) => {
      const foundedTask = await app.objection.models.task.query().findById(req.params.id);
      if (!foundedTask) {
        reply.notFound();
        return reply;
      }
      const [statuses, executors] = await Promise.all([
        app.objection.models.taskStatus.query(),
        app.objection.models.user.query(),
      ]);
      reply.render('/tasks/edit', {
        errors: {},
        statuses,
        executors,
        ...foundedTask,
      });
      return reply;
    })
    .post('/tasks', { name: 'createTask', preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const normalizedBody = normalizeBodyForTask(req.body);
        const data = { ...normalizedBody, creatorId: req.currentUser.id };
        const task = await app.objection.models.task.fromJson(data);
        await app.objection.models.task.query().insert(task);
        req.flash('success', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch ({ data }) {
        const [statuses, executors] = await Promise.all([
          app.objection.models.taskStatus.query(),
          app.objection.models.user.query(),
        ]);
        reply
          .code(422)
          .render('/tasks/new', {
            statuses,
            executors,
            errors: data,
            ...req.body,
          });
        return reply;
      }
    })
    .patch('/tasks/:id/edit', { preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const bodyWithoutMethod = omit(req.body, '_method');
        const normalizedBody = normalizeBodyForTask(bodyWithoutMethod);
        const currentTask = await app.objection.models.task.query().findById(req.params.id);
        await currentTask.$query().patch(normalizedBody);
        req.flash('info', i18next.t('flash.tasks.modify.info'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch ({ data }) {
        const [statuses, executors] = await Promise.all([
          app.objection.models.taskStatus.query(),
          app.objection.models.user.query(),
        ]);
        reply
          .code(422)
          .render('/tasks/edit', {
            statuses,
            executors,
            errors: data,
            ...req.body,
          });
        return reply;
      }
    })
    .delete('/tasks/u:creatorId/:id', { preHandler: checkTaskOwnership }, async (req, reply) => {
      const normalizedId = Number.parseInt(req.params.id, 10);
      await app.objection.models.task.query().deleteById(normalizedId);
      req.flash('info', i18next.t('flash.tasks.delete.info'));
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};

import i18next from 'i18next';
import {
  pickBy,
  isEmpty,
  mapValues,
} from 'lodash';
import { checkSignedIn, checkTaskOwnership } from '../lib/preHandlers';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preHandler: checkSignedIn }, async (req, reply) => {
      const tasks = await app.objection.models.task.query().withGraphJoined('[taskStatus, creator, executor, labels]');
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
      const [executors, labels] = await Promise.all([
        app.objection.models.user.query(),
        app.objection.models.label.query(),
      ]);
      reply.render('/tasks/new', {
        statuses,
        executors,
        labels,
        currentTask: {},
        errors: {},
      });
      return reply;
    })
    .get('/tasks/:id/edit', { preHandler: checkSignedIn }, async (req, reply) => {
      const foundedTask = await app
        .objection
        .models
        .task
        .query()
        .findById(req.params.id)
        .withGraphJoined('[labels]');
      if (!foundedTask) {
        reply.notFound();
        return reply;
      }
      const [statuses, executors, labels] = await Promise.all([
        app.objection.models.taskStatus.query(),
        app.objection.models.user.query(),
        app.objection.models.label.query(),
      ]);
      reply.render('/tasks/edit', {
        errors: {},
        statuses,
        executors,
        labels,
        currentTask: foundedTask,
      });
      return reply;
    })
    .post('/tasks', { name: 'createTask', preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const { labels, ...body } = req.body;
        const filteredBody = pickBy(body);
        const normalizedBody = mapValues(filteredBody, (el) => {
          const transformedValue = Number.parseInt(el, 10);
          if (Number.isNaN(transformedValue)) {
            return el;
          }
          return transformedValue;
        });
        const data = { ...normalizedBody, creatorId: req.currentUser.id };
        const task = await app.objection.models.task.fromJson(data);
        const insertedTask = await app.objection.models.task.query().insert(task);
        if (labels) {
          const normalizedLabels = Array.isArray(labels)
            ? labels.map((el) => Number.parseInt(el, 10))
            : [Number.parseInt(labels, 10)];
          await Promise.all([normalizedLabels.forEach(async (label) => {
            const verifiedLabel = await app
              .objection
              .models
              .taskLabel
              .fromJson({ taskId: insertedTask.id, labelId: label });
            await app.objection.models.taskLabel.query().insert(verifiedLabel);
          })]);
        }
        req.flash('success', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch ({ data }) {
        const [statuses, executors, labels] = await Promise.all([
          app.objection.models.taskStatus.query(),
          app.objection.models.user.query(),
          app.objection.models.label.query(),
        ]);
        reply
          .code(422)
          .render('/tasks/new', {
            statuses,
            executors,
            labels,
            errors: data,
            currentTask: req.body,
          });
        return reply;
      }
    })
    .patch('/tasks/:id/edit', { preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const { _method, labels, ...body } = req.body;
        const normalizedEmptyStringsBody = mapValues(body, (el) => el || null);
        const normalizedBody = mapValues(normalizedEmptyStringsBody, (el) => {
          const transformedValue = Number.parseInt(el, 10);
          if (Number.isNaN(transformedValue)) {
            return el;
          }
          return transformedValue;
        });
        const currentTask = await app.objection.models.task.query().findById(req.params.id);
        await Promise.all([
          currentTask.$query().patch(normalizedBody),
          app.objection.models.taskLabel.query().delete().where('taskId', currentTask.id),
        ]);
        if (labels) {
          const normalizedLabels = Array.isArray(labels)
            ? labels.map((el) => Number.parseInt(el, 10))
            : [Number.parseInt(labels, 10)];
          await Promise.all([normalizedLabels.forEach(async (label) => {
            const verifiedLabel = await app
              .objection
              .models
              .taskLabel
              .fromJson({ taskId: currentTask.id, labelId: label });
            await app.objection.models.taskLabel.query().insert(verifiedLabel);
          })]);
        }
        req.flash('success', i18next.t('flash.tasks.modify.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch ({ data }) {
        const [statuses, executors, labels] = await Promise.all([
          app.objection.models.taskStatus.query(),
          app.objection.models.user.query(),
          app.objection.models.label.query(),
        ]);
        reply
          .code(422)
          .render('/tasks/edit', {
            statuses,
            executors,
            labels,
            errors: data,
            currentTask: req.body,
          });
        return reply;
      }
    })
    .delete('/tasks/u:creatorId/:id', { preHandler: checkTaskOwnership }, async (req, reply) => {
      const normalizedId = Number.parseInt(req.params.id, 10);
      await app.objection.models.task.query().deleteById(normalizedId);
      req.flash('success', i18next.t('flash.tasks.delete.success'));
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};

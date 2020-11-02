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
      const taskForm = { entityName: 'tasks.index' };
      const [taskStatuses, executors, labels] = await Promise.all([
        app.objection.models.taskStatus.query(),
        app.objection.models.user.query(),
        app.objection.models.label.query(),
      ]);
      const filterForm = {
        entityName: 'tasks.filters',
        taskStatuses,
        executors,
        labels,
      };
      if (!isEmpty(req.query)) {
        const normalizedQuery = mapValues(req.query, (value) => {
          if (Array.isArray(value)) {
            return value.map((el) => Number.parseInt(el, 10));
          }
          return [Number.parseInt(value, 10)];
        });
        const tasks = await app
          .objection
          .models
          .task
          .query()
          .withGraphJoined('[taskStatus, creator, executor, labels]')
          .where((builder) => mapValues(normalizedQuery,
            (value, key) => builder.whereIn(key, value)));
        reply.render('/tasks/index', { taskForm, tasks, filterForm });
        return reply;
      }
      const tasks = await app
        .objection
        .models
        .task
        .query()
        .withGraphJoined('[taskStatus, creator, executor, labels]');
      reply.render('/tasks/index', { taskForm, tasks, filterForm });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preHandler: checkSignedIn }, async (req, reply) => {
      const taskStatuses = await app.objection.models.taskStatus.query();
      if (isEmpty(taskStatuses)) {
        req.flash('danger', i18next.t('flash.tasks.create.error'));
        reply.redirect(app.reverse('taskStatuses'));
        return reply;
      }
      const [executors, labels] = await Promise.all([
        app.objection.models.user.query(),
        app.objection.models.label.query(),
      ]);
      const taskForm = {
        entityName: 'tasks.new',
        taskStatuses,
        executors,
        labels,
      };
      reply.render('/tasks/new', { taskForm });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'taskProfile', preHandler: checkSignedIn }, async (req, reply) => {
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
      const [taskStatuses, executors, labels] = await Promise.all([
        app.objection.models.taskStatus.query(),
        app.objection.models.user.query(),
        app.objection.models.label.query(),
      ]);
      const taskForm = {
        entityName: 'tasks.edit',
        currentTask: foundedTask,
        taskStatuses,
        executors,
        labels,
      };
      reply.render('/tasks/edit', { taskForm });
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
        if (labels) {
          const normalizedLabelIds = Array.isArray(labels)
            ? labels.map((el) => Number.parseInt(el, 10))
            : [Number.parseInt(labels, 10)];
          const tags = await app.objection.models.label.query().findByIds(normalizedLabelIds);
          await app.objection.models.task.query().insertGraph({
            ...task,
            labels: tags,
          }, { relate: true });
        } else {
          await app.objection.models.task.query().insert(task);
        }
        req.flash('success', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch ({ data }) {
        const [taskStatuses, executors, labels] = await Promise.all([
          app.objection.models.taskStatus.query(),
          app.objection.models.user.query(),
          app.objection.models.label.query(),
        ]);
        const taskForm = {
          entityName: 'tasks.new',
          taskStatuses,
          executors,
          labels,
          currentTask: req.body,
        };
        reply
          .code(422)
          .render('/tasks/new', { taskForm, errors: data });
        return reply;
      }
    })
    .patch('/tasks/:id/edit', { name: 'editTask', preHandler: checkSignedIn }, async (req, reply) => {
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
        await currentTask.$query().patch(normalizedBody);
        if (labels) {
          const normalizedLabelIds = Array.isArray(labels)
            ? labels.map((el) => Number.parseInt(el, 10))
            : [Number.parseInt(labels, 10)];
          const tags = await app.objection.models.label.query().findByIds(normalizedLabelIds);
          await app.objection.models.task.query().upsertGraph({
            ...currentTask,
            labels: tags,
          }, { relate: true, unrelate: true });
        } else {
          await currentTask.$relatedQuery('labels').unrelate();
        }
        req.flash('success', i18next.t('flash.tasks.modify.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch ({ data }) {
        const [taskStatuses, executors, labels] = await Promise.all([
          app.objection.models.taskStatus.query(),
          app.objection.models.user.query(),
          app.objection.models.label.query(),
        ]);
        const taskForm = {
          entityName: 'tasks.edit',
          taskStatuses,
          executors,
          labels,
          currentTask: req.body,
        };
        reply
          .code(422)
          .render('/tasks/edit', { taskForm, errors: data });
        return reply;
      }
    })
    .delete('/tasks/u:creatorId/:id', { name: 'deleteTask', preHandler: checkTaskOwnership }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      await task.$relatedQuery('labels');
      await task.$query().delete();
      req.flash('success', i18next.t('flash.tasks.delete.success'));
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};

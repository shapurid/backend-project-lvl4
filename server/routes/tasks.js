import i18next from 'i18next';
import {
  isEmpty,
  mapValues,
} from 'lodash';
import { checkSignedIn, checkTaskOwnership } from '../lib/preHandlers';

export default (app) => {
  app
    .get('/tasks', { name: 'tasksIndex', preHandler: checkSignedIn }, async (req, reply) => {
      const taskForm = { translationPath: 'tasks.index' };
      const [taskStatuses, executors, labels] = await Promise.all([
        app.objection.models.taskStatus.query(),
        app.objection.models.user.query(),
        app.objection.models.label.query(),
      ]);
      const queryTasks = app
        .objection
        .models
        .task
        .query()
        .withGraphJoined('[taskStatus, creator, executor, labels]');
      const filterForm = {
        translationPath: 'tasks.filters',
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
        const { taskStatusId, executorId, 'labels.id': labelsId } = normalizedQuery;
        if (taskStatusId) {
          queryTasks.whereIn('taskStatusId', taskStatusId);
        }
        if (executorId) {
          queryTasks.whereIn('executorId', executorId);
        }
        if (labelsId) {
          queryTasks.whereIn('labels.id', labelsId);
        }
        const tasks = await queryTasks;
        reply.render('/tasks/index', { taskForm, tasks, filterForm });
        return reply;
      }
      const tasks = await queryTasks;
      reply.render('/tasks/index', { taskForm, tasks, filterForm });
      return reply;
    })
    .get('/tasks/new', { name: 'tasksNew', preHandler: checkSignedIn }, async (req, reply) => {
      const [executors, labels, taskStatuses] = await Promise.all([
        app.objection.models.user.query(),
        app.objection.models.label.query(),
        app.objection.models.taskStatus.query(),
      ]);
      const taskForm = {
        translationPath: 'tasks.new',
        taskStatuses,
        executors,
        labels,
      };
      reply.render('/tasks/new', { taskForm });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'tasksEdit', preHandler: checkSignedIn }, async (req, reply) => {
      const foundTask = await app
        .objection
        .models
        .task
        .query()
        .findById(req.params.id)
        .withGraphJoined('[labels]');
      if (!foundTask) {
        reply.notFound();
        return reply;
      }
      const [taskStatuses, executors, labels] = await Promise.all([
        app.objection.models.taskStatus.query(),
        app.objection.models.user.query(),
        app.objection.models.label.query(),
      ]);
      const taskForm = {
        translationPath: 'tasks.edit',
        currentTask: foundTask,
        taskStatuses,
        executors,
        labels,
      };
      reply.render('/tasks/edit', { taskForm });
      return reply;
    })
    .post('/tasks', { name: 'tasksCreate', preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const {
          name,
          taskStatusId,
          executorId,
          description = null,
          labels = [],
        } = req.body.form;
        const foundLabels = await app
          .objection
          .models
          .label
          .query()
          .findByIds(labels);
        await app.objection.models.task.query().insertGraph({
          name,
          creatorId: req.currentUser.id,
          taskStatusId: Number.parseInt(taskStatusId, 10),
          executorId: Number.parseInt(executorId, 10) || null,
          description,
          labels: foundLabels,
        }, { relate: true });
        req.flash('success', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasksIndex'));
        return reply;
      } catch ({ data }) {
        const [taskStatuses, executors, labels] = await Promise.all([
          app.objection.models.taskStatus.query(),
          app.objection.models.user.query(),
          app.objection.models.label.query(),
        ]);
        const taskForm = {
          translationPath: 'tasks.new',
          taskStatuses,
          executors,
          labels,
          currentTask: req.body.form,
        };
        req.flash('danger', i18next.t('flash.tasks.create.error'));
        reply
          .code(422)
          .render('/tasks/new', { taskForm, errors: data });
        return reply;
      }
    })
    .patch('/tasks/:id/edit', { name: 'tasksUpdate', preHandler: checkSignedIn }, async (req, reply) => {
      try {
        const {
          name,
          taskStatusId,
          executorId,
          description = null,
          labels = [],
        } = req.body.form;
        const currentTask = await app.objection.models.task.query().findById(req.params.id);
        const foundLabels = await app
          .objection
          .models
          .label
          .query()
          .findByIds(labels);
        await app.objection.models.task.query().upsertGraph({
          ...currentTask,
          description,
          executorId: Number.parseInt(executorId, 10) || null,
          taskStatusId: Number.parseInt(taskStatusId, 10),
          name,
          labels: foundLabels,
        }, { relate: true, unrelate: true });
        req.flash('success', i18next.t('flash.tasks.modify.success'));
        reply.redirect(app.reverse('tasksIndex'));
        return reply;
      } catch ({ data }) {
        const [taskStatuses, executors, labels] = await Promise.all([
          app.objection.models.taskStatus.query(),
          app.objection.models.user.query(),
          app.objection.models.label.query(),
        ]);
        const taskForm = {
          translationPath: 'tasks.edit',
          taskStatuses,
          executors,
          labels,
          currentTask: req.body.form,
        };
        req.flash('danger', i18next.t('flash.tasks.modify.error'));
        reply
          .code(422)
          .render('/tasks/edit', { taskForm, errors: data });
        return reply;
      }
    })
    .delete('/tasks/u:creatorId/:id', { name: 'tasksDestroy', preHandler: checkTaskOwnership }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      await task.$relatedQuery('labels').unrelate();
      await task.$query().delete();
      req.flash('success', i18next.t('flash.tasks.delete.success'));
      reply.redirect(app.reverse('tasksIndex'));
      return reply;
    });
};

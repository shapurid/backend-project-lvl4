import i18next from 'i18next';
import { checkSignedIn, checkTaskOwnership } from '../lib/auth';

export default (app) => {
  app
    .get('/tasks', { name: 'tasksIndex', preHandler: app.auth([checkSignedIn]) }, async (req, reply) => {
      const taskForm = { translationPath: 'tasks.index' };
      const [taskStatuses, executors, labels] = await Promise.all([
        app.objection.models.taskStatus.query(),
        app.objection.models.user.query(),
        app.objection.models.label.query(),
      ]);
      const { taskStatusId, executorId, 'labels.id': labelsId } = req.query;
      const filterForm = { translationPath: 'tasks.filters' };
      const tasks = await app
        .objection
        .models
        .task
        .query()
        .withGraphJoined('[taskStatus, creator, executor, labels]')
        .modify('addTaskStatusesFilter', taskStatusId)
        .modify('addExecutorsFilter', executorId)
        .modify('addLabelsFilter', labelsId);
      reply.render('/tasks/index', {
        taskForm,
        tasks,
        filterForm,
        taskStatuses,
        executors,
        labels,
      });
      return reply;
    })
    .get('/tasks/new', { name: 'tasksNew', preHandler: app.auth([checkSignedIn]) }, async (req, reply) => {
      const [executors, labels, taskStatuses] = await Promise.all([
        app.objection.models.user.query(),
        app.objection.models.label.query(),
        app.objection.models.taskStatus.query(),
      ]);
      const taskForm = { translationPath: 'tasks.new' };
      reply.render('/tasks/new', {
        taskForm,
        executors,
        labels,
        taskStatuses,
      });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'tasksEdit', preHandler: app.auth([checkSignedIn]) }, async (req, reply) => {
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
        ...foundTask,
      };
      reply.render('/tasks/edit', {
        taskForm,
        taskStatuses,
        executors,
        labels,
      });
      return reply;
    })
    .post('/tasks', { name: 'tasksCreate', preHandler: app.auth([checkSignedIn]) }, async (req, reply) => {
      const {
        name,
        taskStatusId,
        executorId,
        description = null,
        labels = [],
      } = req.body.form;
      try {
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
        const [taskStatuses, executors, allLabels] = await Promise.all([
          app.objection.models.taskStatus.query(),
          app.objection.models.user.query(),
          app.objection.models.label.query(),
        ]);
        const taskForm = {
          translationPath: 'tasks.new',
          ...req.body.form,
        };
        req.flash('danger', i18next.t('flash.tasks.create.error'));
        reply
          .code(422)
          .render('/tasks/new', {
            taskForm,
            taskStatuses,
            executors,
            labels: allLabels,
            errors: data,
          });
        return reply;
      }
    })
    .patch('/tasks/:id/edit', { name: 'tasksUpdate', preHandler: app.auth([checkSignedIn]) }, async (req, reply) => {
      const {
        name,
        taskStatusId,
        executorId,
        description = null,
        labels = [],
      } = req.body.form;
      try {
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
        const [taskStatuses, executors, allLabels] = await Promise.all([
          app.objection.models.taskStatus.query(),
          app.objection.models.user.query(),
          app.objection.models.label.query(),
        ]);
        const taskForm = {
          translationPath: 'tasks.edit',
          ...req.body.form,
        };
        req.flash('danger', i18next.t('flash.tasks.modify.error'));
        reply
          .code(422)
          .render('/tasks/edit', {
            taskForm,
            taskStatuses,
            executors,
            labels: allLabels,
            errors: data,
          });
        return reply;
      }
    })
    .delete('/tasks/u:creatorId/:id', {
      name: 'tasksDestroy',
      preHandler: app.auth([checkSignedIn, checkTaskOwnership], { run: 'all' }),
    }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      await task.$relatedQuery('labels').unrelate();
      await task.$query().delete();
      req.flash('success', i18next.t('flash.tasks.delete.success'));
      reply.redirect(app.reverse('tasksIndex'));
      return reply;
    });
};

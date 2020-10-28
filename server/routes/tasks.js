import i18next from 'i18next';
import {
  pickBy,
  isEmpty,
  mapValues,
  uniqWith,
  isEqual,
  flattenDeep,
  intersectionWith,
  keys,
} from 'lodash';
import { checkSignedIn, checkTaskOwnership } from '../lib/preHandlers';

const filtrator = (keysOfQueryObj, queryData) => (task) => {
  if (isEmpty(keysOfQueryObj)) {
    return true;
  }
  const [key, ...rest] = keysOfQueryObj;
  const dataOfTask = task[key];
  const dataOfQuery = queryData[key];
  if (Array.isArray(dataOfTask) && Array.isArray(dataOfQuery)) {
    const intersection = intersectionWith(dataOfTask, dataOfQuery, (arrVal, otherVal) => {
      const merged = { ...arrVal, ...otherVal };
      return isEqual(merged, { ...arrVal });
    });
    if (isEmpty(intersection)) {
      return false;
    }
    return isEmpty(intersection)
      ? false
      : filtrator(rest, queryData)(task);
  }
  return dataOfQuery.some((el) => el === dataOfTask)
    ? filtrator(rest, queryData)(task)
    : false;
};

const dataMapper = (tasks, queryObj) => {
  const keysOfQueryObj = keys(queryObj);
  return tasks.filter(filtrator(keysOfQueryObj, queryObj));
};

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preHandler: checkSignedIn }, async (req, reply) => {
      const tasks = await app.objection.models.task.query().withGraphJoined('[taskStatus, creator, executor, labels]');
      const extractedData = tasks.reduce((acc, { taskStatus, executor, labels: labelcoll }) => ({
        ...acc,
        taskStatuses: [taskStatus, ...acc.taskStatuses],
        executors: [executor, ...acc.executors],
        labels: [labelcoll, ...acc.labels],
      }), { taskStatuses: [], executors: [], labels: [] });
      const filters = mapValues(extractedData, (el) => {
        const flattenedEl = flattenDeep(el).filter((e) => e);
        return uniqWith(flattenedEl, isEqual);
      });
      if (!isEmpty(req.query)) {
        const normalizedQuery = mapValues(req.query, (value, key) => {
          if (key === 'labels') {
            return Array.isArray(value)
              ? value.map((el) => ({ id: Number.parseInt(el, 10) }))
              : [{ id: Number.parseInt(value, 10) }];
          }
          if (Array.isArray(value)) {
            return value.map((el) => Number.parseInt(el, 10));
          }
          return [Number.parseInt(value, 10)];
        });
        const filteredTasks = dataMapper(tasks, normalizedQuery);
        reply.render('/tasks/index', { tasks: filteredTasks, filters });
        return reply;
      }
      reply.render('/tasks/index', { tasks, filters });
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
      await Promise.all([
        app.objection.models.task.query().deleteById(req.params.id),
        app.objection.models.taskLabel.query().delete().where('taskId', req.params.id),
      ]);
      req.flash('success', i18next.t('flash.tasks.delete.success'));
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};

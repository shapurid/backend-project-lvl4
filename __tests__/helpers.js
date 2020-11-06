import request from 'supertest';
import testData from './__fixtures__/testData';

const { dataForTests, dataForDb } = testData;

export const getSessionCookie = (res) => {
  const sessionCookieAndPath = res.headers['set-cookie'];
  const sessionCookieAndPathToString = sessionCookieAndPath.join();
  const separateSessionCookieFromPath = sessionCookieAndPathToString.split(';').slice(0, 1);
  return separateSessionCookieFromPath.join();
};

export const setApp = async (appGetter) => {
  const app = await appGetter().ready();
  await app
    .objection
    .knex
    .migrate
    .latest();
  const [insertedUser1, insertedTaskStatus, insertedLabel] = await Promise.all([
    app.objection.models.user.query().insert(dataForDb.user1),
    app.objection.models.taskStatus.query().insert(dataForDb.taskStatus),
    app.objection.models.label.query().insert(dataForDb.label),
  ]);
  const insertedUser2 = await app.objection.models.user.query().insert(dataForDb.user2);
  await app.objection.models.task.query().insertGraph({
    creatorId: insertedUser1.id,
    executorId: insertedUser2.id,
    taskStatusId: insertedTaskStatus.id,
    labels: insertedLabel,
    ...dataForDb.task,
  }, { relate: true });
  return app;
};

const loginUser = async (app, user) => {
  const userDataRequest = {
    form: {
      email: user.email,
      password: user.password,
    },
  };
  const authorizationRes = await request(app.server)
    .post('/session')
    .type('form')
    .send(userDataRequest);
  return authorizationRes;
};

const otherData = {
  taskStatuses: {
    existing: dataForDb.taskStatus,
    new: {
      create: dataForTests.taskStatuses.create,
      update: dataForTests.taskStatuses.update,
    },
  },
  labels: {
    existing: dataForDb.label,
    new: {
      create: dataForTests.labels.create,
      update: dataForTests.labels.update,
    },
  },
  tasks: {
    existing: dataForDb.task,
    new: {
      create: dataForTests.tasks.create,
    },
  },
};

export const getTestData = async (app) => {
  const [user1LoginRes, user2LoginRes] = await Promise.all([
    loginUser(app, dataForDb.user1),
    loginUser(app, dataForDb.user2),
  ]);
  const sessionCookie1 = getSessionCookie(user1LoginRes);
  const sessionCookie2 = getSessionCookie(user2LoginRes);
  return {
    users: {
      existing1: {
        data: dataForDb.user1,
        sessionCookie: sessionCookie1,
      },
      existing2: {
        data: dataForDb.user2,
        sessionCookie: sessionCookie2,
      },
      new: {
        user: dataForTests.users.user,
        update: dataForTests.users.update,
      },
    },
    ...otherData,
  };
};

export const unsetApp = async (app) => {
  await app
    .objection
    .knex
    .destroy();
  await app.close();
};

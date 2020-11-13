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
  return app;
};

export const setMigrationsAndData = async (app) => {
  await app
    .objection
    .knex
    .migrate
    .latest();
  const [insertedUser1, insertedTaskStatus1, insertedLabel] = await Promise.all([
    app.objection.models.user.query().insert(dataForDb.user1),
    app.objection.models.taskStatus.query().insert(dataForDb.taskStatus1),
    app.objection.models.label.query().insert(dataForDb.label),
  ]);
  await Promise.all([
    app.objection.models.user.query().insert(dataForDb.user2),
    app.objection.models.taskStatus.query().insert(dataForDb.taskStatus2),
    app.objection.models.task.query().insertGraph({
      creatorId: insertedUser1.id,
      taskStatusId: insertedTaskStatus1.id,
      labels: insertedLabel,
      ...dataForDb.task,
    }, { relate: true }),
  ]);
};

export const unsetMigrationsAndData = async (app) => {
  await app
    .objection
    .knex
    .migrate
    .rollback();
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
      new: dataForTests.users,
    },
    taskStatuses: {
      existing1: dataForDb.taskStatus1,
      existing2: dataForDb.taskStatus2,
      new: dataForTests.taskStatuses,
    },
    labels: {
      existing: dataForDb.label,
      new: dataForTests.labels,
    },
    tasks: {
      existing: dataForDb.task,
      new: dataForTests.tasks,
    },
  };
};

export const unsetApp = async (app) => {
  await app
    .objection
    .knex
    .destroy();
  await app.close();
};

import request from 'supertest';
import testData from './__fixtures__/testData';

const { dataForTests, dataForDb } = testData;

export const getTestData = (key) => dataForTests[key];

const getSessionCookie = (res) => {
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

export const getSettedDataFromDb = async (app) => {
  const [
    insertedUser1,
    insertedUser2,
    insertedTaskStatus,
    insertedLabel,
    insertedTask,
    authorizationRes1,
    authorizationRes2,
  ] = await Promise.all([
    app.objection.models.user.query().findOne({ email: dataForDb.user1.email }),
    app.objection.models.user.query().findOne({ email: dataForDb.user2.email }),
    app.objection.models.taskStatus.query().findOne(dataForDb.taskStatus),
    app.objection.models.label.query().findOne(dataForDb.label),
    app.objection.models.task.query().findOne(dataForDb.task),
    request(app.server).post('/session').type('form').send({ form: { email: dataForDb.user1.email, password: dataForDb.user1.password } }),
    request(app.server).post('/session').type('form').send({ form: { email: dataForDb.user2.email, password: dataForDb.user2.password } }),
  ]);
  const sessionCookie1 = getSessionCookie(authorizationRes1);
  const sessionCookie2 = getSessionCookie(authorizationRes2);
  return {
    user1: {
      data: {
        ...insertedUser1,
        password: dataForDb.user1.password,
      },
      sessionCookie: sessionCookie1,
    },
    user2: {
      data: {
        ...insertedUser2,
        password: dataForDb.user2.password,
      },
      sessionCookie: sessionCookie2,
    },
    taskStatus: insertedTaskStatus,
    label: insertedLabel,
    task: insertedTask,
  };
};

export const unsetApp = async (app) => {
  await app
    .objection
    .knex
    .destroy();
  await app.close();
};

import { parse } from 'path';
import request from 'supertest';
import faker from 'faker';
import generatedData from './__fixtures__/generatedData';

export const mapData = (filepath) => {
  const parsedData = parse(filepath);
  return generatedData[parsedData.name];
};

export const prepareApp = async (appGetter) => {
  const app = await appGetter().ready();
  await app
    .objection
    .knex
    .migrate
    .latest();
  return app;
};

export const closeApp = async (app) => {
  await app
    .objection
    .knex
    .destroy();
  await app.close();
};

export const registerTestUser = async (app) => {
  const user = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  };
  const creationRes = await request(app.server)
    .post('/users')
    .type('form')
    .send(user);
  expect(creationRes.status).toBe(302);

  const authorizationRes = await request(app.server)
    .post('/session')
    .type('form')
    .send({ email: user.email, password: user.password });
  expect(authorizationRes.status).toBe(302);

  const sessionCookie = authorizationRes
    .headers['set-cookie']
    .join()
    .split(';')
    .slice(0, 1)
    .join();
  const { id } = await app.objection.models.user.query().findOne({ email: user.email });

  return { data: { id, ...user }, sessionCookie };
};

export const createTestTaskStatus = async (app, sessionCookie) => {
  const name = faker.lorem.word();
  const addTaskStatus = await request(app.server)
    .post('/taskStatuses')
    .set('cookie', sessionCookie)
    .type('form')
    .send({ name });
  expect(addTaskStatus.status).toBe(302);

  const taskStatus = await app
    .objection
    .models
    .taskStatus
    .query()
    .findOne({ name });
  return taskStatus;
};

export const createTestTask = async (app, sessionCookie, taskStatusId) => {
  const name = faker.lorem.word();
  const res = await request(app.server)
    .post('/tasks')
    .set('cookie', sessionCookie)
    .type('form')
    .send({ name, taskStatusId });
  expect(res.status).toBe(302);

  const task = await app
    .objection
    .models
    .task
    .query()
    .findOne({ name });
  return task;
};

export const createTestLabel = async (app, sessionCookie) => {
  const name = faker.lorem.word();
  const res = await request(app.server)
    .post('/labels')
    .set('cookie', sessionCookie)
    .type('form')
    .send({ name });
  expect(res.status).toBe(302);

  const testLabel = await app
    .objection
    .models
    .label
    .query()
    .findOne({ name });
  return testLabel;
};

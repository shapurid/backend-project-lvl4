import { expect } from '@jest/globals';
import faker from 'faker';
import request from 'supertest';

export const generateUserData = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});

export const registerTestUser = async (app) => {
  const user = generateUserData();
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
  const nameOfTask = faker.lorem.word();
  const addTask = await request(app.server)
    .post('/tasks')
    .set('cookie', sessionCookie)
    .type('form')
    .send({ name: nameOfTask, taskStatusId });
  expect(addTask.status).toBe(302);

  const task = await app
    .objection
    .models
    .task
    .query()
    .findOne({ name: nameOfTask });
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

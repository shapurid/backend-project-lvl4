import { expect, test } from '@jest/globals';
import request from 'supertest';
import faker from 'faker';
import getApp from '../server';
import { generateUser, registerTestUser, createTestTaskStatus } from './helpers';

let app;
let testUser;
let testTaskStatus;
const getRequests = [
  [200, '/'],
  [200, '/users/new'],
  [200, '/session/new'],
  [200, '/users'],
  [403, '/taskStatuses'],
  [404, '/wrong-path'],
];

beforeAll(async () => {
  app = await getApp().ready();
  await app
    .objection
    .knex
    .migrate
    .latest();
  testUser = await registerTestUser(app);
  testTaskStatus = await createTestTaskStatus(app, testUser.sessionCookie);
});

test.each(getRequests)('GET %d %p', async (expectedStatus, route) => {
  const res = await request(app.server).get(route);
  expect(res.status).toBe(expectedStatus);
});

test('User "CRUD"', async () => {
  const newUser = await registerTestUser(app);
  const selfReadingRes = await request(app.server)
    .get(`/users/${newUser.data.id}`)
    .set('cookie', newUser.sessionCookie);
  expect(selfReadingRes.status).toBe(200);

  const updatedUser = generateUser();
  const updationRes = await request(app.server)
    .patch(`/users/${newUser.data.id}`)
    .set('cookie', newUser.sessionCookie)
    .type('form')
    .send({ ...updatedUser });
  expect(updationRes.status).toBe(302);

  const deleteSessionRes = await request(app.server)
    .delete('/session')
    .set('cookie', newUser.sessionCookie);
  expect(deleteSessionRes.status).toBe(302);

  const authorizationWithUpdDataRes = await request(app.server)
    .post('/session')
    .type('form')
    .send({ email: updatedUser.email, password: updatedUser.password });
  expect(authorizationWithUpdDataRes.status).toBe(302);

  const deleteUserRes = await request(app.server)
    .delete(`/users/${newUser.data.id}`)
    .set('cookie', newUser.sessionCookie);
  expect(deleteUserRes.status).toBe(302);
});

test('Task statuses "CRUD"', async () => {
  const taskStatus = await createTestTaskStatus(app, testUser.sessionCookie);

  const readTaskStatuses = await request(app.server)
    .get('/taskStatuses')
    .set('cookie', testUser.sessionCookie);
  expect(readTaskStatuses.status).toBe(200);

  const updTaskStatus = await request(app.server)
    .patch(`/taskStatuses/${taskStatus.id}/edit`)
    .set('cookie', testUser.sessionCookie)
    .type('form')
    .send({ name: faker.lorem.word() });
  expect(updTaskStatus.status).toBe(302);

  const deleteTaskStatus = await request(app.server)
    .delete(`/taskStatuses/${taskStatus.id}`)
    .set('cookie', testUser.sessionCookie);
  expect(deleteTaskStatus.status).toBe(302);
});

test('Tasks "CRUD"', async () => {
  const nameOfTask = faker.lorem.word();
  const addTask = await request(app.server)
    .post('/tasks')
    .set('cookie', testUser.sessionCookie)
    .type('form')
    .send({ name: nameOfTask, taskStatusId: testTaskStatus.id });
  expect(addTask.status).toBe(302);

  const readTasks = await request(app.server)
    .get('/tasks')
    .set('cookie', testUser.sessionCookie);
  expect(readTasks.status).toBe(200);

  const task = await app.objection.models.task.query().findOne({ name: nameOfTask });

  const updTask = await request(app.server)
    .patch(`/tasks/${task.id}/edit`)
    .set('cookie', testUser.sessionCookie)
    .type('form')
    .send({ name: faker.lorem.word(), taskStatusId: testTaskStatus.id });
  expect(updTask.status).toBe(302);

  const newUser = await registerTestUser(app);
  const deleteTaskError = await request(app.server)
    .delete(`/tasks/u${task.creatorId}/${task.id}`)
    .set('cookie', newUser.sessionCookie);
  expect(deleteTaskError.status).toBe(403);

  const deleteTask = await request(app.server)
    .delete(`/tasks/u${task.creatorId}/${task.id}`)
    .set('cookie', testUser.sessionCookie);
  expect(deleteTask.status).toBe(302);
});

afterAll(() => {
  app.close();
});

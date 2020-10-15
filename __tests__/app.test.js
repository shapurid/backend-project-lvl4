import { expect, test } from '@jest/globals';
import faker from 'faker';
import request from 'supertest';
import getApp from '../server';

const generateUser = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});

let app;
const getRequests = [
  [200, '/'],
  [200, '/users/new'],
  [200, '/session/new'],
  [200, '/users'],
  [404, '/wrong-path'],
];

beforeAll(async () => {
  app = await getApp().ready();
  await app
    .objection
    .knex
    .migrate
    .latest();
});

test.each(getRequests)('GET %d %p', async (expectedStatus, route) => {
  const res = await request(app.server).get(route);
  expect(res.status).toBe(expectedStatus);
});

test('User "CRUD"', async () => {
  const user = generateUser();
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

  const sessionCookie = authorizationRes.headers['set-cookie'];
  const selfReadingRes = await request(app.server)
    .get('/users/1')
    .set('cookie', sessionCookie);
  expect(selfReadingRes.status).toBe(200);

  const updatedUser = generateUser();
  const updationRes = await request(app.server)
    .patch('/users/1')
    .set('cookie', sessionCookie)
    .type('form')
    .send({ ...updatedUser });
  expect(updationRes.status).toBe(302);

  const deleteSessionRes = await request(app.server)
    .delete('/session')
    .set('cookie', sessionCookie);
  expect(deleteSessionRes.status).toBe(302);

  const authorizationWithUpdDataRes = await request(app.server)
    .post('/session')
    .type('form')
    .send({ email: updatedUser.email, password: updatedUser.password });
  expect(authorizationWithUpdDataRes.status).toBe(302);

  const deleteUserRes = await request(app.server)
    .delete('/users/1')
    .set('cookie', sessionCookie);
  expect(deleteUserRes.status).toBe(302);
});

test('Task statuses "CRUD"', async () => {
  const user = generateUser();
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

  const sessionCookie = authorizationRes.headers['set-cookie'];

  const addTaskStatus = await request(app.server)
    .post('/taskStatuses')
    .set('cookie', sessionCookie)
    .type('form')
    .send({ name: 'Не готово' });
  expect(addTaskStatus.status).toBe(302);

  const readTaskStatuses = await request(app.server)
    .get('/taskStatuses')
    .set('cookie', sessionCookie);
  expect(readTaskStatuses.status).toBe(200);

  const updTaskStatus = await request(app.server)
    .patch('/taskStatuses/1/edit')
    .set('cookie', sessionCookie)
    .type('form')
    .send({ name: 'Готово' });
  expect(updTaskStatus.status).toBe(302);

  const deleteTaskStatus = await request(app.server)
    .delete('/taskStatuses/1')
    .set('cookie', sessionCookie);
  expect(deleteTaskStatus.status).toBe(302);
});
afterAll(() => {
  app.close();
});

import { afterAll } from '@jest/globals';
import request from 'supertest';
import getApp from '../server';
import { registerTestUser, createTestTaskStatus } from './helpers';

const guestGetRequests = [
  [200, '/'],
  [200, '/users/new'],
  [200, '/session/new'],
  [403, '/users'],
  [403, '/taskStatuses'],
  [403, '/taskStatuses/new'],
  [403, '/taskStatuses/new'],
  [403, '/tasks'],
  [403, '/tasks/new'],
  [403, '/labels'],
  [403, '/labels/new'],
  [404, '/wrong-path'],
];
const authUserGetRequests = guestGetRequests
  .map(([status, path]) => (status === 403 ? [200, path] : [status, path]));
let app;
let testUser;

beforeAll(async () => {
  app = await getApp().ready();
  await app
    .objection
    .knex
    .migrate
    .latest();
  testUser = await registerTestUser(app);
  await createTestTaskStatus(app, testUser.sessionCookie);
});

describe('Guest requests', () => {
  test.each(guestGetRequests)('Guest GET %d %p', async (expectedStatus, route) => {
    const res = await request(app.server).get(route);
    expect(res.status).toBe(expectedStatus);
  });
});

describe('Authorized user requests', () => {
  test.each(authUserGetRequests)('Authorized user GET %d %p', async (expectedStatus, route) => {
    const res = await request(app.server)
      .get(route)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(expectedStatus);
  });
});

afterAll(async () => {
  await app
    .objection
    .knex
    .destroy();
  await app.close();
});

import request from 'supertest';
import getApp from '../server';
import {
  mapData,
  prepareApp,
  closeApp,
  registerTestUser,
  createTestTaskStatus,
} from './helpers';

let app;
let testUserForAuth;
const data = mapData(__filename);
const guestGetRequests = [
  [200, '/'],
  [200, '/users/new'],
  [200, '/session/new'],
  [403, '/users'],
  [403, '/taskStatuses'],
  [403, '/taskStatuses/new'],
  [403, '/tasks'],
  [403, '/tasks/new'],
  [403, '/labels'],
  [403, '/labels/new'],
  [404, '/wrong-path'],
];
const authUserGetRequests = guestGetRequests
  .map(([status, path]) => (status === 403 ? [200, path] : [status, path]));

beforeAll(async () => {
  app = await prepareApp(getApp);
  testUserForAuth = await registerTestUser(app);
  await createTestTaskStatus(app, testUserForAuth.sessionCookie);
});

describe('Authorisation tests', () => {
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
        .set('cookie', testUserForAuth.sessionCookie);
      expect(res.status).toBe(expectedStatus);
    });
  });
});
describe('User "CRUD"', () => {
  let testUser = data.user;
  test('Create new user', async () => {
    const res = await request(app.server)
      .post('/users')
      .type('form')
      .send(testUser.data);
    expect(res.status).toBe(302);
  });
  test('User authorization', async () => {
    const { email, password } = testUser.data;
    const res = await request(app.server)
      .post('/session')
      .type('form')
      .send({ email, password });
    expect(res.status).toBe(302);
    const sessionCookie = res
      .headers['set-cookie']
      .join()
      .split(';')
      .slice(0, 1)
      .join();
    const userId = await app.objection.models.user.query().findOne({ email });
    testUser.sessionCookie = sessionCookie;
    testUser.data.id = userId.id;
  });
  test('User self-read', async () => {
    const res = await request(app.server)
      .get(`/users/${testUser.data.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(200);
  });
  test('User change yourself', async () => {
    const { password: newPassword, ...otherUpdationData } = data.updationData;
    const res = await request(app.server)
      .patch(`/users/${testUser.data.id}`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ password: newPassword, ...otherUpdationData });
    expect(res.status).toBe(302);

    const { passwordDigest, id, ...newData } = await app
      .objection
      .models
      .user
      .query()
      .findById(testUser.data.id);
    const { password, id: testUserId, ...oldData } = testUser.data;

    expect(newData).not.toEqual(oldData);
    expect(newData).toEqual(otherUpdationData);
    const sessionCookie = res
      .headers['set-cookie']
      .join()
      .split(';')
      .slice(0, 1)
      .join();
    testUser = {
      data: {
        id: testUserId,
        ...otherUpdationData,
        password: newPassword,
      },
      sessionCookie,
    };
  });
  test('Delete session', async () => {
    const res = await request(app.server)
      .delete('/session')
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(302);
  });
  test('User authorization with upd data', async () => {
    const { email, password } = testUser.data;
    const res = await request(app.server)
      .post('/session')
      .type('form')
      .send({ email, password });
    expect(res.status).toBe(302);
  });
  test('User change other user error', async () => {
    const otherUser = await registerTestUser(app);
    const { newData } = data;
    const res = await request(app.server)
      .patch(`/users/${otherUser.data.id}`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ ...newData });
    expect(res.status).toBe(403);
  });
  test('User delete', async () => {
    const res = await request(app.server)
      .delete(`/users/${testUser.data.id}`)
      .set('cookie', testUser.sessionCookie);
    expect(res.status).toBe(302);
  });
});

afterAll(async () => {
  await closeApp(app);
});

import {
  beforeAll,
  afterAll,
  describe,
  expect,
  test,
} from '@jest/globals';
import request from 'supertest';
import getApp from '../server';
import { registerTestUser, generateUserData } from './helpers';

let app;

beforeAll(async () => {
  app = await getApp().ready();
  await app
    .objection
    .knex
    .migrate
    .latest();
});

describe('User "CRUD"', () => {
  const testUser = { data: generateUserData() };
  let updatedTestUser;
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
    const { password: newPassword, ...updationData } = generateUserData();
    const res = await request(app.server)
      .patch(`/users/${testUser.data.id}`)
      .set('cookie', testUser.sessionCookie)
      .type('form')
      .send({ password: newPassword, ...updationData });
    expect(res.status).toBe(302);

    const { passwordDigest, id, ...newData } = await app
      .objection
      .models
      .user
      .query()
      .findById(testUser.data.id);
    const { password, id: testUserId, ...oldData } = testUser.data;

    expect(newData).not.toEqual(oldData);
    expect(newData).toEqual(updationData);
    const sessionCookie = res
      .headers['set-cookie']
      .join()
      .split(';')
      .slice(0, 1)
      .join();
    updatedTestUser = {
      data: {
        id: testUserId,
        ...updationData,
        password: newPassword,
      },
      sessionCookie,
    };
  });
  test('Delete session', async () => {
    const res = await request(app.server)
      .delete('/session')
      .set('cookie', updatedTestUser.sessionCookie);
    expect(res.status).toBe(302);
  });
  test('User authorization with upd data', async () => {
    const { email, password } = updatedTestUser.data;
    const res = await request(app.server)
      .post('/session')
      .type('form')
      .send({ email, password });
    expect(res.status).toBe(302);
  });
  test('User change other user error', async () => {
    const otherUser = await registerTestUser(app);
    const data = generateUserData();
    const res = await request(app.server)
      .patch(`/users/${otherUser.data.id}`)
      .set('cookie', updatedTestUser.sessionCookie)
      .type('form')
      .send({ ...data });
    expect(res.status).toBe(403);
  });
  test('User delete', async () => {
    const res = await request(app.server)
      .delete(`/users/${updatedTestUser.data.id}`)
      .set('cookie', updatedTestUser.sessionCookie);
    expect(res.status).toBe(302);
  });
});

afterAll(async () => {
  await app
    .objection
    .knex
    .destroy();
  await app.close();
});
